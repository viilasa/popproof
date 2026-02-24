import ProofEdgeService from "../services/proofedge";

interface MedusaOrderItem {
  title: string;
  variant?: {
    product?: {
      id: string;
      title: string;
    };
  };
}

interface MedusaShippingAddress {
  first_name?: string;
  city?: string;
  country_code?: string;
}

interface MedusaOrder {
  id: string;
  items: MedusaOrderItem[];
  shipping_address?: MedusaShippingAddress;
  billing_address?: MedusaShippingAddress;
  created_at?: string;
}

interface OrderPlacedEventData {
  id: string;
}

interface MedusaOrderService {
  retrieve(
    orderId: string,
    config?: { relations?: string[] }
  ): Promise<MedusaOrder>;
}

interface MedusaEventBusService {
  subscribe(
    event: string,
    handler: (data: unknown) => Promise<void>
  ): void;
}

class ProofEdgeOrderSubscriber {
  static identifier = "proofEdgeOrderSubscriber";

  private orderService_: MedusaOrderService;
  private proofEdgeService_: ProofEdgeService;

  constructor({
    eventBusService,
    orderService,
    proofEdgeService,
  }: {
    eventBusService: MedusaEventBusService;
    orderService: MedusaOrderService;
    proofEdgeService: ProofEdgeService;
  }) {
    this.orderService_ = orderService;
    this.proofEdgeService_ = proofEdgeService;

    if (proofEdgeService.isEventEnabled("order.placed")) {
      eventBusService.subscribe(
        "order.placed",
        this.handleOrderPlaced.bind(this)
      );
    }
  }

  handleOrderPlaced = async (data: unknown): Promise<void> => {
    const { id } = data as OrderPlacedEventData;

    try {
      const order = await this.orderService_.retrieve(id, {
        relations: [
          "items",
          "items.variant",
          "items.variant.product",
          "shipping_address",
          "billing_address",
        ],
      });

      const address = order.shipping_address ?? order.billing_address ?? {};
      const firstName = address.first_name ?? "Someone";
      const city = address.city ?? "";
      const country = address.country_code
        ? address.country_code.toUpperCase()
        : "";
      const timestamp = order.created_at ?? new Date().toISOString();

      for (const item of order.items) {
        const productId = item.variant?.product?.id ?? "unknown";
        const productName =
          item.variant?.product?.title ?? item.title ?? "A product";

        await this.proofEdgeService_.sendPurchaseEvent({
          site_id: this.proofEdgeService_.getSiteId(),
          event_type: "purchase",
          type: "purchase",
          product_id: productId,
          product_name: productName,
          customer_first_name: firstName,
          city,
          country,
          timestamp,
          platform: "medusajs",
          metadata: {
            order_id: order.id,
            platform: "medusajs",
          },
        });
      }
    } catch (error) {
      console.error("[ProofEdge] Error handling order.placed:", error);
    }
  };
}

export default ProofEdgeOrderSubscriber;
