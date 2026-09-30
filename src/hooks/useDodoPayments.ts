import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface CheckoutResult {
  session_id: string;
  checkout_url: string;
  plan: {
    name: string;
    slug: string;
    price_usd: number;
    visitor_limit: number;
    website_limit: number;
  };
}

interface UseDodoPaymentsReturn {
  createCheckout: (planSlug: string, returnUrl?: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useDodoPayments(): UseDodoPaymentsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckout = useCallback(async (planSlug: string, returnUrl?: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Please sign in to continue');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-dodo-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            plan_slug: planSlug,
            return_url: returnUrl || `${window.location.origin}/billing?payment=success&plan=${planSlug}`,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      // Redirect to Dodo Payments hosted checkout
      window.location.href = data.checkout_url;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Dodo checkout error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { 
    createCheckout, 
    loading, 
    error,
    clearError,
  };
}
