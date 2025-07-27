import { StripeProvider } from "./stripe";
import type { PaymentProvider } from "./types";

const providers: Record<string, PaymentProvider> = {
  stripe: StripeProvider,
};

export function getPaymentProvider(name: string): PaymentProvider {
  const provider = providers[name];
  if (!provider) throw new Error(`Unknown payment provider: ${name}`);
  return provider;
}
