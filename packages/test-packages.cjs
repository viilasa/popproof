/**
 * Smoke test for both packages.
 * Run with: node packages/test-packages.cjs
 */

const assert = require("assert");

console.log("=== Testing medusa-plugin-proofedge ===\n");

// 1. Import the plugin
const loadPlugin = require("./medusa-plugin-proofedge/dist/index").default;
console.log("[PASS] Plugin entry point loads");

// 2. Import the service directly
const ProofEdgeService =
  require("./medusa-plugin-proofedge/dist/services/proofedge").default;
console.log("[PASS] ProofEdgeService loads");

// 3. Test service instantiation with valid options
const service = new ProofEdgeService({
  site_id: "test-site-123",
  api_key: "test-key-456",
  debug: true,
});
console.log("[PASS] ProofEdgeService instantiates with valid options");

// 4. Test getSiteId
assert.strictEqual(service.getSiteId(), "test-site-123");
console.log("[PASS] getSiteId() returns correct site_id");

// 5. Test isEventEnabled defaults
assert.strictEqual(service.isEventEnabled("order.placed"), true);
assert.strictEqual(service.isEventEnabled("product.viewed"), false);
console.log('[PASS] isEventEnabled() defaults: order.placed=true, product.viewed=false');

// 6. Test service with custom events
const service2 = new ProofEdgeService({
  site_id: "test",
  api_key: "test",
  events: ["order.placed", "product.viewed"],
});
assert.strictEqual(service2.isEventEnabled("product.viewed"), true);
console.log("[PASS] isEventEnabled() respects custom events config");

// 7. Test missing site_id throws
try {
  new ProofEdgeService({ site_id: "", api_key: "test" });
  console.log("[FAIL] Should have thrown for missing site_id");
  process.exit(1);
} catch (e) {
  assert(e.message.includes("site_id"));
  console.log("[PASS] Throws on missing site_id");
}

// 8. Test missing api_key throws
try {
  new ProofEdgeService({ site_id: "test", api_key: "" });
  console.log("[FAIL] Should have thrown for missing api_key");
  process.exit(1);
} catch (e) {
  assert(e.message.includes("api_key"));
  console.log("[PASS] Throws on missing api_key");
}

// 9. Import subscribers
const OrderSubscriber =
  require("./medusa-plugin-proofedge/dist/subscribers/order-placed").default;
const ProductSubscriber =
  require("./medusa-plugin-proofedge/dist/subscribers/product-viewed").default;
console.log("[PASS] Both subscribers load");

// 10. Test subscriber identifiers
assert.strictEqual(
  OrderSubscriber.identifier,
  "proofEdgeOrderSubscriber"
);
assert.strictEqual(
  ProductSubscriber.identifier,
  "proofEdgeProductSubscriber"
);
console.log("[PASS] Subscriber identifiers are correct");

// 11. Test subscriber subscribes to events
let subscribedEvents = [];
const mockEventBus = {
  subscribe: (event, handler) => {
    subscribedEvents.push(event);
  },
};
const mockOrderService = { retrieve: async () => ({}) };

new OrderSubscriber({
  eventBusService: mockEventBus,
  orderService: mockOrderService,
  proofEdgeService: service,
});
assert(subscribedEvents.includes("order.placed"));
console.log("[PASS] OrderSubscriber subscribes to order.placed");

// 12. Test ProductSubscriber does NOT subscribe when event disabled
subscribedEvents = [];
new ProductSubscriber({
  eventBusService: mockEventBus,
  proofEdgeService: service, // default events only has order.placed
});
assert(!subscribedEvents.includes("product.viewed"));
console.log(
  "[PASS] ProductSubscriber skips subscription when product.viewed not enabled"
);

// 13. Test ProductSubscriber DOES subscribe when event enabled
subscribedEvents = [];
new ProductSubscriber({
  eventBusService: mockEventBus,
  proofEdgeService: service2, // has product.viewed enabled
});
assert(subscribedEvents.includes("product.viewed"));
console.log(
  "[PASS] ProductSubscriber subscribes when product.viewed is enabled"
);

// 14. Import API routes
const apiRoutes =
  require("./medusa-plugin-proofedge/dist/api/index").default;
assert.strictEqual(typeof apiRoutes, "function");
console.log("[PASS] API routes export is a function");

console.log("\n=== Testing @proofedge/medusa-storefront ===\n");

// 15. Import storefront package
const storefront = require("./medusa-storefront/dist/index");
console.log("[PASS] Storefront package loads");

// 16. Verify exports exist
assert.strictEqual(typeof storefront.ProofEdgeWidget, "function");
console.log("[PASS] ProofEdgeWidget is exported as a function");

assert.strictEqual(typeof storefront.useProofEdgeTracking, "function");
console.log("[PASS] useProofEdgeTracking is exported as a function");

console.log("\n========================================");
console.log("ALL 16 TESTS PASSED");
console.log("========================================\n");
