const AI_REQUEST_HISTOGRAM_NAME = `ai.request.time`;

function buildHistogramBuckets(name) {
  return {
    type: 'histogram',
    name,
    description: `Duration of ai api requests of ${name} in milliseconds`,
    unit: 'millisecond',
    linearBuckets: {
      start: 0,
      width: 30 * 1000,
      count: 10
    },
    labelNames: ["endpoint"],
    quantiles: [0.5, 0.9, 0.95, 0.99],
    maxAgeSeconds: 60,
    ageBuckets: 10
  };
}

const AI_REQUEST_COUNTER_NAME = `ai.request.count`;

function registerAIRequestCounter(name) {
  return {
    type: "counter",
    name,
    description: `Number of requests of ai request`,
    unit: "request",
    labelNames: ["endpoint", "status"],
    rate: false
  };
}

export function registerMetrics(broker) {
  const histogram = buildHistogramBuckets(AI_REQUEST_HISTOGRAM_NAME);
  broker.metrics.register(histogram);

  const counter = registerAIRequestCounter(AI_REQUEST_COUNTER_NAME);
  broker.metrics.register(counter);
}

export const methods = {
  AIRequestTimer(name) {
    const histogramName = AI_REQUEST_HISTOGRAM_NAME;
    const timeEnd = this.broker.metrics.timer(histogramName, { endpoint: name });

    return (isSucceeded) => {
      timeEnd();
      const status = isSucceeded ? 'succeeded': 'failed';
      this.broker.metrics.increment(
        AI_REQUEST_COUNTER_NAME,
        { endpoint: name, status }
      );
    };
  }
};