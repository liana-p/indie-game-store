import type { APIRoute } from "astro";
import Stripe from "stripe";
import { getCollection } from "astro:content";
import { siteConfig } from "../../config/site";
import { getBaseUrl } from "../../lib/utils";
import { getStorageAdapter, type PurchaseData } from "../../lib/storage";

// Explicitly mark this route as server-rendered
export const prerender = false;

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY!);

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log("🛒 Checkout API called");
    const body = await request.text();
    console.log("📥 Received body:", body);

    const data = body ? JSON.parse(body) : {};
    console.log("📊 Parsed data:", data);

    const { gameId, email } = data;
    console.log("Extracted gameId:", gameId, "email:", email);

    if (!gameId) {
      console.log("No gameId found, returning error");
      return new Response(JSON.stringify({ error: "Game ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!email) {
      console.log("No email found, returning error");
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Load games and find the requested one
    const games = await getCollection("games");
    const game = games.find((g) => g.id === gameId);

    if (!game) {
      return new Response(JSON.stringify({ error: "Game not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user has already purchased this game
    const storage = await getStorageAdapter();
    const alreadyPurchased = await storage.hasUserPurchased(email, gameId);

    if (alreadyPurchased) {
      console.log(`User ${email} already owns game ${gameId}`);
      return new Response(
        JSON.stringify({
          error:
            "You already own this game! Check your email for download links.",
          code: "ALREADY_PURCHASED",
          recoveryUrl: `${getBaseUrl()}/recover-download`,
        }),
        {
          status: 409, // Conflict
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate download URL (placeholder for now)
    const downloadUrl = `${getBaseUrl()}/download/${gameId}?token=placeholder`;
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 48); // 48 hour expiry

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: siteConfig.site.currency.toLowerCase(),
            product_data: {
              name: game.data.title,
              description: game.data.description,
              images: game.data.thumbnail
                ? [`${siteConfig.site.url}${game.data.thumbnail}`]
                : [],
              metadata: {
                game_id: gameId,
                file_count: game.data.files.length.toString(),
                total_size_gb: game.data.files
                  .reduce((sum, f) => sum + f.size_gb, 0)
                  .toString(),
              },
            },
            unit_amount: Math.round(game.data.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",

      // Enable automatic tax collection if configured
      ...(siteConfig.payments.enable_stripe_tax && {
        automatic_tax: { enabled: true },
        tax_id_collection: { enabled: true },
      }),

      success_url: `${getBaseUrl()}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getBaseUrl()}/`,

      // Use the provided customer email
      customer_email: email,

      metadata: {
        game_id: gameId,
        store_name: siteConfig.developer.name,
      },
    });

    console.log("✅ Stripe session created:", session.id);
    return new Response(JSON.stringify({ sessionId: session.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create checkout session" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
