import { Hex, createWalletClient, http, publicActions } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex | undefined

if (!PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY is not set')
}

export const baseClient = createWalletClient({
  account: privateKeyToAccount(PRIVATE_KEY),
  chain: base,
  transport: http(),
}).extend(publicActions)
