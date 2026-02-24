import ProofEdgeService from "./services/proofedge";
import ProofEdgeOrderSubscriber from "./subscribers/order-placed";
import ProofEdgeProductSubscriber from "./subscribers/product-viewed";
import type { ProofEdgePluginOptions } from "./services/proofedge";

export default function loadPlugin(
  container: any,
  options: ProofEdgePluginOptions
): void {
  const service = new ProofEdgeService(options);

  // Register using Medusa's container (awilix is provided by Medusa at runtime)
  container.register({
    proofEdgeService: {
      resolve: () => service,
    },
  });

  container.register({
    [ProofEdgeOrderSubscriber.identifier]: {
      resolve: (c: any) =>
        new ProofEdgeOrderSubscriber({
          eventBusService: c.resolve("eventBusService"),
          orderService: c.resolve("orderService"),
          proofEdgeService: service,
        }),
    },
  });

  container.register({
    [ProofEdgeProductSubscriber.identifier]: {
      resolve: (c: any) =>
        new ProofEdgeProductSubscriber({
          eventBusService: c.resolve("eventBusService"),
          proofEdgeService: service,
        }),
    },
  });
}
