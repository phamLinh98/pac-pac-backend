import * as outboxDAL from "../DAL/outboxDAL.js";
import { publishMessage } from "./queueClient.js";

export const publishOutboxBatch = async ({
  limit = 50,
  claim = outboxDAL.claimEvents,
  publish = publishMessage,
  complete = outboxDAL.markPublished,
  retry = outboxDAL.releaseForRetry,
} = {}) => {
  const events = await claim(Math.min(Math.max(limit, 1), 100));
  const results = await Promise.allSettled(events.map(async (event) => {
    try {
      await publish(event);
      await complete(event.id);
      return event.id;
    } catch (error) {
      const delay = Math.min(300, 2 ** Math.min(event.attempt_count, 8));
      await retry(event.id, error instanceof Error ? error.message : String(error), delay);
      throw error;
    }
  }));
  return {
    claimed: events.length,
    published: results.filter((result) => result.status === "fulfilled").length,
    failed: results.filter((result) => result.status === "rejected").length,
  };
};
