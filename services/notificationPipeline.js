import { waitUntil } from "@vercel/functions";
import { consumeNotificationBatch } from "./notificationConsumer.js";
import { publishOutboxBatch } from "./outboxPublisher.js";

export const runNotificationPipeline = async () => {
  const published = await publishOutboxBatch();
  const consumed = await consumeNotificationBatch();
  return { published, consumed };
};

export const scheduleNotificationPipeline = () => {
  const operation = runNotificationPipeline().catch((error) => {
    console.error("Notification pipeline error:", error);
  });
  try { waitUntil(operation); } catch { /* Local Node keeps the promise alive. */ }
};
