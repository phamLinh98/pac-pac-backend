import { insertNotificationFromEvent } from "../DAL/notificationConsumerDAL.js";
import { acknowledgeMessage, nackMessage, receiveMessages } from "./queueClient.js";

export const consumeNotificationBatch = async ({ maxMessages = 20 } = {}) => {
  const { messages = [] } = await receiveMessages(maxMessages, 30);
  let processed = 0;
  let failed = 0;
  for (const message of messages) {
    try {
      await insertNotificationFromEvent(message);
      await acknowledgeMessage(message.receipt_handle);
      processed += 1;
    } catch (error) {
      failed += 1;
      const delay = Math.min(300, 2 ** Math.min(message.receive_count, 8));
      await nackMessage(message.receipt_handle, delay).catch((nackError) => {
        console.error("Queue nack failed:", nackError);
      });
      console.error("Notification message failed:", error);
    }
  }
  return { received: messages.length, processed, failed };
};
