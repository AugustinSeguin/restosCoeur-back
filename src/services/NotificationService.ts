import { User, Slot, Store } from "@prisma/client";

const formatDate = (value: Date): string => {
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const generateNotificationMessage = (
  collectionName: string,
  user: User,
  slot: Slot,
  store: Store,
): string => {
  const slotRange = `${formatDate(slot.startAt)} - ${formatDate(slot.endAt)}`;

  return `Bonjour ${user.firstName},
Merci de nous aider pour la collecte ${collectionName}.
Vous avez ete assigne au ${store.title} le ${slotRange}
On compte sur vous
Les restos du coeur`;
};
