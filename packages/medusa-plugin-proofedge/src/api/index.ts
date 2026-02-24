import type ProofEdgeService from "../services/proofedge";

export default function apiRoutes(router: any): any {
  router.post("/proofedge/track", async (req: any, res: any) => {
    try {
      const container = req.scope ?? req.container;
      const proofEdgeService: ProofEdgeService =
        container.resolve("proofEdgeService");

      const { site_id, event_type, product_id, product_name, timestamp } =
        req.body;

      if (!site_id || !event_type || !product_id) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: site_id, event_type, product_id",
        });
      }

      if (event_type === "product_view") {
        await proofEdgeService.sendProductViewEvent({
          site_id,
          event_type: "product_view",
          type: "product_view",
          product_id,
          product_name: product_name ?? "Unknown Product",
          timestamp: timestamp ?? new Date().toISOString(),
          platform: "medusajs",
        });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("[ProofEdge] /proofedge/track error:", error);
      return res.status(500).json({ success: false, error: "Internal error" });
    }
  });

  return router;
}
