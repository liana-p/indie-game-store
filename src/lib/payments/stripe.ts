import Stripe from "stripe";
import type { PaymentProvider, CheckoutSession, PurchaseDetails, WebhookResult } from "./types";
import { getCollection } from "astro:content";
import { siteConfig } from "../../config/site";
import { getBaseUrl } from "../utils";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY!);

export const StripeProvider: PaymentProvider = {
  getName: () => "stripe",

  async createCheckoutSession({ gameId, email }) {
    // Load game data
    const games = await getCollection("games");
    const game = games.find((g) => g.id === gameId);
    if (!game) throw new Error("Game not found");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: siteConfig.site.currency.toLowerCase(),
            product_data: {
              name: game.data.title,
              description: game.data.description,
              images: game.data.thumbnail ? [`${siteConfig.site.url}${game.data.thumbnail}`] : [],
              metadata: {
                game_id: gameId,
              },
            },
            unit_amount: Math.round(game.data.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: email,
      success_url: `${getBaseUrl()}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getBaseUrl()}/`,
      metadata: {
        game_id: gameId,
      },
    });

    return { id: session.id };
  },

  async handleWebhook(request: Request) {
    const sig = request.headers.get("stripe-signature");
    const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;
    const body = await request.text();

    if (!sig || !webhookSecret) throw new Error("Missing Stripe signature or secret");

    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    if (event.type !== "checkout.session.completed") return null;

    const session = event.data.object as Stripe.Checkout.Session;

    const email = session.customer_email || session.customer_details?.email;
    const gameId = session.metadata?.game_id;

    if (!email || !gameId) throw new Error("Missing metadata in session");

    return {
      sessionId: session.id,
      email,
      gameId,
    };
  },
};
