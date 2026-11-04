import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";
import { sanitizeIdentityHeaders } from "../lib/request-security";

const worker = {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    // Production fails closed until the operator explicitly configures a
    // trusted Sites gateway. Never enable this on a directly reachable Worker.
    request = sanitizeIdentityHeaders(
      request,
      import.meta.env.DEV || env.COMMONWELL_TRUST_SITES_IDENTITY === "true",
    );
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    const result = await runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
    const response = new Response(result.body, result);
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (response.headers.get("content-type")?.includes("text/html")) {
      response.headers.set("Cache-Control", "private, no-store");
    }
    return response;
  },
};

export default worker;
