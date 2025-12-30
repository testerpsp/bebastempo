import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { defineChain } from 'viem'

export const tempoTestnet = defineChain({
  id: 42429,
  name: 'Tempo Testnet',
  nativeCurrency: {
    name: 'USD',
    symbol: 'USD',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.tempo.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Tempo Explorer',
      url: 'https://explore.tempo.xyz',
    },
  },
  testnet: true,
})

export const config = getDefaultConfig({
  appName: 'Bebas Tempo DEX',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '7d052131912a3ab4fa39ff3673dc8215',
  chains: [tempoTestnet],
  ssr: true,
})
