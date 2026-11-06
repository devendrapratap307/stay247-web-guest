import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfirmHost } from '../components/feedback/ConfirmDialog';
import { Toaster } from '../components/feedback/Toast';
import { queryClient } from './query-client';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
        <Toaster />
        <ConfirmHost />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
