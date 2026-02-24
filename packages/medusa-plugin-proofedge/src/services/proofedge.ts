import https from "https";
import http from "http";
import { URL } from "url";

export interface ProofEdgePluginOptions {
  site_id: string;
  api_key: string;
  events?: string[];
  api_url?: string;
  debug?: boolean;
}

export interface ProofEdgePurchasePayload {
  site_id: string;
  event_type: "purchase";
  type: "purchase";
  product_id: string;
  product_name: string;
  customer_first_name: string;
  city: string;
  country: string;
  timestamp: string;
  platform: "medusajs";
  metadata?: Record<string, unknown>;
}

export interface ProofEdgeProductViewPayload {
  site_id: string;
  event_type: "product_view";
  type: "product_view";
  product_id: string;
  product_name: string;
  timestamp: string;
  platform: "medusajs";
}

function post(
  url: string,
  headers: Record<string, string>,
  body: string
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const transport = parsed.protocol === "https:" ? https : http;

    const req = transport.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body).toString(),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk: string) => (data += chunk));
        res.on("end", () =>
          resolve({ status: res.statusCode ?? 0, body: data })
        );
      }
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

class ProofEdgeService {
  static identifier = "proofEdgeService";

  private options: Required<ProofEdgePluginOptions>;
  private apiUrl: string;

  constructor(options: ProofEdgePluginOptions) {
    if (!options.site_id) {
      throw new Error("[ProofEdge] Missing required option: site_id");
    }
    if (!options.api_key) {
      throw new Error("[ProofEdge] Missing required option: api_key");
    }

    this.options = {
      site_id: options.site_id,
      api_key: options.api_key,
      events: options.events ?? ["order.placed"],
      api_url:
        options.api_url ??
        "https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1",
      debug: options.debug ?? false,
    };

    this.apiUrl = `${this.options.api_url.replace(/\/$/, "")}/track-event`;
  }

  private log(...args: unknown[]): void {
    if (this.options.debug) {
      console.log("[ProofEdge]", ...args);
    }
  }

  private logError(...args: unknown[]): void {
    console.error("[ProofEdge ERROR]", ...args);
  }

  getSiteId(): string {
    return this.options.site_id;
  }

  isEventEnabled(eventName: string): boolean {
    return this.options.events.includes(eventName);
  }

  async sendPurchaseEvent(payload: ProofEdgePurchasePayload): Promise<void> {
    this.log("Sending purchase event:", JSON.stringify(payload));

    try {
      const result = await post(
        this.apiUrl,
        {
          "X-ProofEdge-API-Key": this.options.api_key,
          "X-ProofEdge-Site-ID": this.options.site_id,
          "User-Agent": "medusa-plugin-proofedge/1.1.0",
        },
        JSON.stringify(payload)
      );

      if (result.status < 200 || result.status >= 300) {
        this.logError(`API request failed: ${result.status}`, result.body);
        return;
      }

      this.log("Purchase event sent successfully:", result.body);
    } catch (error) {
      this.logError("Failed to send purchase event:", error);
    }
  }

  async sendProductViewEvent(
    payload: ProofEdgeProductViewPayload
  ): Promise<void> {
    this.log("Sending product view event:", JSON.stringify(payload));

    try {
      const result = await post(
        this.apiUrl,
        {
          "X-ProofEdge-API-Key": this.options.api_key,
          "X-ProofEdge-Site-ID": this.options.site_id,
          "User-Agent": "medusa-plugin-proofedge/1.1.0",
        },
        JSON.stringify(payload)
      );

      if (result.status < 200 || result.status >= 300) {
        this.logError(
          `API request failed (product view): ${result.status}`,
          result.body
        );
        return;
      }

      this.log("Product view event sent successfully.");
    } catch (error) {
      this.logError("Failed to send product view event:", error);
    }
  }
}

export default ProofEdgeService;
