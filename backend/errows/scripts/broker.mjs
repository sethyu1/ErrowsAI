import { ServiceBroker } from "moleculer";

export default async function createBroker(verbose = false) {
  const { default: config } = await import("config");

  return new ServiceBroker({
    ...config.commander,
    logger: verbose
  });
}