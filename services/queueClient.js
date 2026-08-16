import { getQueueServiceConfig } from "../configs/queueServiceConfig.js";

const request = async (path, options = {}) => {
  const { baseUrl, apiKey } = getQueueServiceConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "content-type": "application/json", "x-service-api-key": apiKey, ...options.headers },
    signal: AbortSignal.timeout(10000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Queue ${response.status}: ${body.message || "request failed"}`);
  return body;
};

const path = () => `/api/v1/queues/${encodeURIComponent(getQueueServiceConfig().queueName)}/messages`;

export const publishMessage = (event) => request(path(), {
  method: "POST",
  body: JSON.stringify({ messageId: event.id, type: event.event_type, payload: event.payload }),
});

export const receiveMessages = (maxMessages = 20, visibilityTimeoutSeconds = 30) =>
  request(`${path()}/receive`, {
    method: "POST",
    body: JSON.stringify({ maxMessages, visibilityTimeoutSeconds }),
  });

export const acknowledgeMessage = (receiptHandle) => request(`${path()}/${receiptHandle}/ack`, {
  method: "POST", body: "{}",
});

export const nackMessage = (receiptHandle, delaySeconds) => request(`${path()}/${receiptHandle}/nack`, {
  method: "POST", body: JSON.stringify({ delaySeconds }),
});
