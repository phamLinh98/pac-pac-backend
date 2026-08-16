const productionDependencies = async () => {
  const [outboxDAL, queueClient] = await Promise.all([
    import("../DAL/outboxDAL.js"),
    import("./queueClient.js"),
  ]);
  return {
    claim: outboxDAL.claimEvents,
    publish: queueClient.publishMessage,
    complete: outboxDAL.markPublished,
    retry: outboxDAL.releaseForRetry,
  };
};

let dependenciesPromise;
const getProductionDependencies = () => {
  dependenciesPromise ??= productionDependencies();
  return dependenciesPromise;
};

const lazyDependency = (name) => async (...args) => {
  const dependencies = await getProductionDependencies();
  return dependencies[name](...args);
};

export const publishOutboxBatch = async (options = {}) => {
  const limit = options.limit ?? 50;
  const claim = options.claim ?? lazyDependency("claim");
  const publish = options.publish ?? lazyDependency("publish");
  const complete = options.complete ?? lazyDependency("complete");
  const retry = options.retry ?? lazyDependency("retry");

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
