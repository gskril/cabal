'server-only'

import { Hex, createWalletClient, http, publicActions } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import * as chains from 'viem/chains'

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex | undefined

export function createClient(chainId: number) {
  if (!PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY is not set')
  }

  const rpcUrl = process.env[`RPC_URL_${chainId}`]

  if (!rpcUrl) {
    return null
  }

  const allChains = Object.values(chains)
  const chain = allChains.find((c) => c.id === chainId)

  if (!chain) {
    return null
  }

  return createWalletClient({
    account: privateKeyToAccount(PRIVATE_KEY),
    transport: http(rpcUrl),
    chain,
  }).extend(publicActions)
}
