import { User, Store, Slot } from "@prisma/client";
import { generateNotificationMessage } from "@/services/NotificationService";

const smsEnvoiUrl = "https://www.smsenvoi.com/getapi/sendsms/";

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
  const email = process.env.SMS_ENVOI_EMAIL;
  const apiKey = process.env.SMS_ENVOI_API_KEY;
  const smsType = process.env.SMS_ENVOI_TYPE ?? "PREMIUM";
  const sender = process.env.SMS_ENVOI_SENDER;
  const smsEnvoiUrl = process.env.SMS_ENVOI_URL;

  if (!email || !apiKey) {
    throw new Error("SMS_ENVOI_EMAIL or SMS_ENVOI_API_KEY is not configured");
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

  const params = new URLSearchParams({
    email,
    apikey: apiKey,
    destinataire: normalizedPhoneNumber,
    message,
    type: smsType,
  });

  if (sender) {
    params.set("emetteur", sender);
  }

  const response = await fetch(`${smsEnvoiUrl}?${params.toString()}`, {
    method: "GET",
  });

  const rawResult = await response.text();

  let parsedResult: unknown;
  try {
    parsedResult = JSON.parse(rawResult);
  } catch {
    parsedResult = rawResult;
  }

  const isOkResult =
    typeof parsedResult === "object" &&
    parsedResult !== null &&
    "resultat" in parsedResult &&
    (parsedResult as { resultat?: string }).resultat === "OK";

  if (response.ok && (isOkResult || typeof parsedResult === "string")) {
    console.log(
      `[SmsService] SMS envoye avec succes a ${normalizedPhoneNumber}`,
    );
    return;
  }

  throw new Error(`Erreur API SMS Envoi: ${rawResult}`);
};
