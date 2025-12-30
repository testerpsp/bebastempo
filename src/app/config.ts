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
  projectId: '0febd1564ab8cf5569f57b45530ce88e', // Project ID lu
  chains: [tempoTestnet],
  ssr: true,
})