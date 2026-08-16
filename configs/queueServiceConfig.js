const trimSlash = (value) => value?.trim().replace(/\/+$/, "");

export const getQueueServiceConfig = () => {
  const baseUrl = trimSlash(process.env.QUEUE_SERVICE_URL);
  const apiKey = process.env.QUEUE_SERVICE_API_KEY?.trim();
  if (!baseUrl || !apiKey) throw new Error("QUEUE_SERVICE_URL and QUEUE_SERVICE_API_KEY are required");
  return { baseUrl, apiKey, queueName: process.env.NOTIFICATION_QUEUE_NAME?.trim() || "notifications" };
};
