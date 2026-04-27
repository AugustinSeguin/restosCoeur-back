import { Request, Response } from "express";
import prisma from "@/libs/prisma";
import { sendSms } from "@/services/SmsService";
import { sendMail } from "@/services/MailService";

/**
 * Send notifications (SMS and Email) to all volunteers assigned to a collection
 * POST /api/collections/:id/notifications
 */
export const sendNotifications = async (req: Request, res: Response) => {
  try {
    const collectionId = Number(req.params.id);

    // Validate collectionId
    if (Number.isNaN(collectionId)) {
      res.status(400).json({ error: "Invalid collection ID" });
      return;
    }

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      res.status(404).json({ message: "Collection not found" });
      return;
    }

    // Get all users associated with the collection
    const collectionUsers = await prisma.collectionUser.findMany({
      where: { collectionId },
      include: { user: true },
    });

    if (collectionUsers.length === 0) {
      res.status(404).json({ message: "No users found for this collection" });
      return;
    }

    const notificationResults = [];

    // Process each user
    for (const collectionUser of collectionUsers) {
      const user = collectionUser.user;

      // Get all assignments for this user in this collection
      const assignments = await prisma.assignment.findMany({
        where: {
          collectionId,
          userId: user.id,
        },
        include: { slot: true, store: true },
      });

      // Send notifications for each assignment
      for (const assignment of assignments) {
        try {
          // Send SMS
          await sendSms(
            collection.title,
            user,
            assignment.slot,
            assignment.store,
          );

          // Send Email
          await sendMail(
            collection.title,
            user,
            assignment.slot,
            assignment.store,
          );

          notificationResults.push({
            userId: user.id,
            userName: `${user.firstName} ${user.lastName}`,
            assignmentId: `${assignment.userId}_${assignment.slotId}_${assignment.storeId}`,
            status: "sent",
          });
        } catch (error) {
          notificationResults.push({
            userId: user.id,
            userName: `${user.firstName} ${user.lastName}`,
            assignmentId: `${assignment.userId}_${assignment.slotId}_${assignment.storeId}`,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    res.status(200).json({
      message: "Notifications processed",
      collectionId,
      totalUsers: collectionUsers.length,
      results: notificationResults,
    });
  } catch (error) {
    console.error("Error in sendNotifications:", error);
    res.status(500).json({
      error: "Failed to send notifications",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
