import { User, Store, Slot } from "@prisma/client";
import nodemailer from "nodemailer";
import { generateNotificationMessage } from "@/services/NotificationService";

/**
 * Send email notification to a user for a slot and store
 * @param collectionName The name of the collection for the notification
 * @param user The user to send email to
 * @param slot The slot details
 * @param store The store details
 */
export const sendMail = async (
  collectionName: string,
  user: User,
  slot: Slot,
  store: Store,
): Promise<void> => {
  const mailHost = process.env.MAIL_HOST;
  const mailPort = Number(process.env.MAIL_PORT ?? "587");
  const mailSecure = process.env.MAIL_SECURE === "true";
  const mailUser = process.env.MAIL_USER;
  const mailPass = process.env.MAIL_PASS;
  const mailFrom = process.env.MAIL_FROM ?? mailUser;

  if (!mailHost || !mailUser || !mailPass || !mailFrom) {
    throw new Error(
      "MAIL_HOST, MAIL_USER, MAIL_PASS or MAIL_FROM is not configured",
    );
  }

  if (!user.email) {
    console.error(`[MailService] Aucun email pour l'utilisateur ${user.id}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: mailHost,
    port: mailPort,
    secure: mailSecure,
    auth: {
      user: mailUser,
      pass: mailPass,
    },
  });

  const textMessage = generateNotificationMessage(
    collectionName,
    user,
    slot,
    store,
  );

  await transporter.sendMail({
    from: mailFrom,
    to: user.email,
    subject: `Collecte ${collectionName} - Votre assignation au ${store.title}`,
    text: textMessage,
    html: textMessage.replaceAll("\n", "<br>"),
  });

  console.log(`[MailService] Email envoye avec succes a ${user.email}`);
};
