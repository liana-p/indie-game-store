// Some of those values aren't used yet, but might be useful in the future
export const siteConfig = {
  developer: {
    name: "Example store",
    bio: "A studio bio.",
    email: "contact@my-email.com",
    support_email: "support@my-email.com",
    logo: "/images/studio-logo.png",
    social: {
      // Not used yet
      bluesky: "https://bsky.app/yourstudio",
      discord: "https://discord.gg/yourstudio",
      // Add other social links as needed
    },
  },
  site: {
    title: "Example Store",
    description: "Buy our games",
    ogImage: "/images/og-image.jpg",
    // Make sure this is your final domain, or links will break!
    url: "https://example-store.com",
    currency: "USD",
    locale: "en-US",
    copyrightNotice: "© 2025 Example Store. All rights reserved.",
  },
  layout: {
    show_featured_first: true,
    games_per_row: 3,
    enable_search: true,
    show_system_requirements: true,
    show_landing_content: true, // Set to false to hide the landing markdown content
    game_layout: "full-width", // "grid" (multiple columns) or "full-width" (single column, good for single games)
  },
  payments: {
    enable_stripe_tax: true,
  },

  // Email configuration
  email: {
    // For development, use Resend's onboarding domain
    // Once you have a domain, replace with your verified domain emails
    // This is the email that download links will be sent from
    from_downloads: "download@example-store.com",
  },
  // Not implemented yet, future mailing list integration
  mailing_list: {
    enabled: false,
    provider: "buttondown" as const,
    signup_text: "Sign up to our updates",
  },

  // File storage configuration
  file_storage: {
    provider: "cloudflare-r2" as const, // or "bunny-net" or "local"
    download_expires_hours: 48,
    max_downloads_per_purchase: 50000,
  },
} as const;
