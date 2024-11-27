import { Hex, createWalletClient, http, publicActions } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex | undefined

if (!PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY is not set')
}

export const client = createWalletClient({
  account: privateKeyToAccount(PRIVATE_KEY),
  transport: http(process.env.RPC_URL),
}).extend(publicActions)
