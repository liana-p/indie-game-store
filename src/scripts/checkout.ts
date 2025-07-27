import { loadStripe } from '@stripe/stripe-js';

interface CheckoutResponse {
  sessionId?: string;
  url?: string;
  error?: string;
  code?: string;
  recoveryUrl?: string;
}

class CheckoutManager {
  private stripe: any = null;
  private stripePromise: Promise<any> | null = null;
  private stripeKey: string | null;

  constructor(stripeKey: string | null) {
    this.stripeKey = stripeKey;
    if (stripeKey) {
      this.stripePromise = loadStripe(stripeKey);
    }
  }

  private async initStripe() {
    if (this.stripePromise) {
      this.stripe = await this.stripePromise;
    }
  }

  async buyGame(gameId: string, provider: string, buttonElement: HTMLButtonElement): Promise<void> {
    try {
      const originalText = buttonElement.textContent || 'Buy Now';
      buttonElement.disabled = true;
      buttonElement.textContent = 'Loading...';

      const emailData = await this.getCustomerEmail();
      if (!emailData) {
        buttonElement.disabled = false;
        buttonElement.textContent = originalText;
        return;
      }

      console.log(emailData);
      console.log("a");

      const { email, provider } = emailData;

      const requestBody = JSON.stringify({ gameId, email, provider });
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });

      const data: CheckoutResponse = await response.json();

      if (data.error) {
        if (data.code === 'ALREADY_PURCHASED') {
          const goToRecovery = confirm(
            `${data.error}\n\nWould you like to go to the download recovery page?`
          );
          if (goToRecovery && data.recoveryUrl) {
            window.location.href = data.recoveryUrl;
          }
          buttonElement.disabled = false;
          buttonElement.textContent = originalText;
          return;
        }
        throw new Error(data.error);
      }

      if (provider === 'stripe') {
        await this.initStripe();

        if (!this.stripe) {
          throw new Error('Stripe is not initialized');
        }

        const { error } = await this.stripe.redirectToCheckout({
          sessionId: data.sessionId!,
        });

        if (error) {
          throw new Error(error.message);
        }
      } else if (data.url) {
        // Other providers may return a URL to redirect to
        window.location.href = data.url;
      } else {
        throw new Error('No redirect information received');
      }

    } catch (err) {
      console.error('Checkout error:', err);
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      alert('Error: ' + message);
    } finally {
      buttonElement.disabled = false;
      buttonElement.textContent = 'Buy Now';
    }
  }

  private async getCustomerEmail(): Promise<{ email: string; provider: string } | null> {
    return new Promise((resolve) => {
      const modal = document.getElementById('emailModal')!;
      const emailInput = document.getElementById('customerEmail') as HTMLInputElement;
      const emailForm = document.getElementById('emailForm') as HTMLFormElement;
      const emailError = document.getElementById('emailError')!;
      const closeModal = document.getElementById('closeModal')!;
      const cancelBtn = document.getElementById('cancelBtn')!;

      modal.style.display = 'flex';
      emailInput.focus();
      emailInput.value = '';
      emailError.style.display = 'none';

      const handleSubmit = (e: Event) => {
        e.preventDefault();
        const email = emailInput.value.toLowerCase().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          emailError.textContent = 'Please enter a valid email address.';
          emailError.style.display = 'block';
          emailInput.focus();
          return;
        }

        modal.style.display = 'none';
        cleanup();
        const providerSelect = document.getElementById('paymentProvider') as HTMLSelectElement;
        const provider = providerSelect.value;
        resolve({ email, provider });
      };

      const handleCancel = () => {
        modal.style.display = 'none';
        cleanup();
        resolve(null);
      };

      const handleOutsideClick = (e: Event) => {
        if (e.target === modal) handleCancel();
      };

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') handleCancel();
      };

      const cleanup = () => {
        emailForm.removeEventListener('submit', handleSubmit);
        closeModal.removeEventListener('click', handleCancel);
        cancelBtn.removeEventListener('click', handleCancel);
        modal.removeEventListener('click', handleOutsideClick);
        document.removeEventListener('keydown', handleEscape);
      };

      emailForm.addEventListener('submit', handleSubmit);
      closeModal.addEventListener('click', handleCancel);
      cancelBtn.addEventListener('click', handleCancel);
      modal.addEventListener('click', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
    });
  }
}

declare global {
  interface Window {
    checkoutManager: CheckoutManager;
    buyGame: (gameId: string, provider?: string) => void;
  }
}

const stripeKey = document.documentElement.dataset.stripeKey || null;
window.checkoutManager = new CheckoutManager(stripeKey);

window.buyGame = (gameId: string, provider: string = 'stripe') => {
  const button = event?.target as HTMLButtonElement;
  if (button) {
    window.checkoutManager.buyGame(gameId, provider, button);
  } else {
    console.error('No button found in event target');
  }
};
