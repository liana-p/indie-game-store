// TypeScript client-side script for Stripe checkout
import { loadStripe } from '@stripe/stripe-js';

interface CheckoutResponse {
  sessionId?: string;
  error?: string;
  code?: string;
  recoveryUrl?: string;
}

class CheckoutManager {
  private stripe: any = null;
  private stripePromise: Promise<any>;

  constructor(publishableKey: string) {
    this.stripePromise = loadStripe(publishableKey);
    this.init();
  }

  private async init() {
    this.stripe = await this.stripePromise;
  }

  async buyGame(gameId: string, buttonElement: HTMLButtonElement): Promise<void> {
    if (!this.stripe) {
      await this.init();
    }

    if (!this.stripe) {
      alert('Payment system unavailable. Please refresh and try again.');
      return;
    }

    try {
      // Update button state
      const originalText = buttonElement.textContent || 'Buy Now';
      buttonElement.disabled = true;
      buttonElement.textContent = 'Loading...';

      // Get customer email first
      const email = await this.getCustomerEmail();
      if (!email) {
        // User cancelled email input
        buttonElement.disabled = false;
        buttonElement.textContent = originalText;
        return;
      }

      // Create checkout session with email
      const requestBody = JSON.stringify({ gameId, email });
      console.log('Sending request body:', requestBody);
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });
      
      console.log('Response status:', response.status);

      const data: CheckoutResponse = await response.json();

      if (data.error) {
        // Handle duplicate purchase specially
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

      if (!data.sessionId) {
        throw new Error('No session ID received');
      }

      // Redirect to Stripe Checkout
      const { error } = await this.stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (error) {
        throw new Error(error.message);
      }

    } catch (err) {
      console.error('Checkout error:', err);
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      alert('Error: ' + message);
      
      // Reset button state
      buttonElement.disabled = false;
      buttonElement.textContent = originalText;
    }
  }

  private async getCustomerEmail(): Promise<string | null> {
    return new Promise((resolve) => {
      const modal = document.getElementById('emailModal')!;
      const emailInput = document.getElementById('customerEmail') as HTMLInputElement;
      const emailForm = document.getElementById('emailForm') as HTMLFormElement;
      const emailError = document.getElementById('emailError')!;
      const closeModal = document.getElementById('closeModal')!;
      const cancelBtn = document.getElementById('cancelBtn')!;

      // Show modal
      modal.style.display = 'flex';
      emailInput.focus();
      emailInput.value = '';
      emailError.style.display = 'none';

      // Handle form submission
      const handleSubmit = (e: Event) => {
        e.preventDefault();
        const email = emailInput.value.toLowerCase().trim();
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          emailError.textContent = 'Please enter a valid email address.';
          emailError.style.display = 'block';
          emailInput.focus();
          return;
        }

        // Close modal and resolve with email
        modal.style.display = 'none';
        cleanup();
        resolve(email);
      };

      // Handle cancellation
      const handleCancel = () => {
        modal.style.display = 'none';
        cleanup();
        resolve(null);
      };

      // Handle outside click
      const handleOutsideClick = (e: Event) => {
        if (e.target === modal) {
          handleCancel();
        }
      };

      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleCancel();
        }
      };

      // Cleanup function
      const cleanup = () => {
        emailForm.removeEventListener('submit', handleSubmit);
        closeModal.removeEventListener('click', handleCancel);
        cancelBtn.removeEventListener('click', handleCancel);
        modal.removeEventListener('click', handleOutsideClick);
        document.removeEventListener('keydown', handleEscape);
      };

      // Add event listeners
      emailForm.addEventListener('submit', handleSubmit);
      closeModal.addEventListener('click', handleCancel);
      cancelBtn.addEventListener('click', handleCancel);
      modal.addEventListener('click', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
    });
  }
}

// Initialize checkout manager and expose globally
declare global {
  interface Window {
    checkoutManager: CheckoutManager;
    buyGame: (gameId: string) => void;
  }
}

// Get publishable key from data attribute
const publishableKey = document.documentElement.dataset.stripeKey;
console.log('Initializing checkout with key:', publishableKey ? 'Found' : 'Not found');

if (publishableKey) {
  window.checkoutManager = new CheckoutManager(publishableKey);
  
  // Global function for onclick handlers
  window.buyGame = (gameId: string) => {
    console.log('buyGame called with gameId:', gameId);
    const button = event?.target as HTMLButtonElement;
    if (button) {
      window.checkoutManager.buyGame(gameId, button);
    } else {
      console.error('No button found in event target');
    }
  };
  
  console.log('buyGame function registered');
} else {
  console.error('No Stripe publishable key found in data-stripe-key attribute');
}