import ProofEdgeService from "../services/proofedge";

interface ProductViewedEventData {
  id: string;
  title?: string;
}

interface MedusaEventBusService {
  subscribe(
    event: string,
    handler: (data: unknown) => Promise<void>
  ): void;
}

class ProofEdgeProductSubscriber {
  static identifier = "proofEdgeProductSubscriber";

  private proofEdgeService_: ProofEdgeService;

  constructor({
    eventBusService,
    proofEdgeService,
  }: {
    eventBusService: MedusaEventBusService;
    proofEdgeService: ProofEdgeService;
  }) {
    this.proofEdgeService_ = proofEdgeService;

    if (proofEdgeService.isEventEnabled("product.viewed")) {
      eventBusService.subscribe(
        "product.viewed",
        this.handleProductViewed.bind(this)
      );
    }
  }

  handleProductViewed = async (data: unknown): Promise<void> => {
    const eventData = data as ProductViewedEventData;

    try {
      await this.proofEdgeService_.sendProductViewEvent({
        site_id: this.proofEdgeService_.getSiteId(),
        event_type: "product_view",
        type: "product_view",
        product_id: eventData.id ?? "unknown",
        product_name: eventData.title ?? "Unknown Product",
        timestamp: new Date().toISOString(),
        platform: "medusajs",
      });
    } catch (error) {
      console.error("[ProofEdge] Error handling product.viewed:", error);
    }
  };
}

export default ProofEdgeProductSubscriber;
