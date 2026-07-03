import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { queryClient } from '@/lib/react-query';
import { GOOGLE_CLIENT_ID } from '@/config';
import { BeamerProvider } from './beamer-provider';

interface ProvidersProps {
  children: React.ReactNode;
};

export function Providers(props: ProvidersProps) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <BeamerProvider>
          {props.children}
        </BeamerProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
