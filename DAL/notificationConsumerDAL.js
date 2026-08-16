import sql from "../configs/db.js";
import { insertFromEvent } from "../models/notificationConsumerModel.js";

export const insertNotificationFromEvent = ({ id, payload }) => {
  const { query, values } = insertFromEvent(id, payload);
  return sql(query, values);
};
