import { User, Store, Slot } from "@prisma/client";
import { generateNotificationMessage } from "@/services/NotificationService";

const defaultSmsPartnerUrl = "https://api.smspartner.fr/v1/send";

/**
 * Send SMS notification to a user for a slot and store
 * Implementation to be completed
 * @param collectionName The name of the collection for the notification
 * @param user The user to send SMS to
 * @param slot The slot details
 * @param store The store details
 */
export const sendSms = async (
  collectionName: string,
  user: User,
  slot: Slot,
  store: Store,
): Promise<void> => {
  const apiKey = process.env.SMS_API_KEY;
  const gamme = process.env.SMS_GAMME ?? process.env.SMS_TYPE ?? "1";
  const sender = process.env.SMS_SENDER;
  const smsUrl = process.env.SMS_URL ?? defaultSmsPartnerUrl;

  if (!apiKey) {
    throw new Error("SMS_API_KEY is not configured");
  }

  if (!user.phoneNumber) {
    console.error(
      `[SmsService] Aucun numero de telephone pour l'utilisateur ${user.id}`,
    );
    return;
  }

  const normalizedPhoneNumber = user.phoneNumber.replaceAll(/\D/g, "");
  const message = generateNotificationMessage(
    collectionName,
    user,
    slot,
    store,
  );

  const response = await fetch(smsUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "cache-control": "no-cache",
    },
    body: JSON.stringify({
      apiKey,
      phoneNumbers: `+${normalizedPhoneNumber}`,
      sender: sender ?? "RESTOS",
      gamme: Number(gamme) || 1,
      message,
    }),
  });

  const rawResult = await response.text();

  if (response.ok) {
    console.log(
      `[SmsService] SMS envoye avec succes a ${normalizedPhoneNumber}`,
    );
    return;
  }

  throw new Error(`Erreur API SMS Partner: ${rawResult}`);
};
