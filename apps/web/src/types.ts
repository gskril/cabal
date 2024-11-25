// Only for types that are re-used in multiple files
import { chains } from './lib/web3'

export type SupportedChain = (typeof chains)[number]
export type SupportedChainId = SupportedChain['id']
