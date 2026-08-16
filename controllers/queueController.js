import { runNotificationPipeline } from "../services/notificationPipeline.js";

export const pumpNotificationQueue = async (_req, res) => {
  try {
    return res.status(200).json(await runNotificationPipeline());
  } catch (error) {
    console.error("Queue pump failed:", error);
    return res.status(503).json({ message: "Queue pipeline unavailable" });
  }
};
