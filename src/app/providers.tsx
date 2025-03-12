'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactNode } from 'react';
import { http } from 'wagmi';
import { defineChain } from 'viem';
import { Toaster } from 'sonner';

export const formaTestnet = defineChain({
  id: 984123,
  name: 'Forma Testnet (Sketchpad-1)',
  nativeCurrency: { name: 'TIA', symbol: 'TIA', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc.sketchpad-1.forma.art'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Forma Explorer',
      url: 'https://explorer.sketchpad-1.forma.art',
    },
  }
});

// Create a new query client instance
const queryClient = new QueryClient();

// Configure wagmi and rainbowkit
const config = getDefaultConfig({
  appName: 'My RainbowKit App',
  projectId: 'YOUR_PROJECT_ID', // Replace with your WalletConnect Cloud project ID
  chains: [formaTestnet],
  ssr: true, // Enable server-side rendering
  transports: {
    [formaTestnet.id]: http(),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <Toaster position="top-center" />
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 