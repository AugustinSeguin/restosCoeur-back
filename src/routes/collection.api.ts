import { Request, Response } from "express";
import prisma from "@/libs/prisma";

const hhmmToMinutes = (value: string): number | null => {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
};

const dateToMinutes = (value: Date): number =>
  value.getHours() * 60 + value.getMinutes();

const normalizeIds = (ids: unknown): number[] => {
  if (!Array.isArray(ids)) return [];

  const normalized = ids
    .map((id) => (typeof id === "string" ? Number.parseInt(id, 10) : id))
    .filter((id): id is number => Number.isInteger(id) && id > 0);

  return [...new Set(normalized)];
};

const findInvalidUserIds = async (userIds: number[]): Promise<number[]> => {
  if (userIds.length === 0) return [];

  const existingUsers = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true },
  });

  const existingIds = new Set(existingUsers.map((user) => user.id));
  return userIds.filter((id) => !existingIds.has(id));
};

export const createCollection = async (req: Request, res: Response) => {
  try {
    const { title, isActive, formUrl, userIds } = req.body;
    const normalizedUserIds = normalizeIds(userIds);

    const invalidUserIds = await findInvalidUserIds(normalizedUserIds);
    if (invalidUserIds.length > 0) {
      return res.status(400).json({
        error: "Some userIds are invalid or do not exist",
        invalidUserIds,
      });
    }

    const collection = await prisma.collection.create({
      data: {
        title,
        isActive: isActive ?? true,
        formUrl,
        users: {
          create: normalizedUserIds.map((userId) => ({
            user: {
              connect: { id: userId },
            },
          })),
        },
      },
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
    });
    res.status(201).json(collection);
  } catch (error) {
    res.status(400).json({ error: "Failed to create collection" });
  }
};

export const updateCollection = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { title, isActive, formUrl, userIds } = req.body;
    const normalizedUserIds = normalizeIds(userIds);

    const invalidUserIds = await findInvalidUserIds(normalizedUserIds);
    if (invalidUserIds.length > 0) {
      return res.status(400).json({
        error: "Some userIds are invalid or do not exist",
        invalidUserIds,
      });
    }

    const collection = await prisma.collection.update({
      where: { id: Number.parseInt(id) },
      data: {
        title,
        isActive,
        formUrl,
        ...(Array.isArray(userIds) && {
          users: {
            deleteMany: {},
            create: normalizedUserIds.map((userId) => ({
              user: {
                connect: { id: userId },
              },
            })),
          },
        }),
      },
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
    });
    res.json(collection);
  } catch (error) {
    res.status(400).json({ error: "Failed to update collection" });
  }
};

export const getCollectionById = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const collectionId = Number.parseInt(id);

    if (!Number.isInteger(collectionId) || collectionId <= 0) {
      return res.status(400).json({ error: "Invalid collection id" });
    }

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        users: {
          include: {
            user: {
              include: {
                assignments: {
                  where: { collectionId },
                  include: {
                    slot: true,
                    store: true,
                  },
                },
              },
            },
            userAnswers: {
              where: { collectionId },
            },
          },
        },
        slots: true,
        zones: {
          include: {
            zone: {
              include: {
                stores: true,
              },
            },
          },
        },
      },
    });
    if (!collection)
      return res.status(404).json({ error: "Collection not found" });

    const storesInCollection = collection.zones.flatMap((collectionZone) => {
      const zoneSummary = {
        id: collectionZone.zone.id,
        title: collectionZone.zone.title,
      };

      return collectionZone.zone.stores.map((store) => ({
        ...store,
        zone: zoneSummary,
      }));
    });

    const enrichedSlots = collection.slots.map((slot) => {
      const slotStartInMinutes = dateToMinutes(slot.startAt);
      const slotEndInMinutes = dateToMinutes(slot.endAt);
      const slotStartsOnSunday = slot.startAt.getDay() === 0;
      const slotEndsOnSunday = slot.endAt.getDay() === 0;

      const openStores = storesInCollection.filter((store) => {
        if ((slotStartsOnSunday || slotEndsOnSunday) && !store.isOpenSunday) {
          return false;
        }

        const openingTimeInMinutes = hhmmToMinutes(store.openingTime);
        const closingTimeInMinutes = hhmmToMinutes(store.closingTime);
        if (openingTimeInMinutes === null || closingTimeInMinutes === null)
          return false;

        // Inclusive boundaries: openingTime <= slot.startAt and slot.endAt <= closingTime.
        return (
          openingTimeInMinutes <= slotStartInMinutes &&
          slotEndInMinutes <= closingTimeInMinutes
        );
      });

      return {
        ...slot,
        openStores,
      };
    });

    const response = {
      id: collection.id,
      title: collection.title,
      isActive: collection.isActive,
      formUrl: collection.formUrl,
      users: collection.users.map((collectionUser) => {
        const assignments = collectionUser.user.assignments.filter(
          (assignment) =>
            assignment.userId === collectionUser.userId &&
            assignment.collectionId === collectionId,
        );

        const userAnswers = collectionUser.userAnswers.filter(
          (userAnswer) =>
            userAnswer.userId === collectionUser.userId &&
            userAnswer.collectionId === collectionId,
        );

        return {
          ...collectionUser.user,
          assignments,
          userAnswers,
        };
      }),
      slots: enrichedSlots,
    };

    res.json(response);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch collection" });
  }
};

export const getAllCollections = async (req: Request, res: Response) => {
  try {
    const collections = await prisma.collection.findMany({
      include: {
        zones: true,
        slots: true,
        users: {
          include: {
            user: true,
          },
        },
      },
    });
    res.json(collections);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch collections" });
  }
};
