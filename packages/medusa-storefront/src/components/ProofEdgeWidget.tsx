import { useEffect, useRef } from "react";
import type { ProofEdgeWidgetProps } from "../types";

const PIXEL_LOADER_URL =
  "https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/pixel-loader";

export function ProofEdgeWidget({
  siteId,
  productId,
  position = "bottom-left",
  theme = "light",
  onLoad,
}: ProofEdgeWidgetProps) {
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[data-site-id="${siteId}"]`
    );
    if (existingScript) {
      scriptRef.current = existingScript;
      return;
    }

    const script = document.createElement("script");
    script.src = PIXEL_LOADER_URL;
    script.async = true;
    script.setAttribute("data-site-id", siteId);

    if (productId) {
      script.setAttribute("data-product-id", productId);
    }

    script.setAttribute("data-position", position);
    script.setAttribute("data-theme", theme);

    script.onload = () => {
      if (onLoad) {
        onLoad();
      }
    };

    script.onerror = () => {
      console.error("[ProofEdge] Failed to load widget script.");
    };

    document.body.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (scriptRef.current && document.body.contains(scriptRef.current)) {
        document.body.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
      mountedRef.current = false;
    };
  }, [siteId, productId, position, theme, onLoad]);

  return null;
}
