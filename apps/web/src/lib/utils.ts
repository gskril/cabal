import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { hexToNumber, toHex } from 'viem'

import { SupportedChainId } from '@/types'

import { chains } from './web3'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function bigintReplacer(key: string, value: any) {
  if (typeof value === 'bigint') {
    return toHex(value)
  }
  return value
}

export function scaleMagnitude(value: string, magnitude: number) {
  const floatValue = value.startsWith('0x')
    ? hexToNumber(value as `0x${string}`)
    : parseFloat(value)
  if (isNaN(floatValue)) throw new Error('Invalid number')
  const scale = magnitude
  const scaledValue = Math.round(floatValue * Math.pow(10, scale)).toString()
  const bigIntValue = BigInt(scaledValue)

  return bigIntValue
}

export function getChainName(chainId: SupportedChainId) {
  return chains.find((chain) => chain.id === chainId)?.name || 'Unknown Chain'
}

export function convertBigintToString(value: bigint | object): string | object {
  if (typeof value === 'bigint') {
    return value.toString()
  }

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        key,
        typeof val === 'bigint' ? val.toString() : val,
      ])
    )
  }

  return value
}
