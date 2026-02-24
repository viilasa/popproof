export type WidgetPosition =
  | "bottom-left"
  | "bottom-right"
  | "top-left"
  | "top-right";

export type WidgetTheme = "light" | "dark" | "auto";

export interface ProofEdgeWidgetProps {
  /** Your ProofEdge Site ID from the dashboard. Required. */
  siteId: string;
  /** Medusa product ID. When provided, widget filters to this product's events. */
  productId?: string;
  /** Widget screen position. Default: "bottom-left" */
  position?: WidgetPosition;
  /** Widget color theme. Default: "light" */
  theme?: WidgetTheme;
  /** Callback invoked when the widget script has loaded successfully. */
  onLoad?: () => void;
}

export interface UseProofEdgeTrackingOptions {
  /** The Medusa backend URL. Reads from NEXT_PUBLIC_MEDUSA_BACKEND_URL by default. */
  medusaBackendUrl?: string;
}

export interface TrackEventPayload {
  site_id: string;
  event_type: string;
  type: string;
  product_id: string;
  product_name: string;
  timestamp: string;
  platform: "medusajs";
  metadata?: Record<string, unknown>;
}
