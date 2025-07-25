import { siteConfig } from "../config/site";

export function isTestMode(): boolean {
  return import.meta.env.MODE === "development";
}

export function getStripeConfig() {
  return {
    publishableKey: import.meta.env.STRIPE_PUBLISHABLE_KEY,
    secretKey: import.meta.env.STRIPE_SECRET_KEY,
    webhookSecret: import.meta.env.STRIPE_WEBHOOK_SECRET,
  };
}

/**
 * Get the base URL for the current environment
 * - Development: http://localhost:4321
 * - Production: Uses your custom domain or main Vercel domain
 * - Preview/Test: Uses the specific deployment URL
 * - Can be overridden with SITE_URL environment variable
 */
export function getBaseUrl(): string {
  // Allow manual override via environment variable
  if (import.meta.env.SITE_URL) {
    return import.meta.env.SITE_URL;
  }

  // Development mode
  if (import.meta.env.DEV) {
    return "http://localhost:4321";
  }

  // For preview deployments, check if custom preview domain is set
  if (import.meta.env.PREVIEW_DOMAIN) {
    return `https://${import.meta.env.PREVIEW_DOMAIN}`;
  }

  // On Vercel, use the appropriate URL based on environment
  if (import.meta.env.VERCEL) {
    // For production, use the production domain
    if (import.meta.env.VERCEL_ENV === "production") {
      return `https://${import.meta.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    }
    // For preview/development deployments, use the specific deployment URL
    return `https://${import.meta.env.VERCEL_URL}`;
  }

  // Final fallback - use configured site URL
  return siteConfig.site.url;
}
