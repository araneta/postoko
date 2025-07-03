import React from 'react';

interface StripeProviderProps {
  children: React.ReactElement | React.ReactElement[];
}

export default function StripeProvider({ children }: StripeProviderProps) {
  // For now, just render children without Stripe provider
  // This avoids the native module import issue
  return <>{children}</>;
} 