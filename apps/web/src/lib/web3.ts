import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { createConfig, http } from 'wagmi'
import { base, baseSepolia, mainnet } from 'wagmi/chains'

const WALLETCONNECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_ID

if (!WALLETCONNECT_ID) {
  throw new Error('Missing NEXT_PUBLIC_WALLETCONNECT_ID')
}

const { connectors } = getDefaultWallets({
  appName: 'Cabal',
  projectId: WALLETCONNECT_ID,
})

// export const chains = [base, mainnet] as const
export const chains = [baseSepolia, mainnet] as const

export const wagmiConfig = createConfig({
  chains,
  connectors,
  transports: {
    // [base.id]: http(),
    [baseSepolia.id]: http(),
    [mainnet.id]: http(),
  },
})
