import { NextRequest, NextResponse } from 'next/server'
import { toHex } from 'viem'
import { getAddress } from 'viem'
import { z } from 'zod'

import { client } from '@/lib/client'
import { CABAL_CONTRACT_ABI } from '@/lib/contracts'

import { txSchema } from './schema'

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Hello, World!' })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const safeParse = txSchema.safeParse(body)

  if (!safeParse.success) {
    return NextResponse.json({ error: safeParse.error }, { status: 400 })
  }

  let formatted: ReturnType<typeof formatTxRequest>

  try {
    formatted = formatTxRequest(safeParse.data)
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { cabal, to, value, data, proof } = formatted

  const tx = await client.simulateContract({
    address: cabal,
    abi: CABAL_CONTRACT_ABI,
    functionName: 'execute',
    args: [to, value, data, proof],
  })

  return NextResponse.json({ message: 'ok', data: tx })
}

// z.infer<typeof txSchema> is not strict enough
function formatTxRequest(body: z.infer<typeof txSchema>) {
  return {
    cabal: getAddress(body.cabal),
    to: getAddress(body.to),
    value: BigInt(body.value),
    data: toHex(body.data),
    chainId: BigInt(body.chainId),
    proof: {
      merkleTreeDepth: BigInt(body.proof.merkleTreeDepth),
      merkleTreeRoot: BigInt(body.proof.merkleTreeRoot),
      nullifier: BigInt(body.proof.nullifier),
      message: BigInt(body.proof.message),
      scope: BigInt(body.proof.scope),
      points: body.proof.points.map(BigInt) as [
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
      ],
    },
  }
}
