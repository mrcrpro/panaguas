
"use client";

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

// Create a client
const queryClientOptions = {
  defaultOptions: {
    queries: {
      // Example: Set default staleTime to 5 minutes
      staleTime: 1000 * 60 * 5,
      // Example: Keep data for 10 minutes in cache
      gcTime: 1000 * 60 * 10,
      // Refetch on window focus can be helpful for real-time data
      refetchOnWindowFocus: true,
    },
  },
};


export default function QueryProvider({ children }: { children: ReactNode }) {
  // Use useState to ensure QueryClient is only created once per component instance
  const [queryClient] = useState(() => new QueryClient(queryClientOptions));

  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      {children}
       {/* The rest of your application */}
       {/* Optionally add React Query DevTools for debugging */}
       {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
