import sql from "../configs/db.js";
import * as model from "../models/outboxModel.js";

const run = ({ query, values }) => sql(query, values);
export const claimEvents = (limit) => run(model.claimEvents(limit));
export const markPublished = (eventId) => run(model.markPublished(eventId));
export const releaseForRetry = (eventId, error, delaySeconds) =>
  run(model.releaseForRetry(eventId, error, delaySeconds));
