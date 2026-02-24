import { useEffect, useRef } from "react";
import type { UseProofEdgeTrackingOptions, TrackEventPayload } from "../types";

const SUPABASE_TRACK_URL =
  "https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event";

function getMedusaBackendUrl(): string {
  if (
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  ) {
    return process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
  }
  return "";
}

function sendToApi(url: string, payload: TrackEventPayload): Promise<boolean> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((res) => res.ok)
    .catch(() => false);
}

export function useProofEdgeTracking(
  productId: string,
  productTitle: string,
  siteId?: string,
  options?: UseProofEdgeTrackingOptions
): void {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    if (!productId) return;

    trackedRef.current = true;

    const resolvedSiteId =
      siteId ??
      (typeof process !== "undefined"
        ? process.env.NEXT_PUBLIC_PROOFEDGE_SITE_ID
        : undefined) ??
      "";

    if (!resolvedSiteId) {
      console.warn(
        "[ProofEdge] useProofEdgeTracking: siteId is not set. " +
          "Pass siteId prop or set NEXT_PUBLIC_PROOFEDGE_SITE_ID."
      );
      return;
    }

    const payload: TrackEventPayload = {
      site_id: resolvedSiteId,
      event_type: "product_view",
      type: "product_view",
      product_id: productId,
      product_name: productTitle,
      timestamp: new Date().toISOString(),
      platform: "medusajs",
    };

    const backendUrl = options?.medusaBackendUrl ?? getMedusaBackendUrl();

    if (backendUrl) {
      // Try Medusa backend first, fall back to direct Supabase API
      sendToApi(`${backendUrl}/proofedge/track`, payload).then((ok) => {
        if (!ok) {
          sendToApi(SUPABASE_TRACK_URL, payload);
        }
      });
    } else {
      // No Medusa backend configured — send directly to Supabase
      sendToApi(SUPABASE_TRACK_URL, payload);
    }

    return () => {
      trackedRef.current = false;
    };
  }, [productId, productTitle, siteId, options?.medusaBackendUrl]);
}
