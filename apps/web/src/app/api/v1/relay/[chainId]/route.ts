'server only'

import { NextRequest, NextResponse } from 'next/server'
import { getAddress, parseEther } from 'viem'
import { z } from 'zod'

import { createClient } from '@/lib/client'
import { CABAL_CONTRACT_ABI, CABAL_FACTORY } from '@/lib/contracts'

import { HealthcheckResponse, querySchema, txSchema } from './schema'

export async function GET(
  _request: NextRequest,
  { params }: { [key: string]: string }
): Promise<NextResponse<HealthcheckResponse>> {
  const safeParse = querySchema.safeParse(params)

  // Parse the Chain ID from the URL
  if (!safeParse.success) {
    return NextResponse.json(
      {
        ready: false,
        message: 'Invalid Chain ID',
        error: safeParse.error,
      },
      { status: 400 }
    )
  }

  const { chainId } = safeParse.data
  const client = createClient(chainId)

  // If we don't have an RPC URL set for this chain, return an error
  if (!client) {
    return NextResponse.json(
      { ready: false, message: 'Unsupported Chain ID' },
      { status: 400 }
    )
  }

  // Check if the relayer has enough ETH to pay for the transaction
  const balance = await client.getBalance({ address: client.account.address })
  if (balance < parseEther('0.0015')) {
    return NextResponse.json(
      { ready: false, message: 'Insufficient ETH balance' },
      { status: 400 }
    )
  }

  return NextResponse.json({ ready: true, chainId })
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

  const { target, chainId, function: functionName, args } = formatted
  const client = createClient(Number(chainId))

  if (!client) {
    return NextResponse.json({ error: 'Unsupported Chain ID' }, { status: 400 })
  }

  const factoryAbiSegment = CABAL_FACTORY.abi.find(
    (seg) => seg.type === 'function' && seg.name === functionName
  )

  const cabalAbiSegment = CABAL_CONTRACT_ABI.find(
    (seg) => seg.type === 'function' && seg.name === functionName
  )

  const abiSegment = cabalAbiSegment || factoryAbiSegment

  if (!abiSegment) {
    return NextResponse.json({ error: 'Invalid function' }, { status: 400 })
  }

  const tx = await client.simulateContract({
    address: target,
    abi: [abiSegment],
    // @ts-expect-error
    functionName,
    // @ts-expect-error
    args,
  })

  if (!tx.result) {
    return NextResponse.json(
      { error: 'Failed to simulate transaction' },
      { status: 400 }
    )
  }

  const txHash = await client.writeContract(tx.request)
  return NextResponse.json({ message: 'ok', data: txHash })
}

// z.infer<typeof txSchema> is not strict enough
function formatTxRequest(body: z.infer<typeof txSchema>) {
  return {
    target: getAddress(body.target),
    chainId: BigInt(body.chainId),
    function: body.function,
    args: body.args,
    // value: BigInt(body.value),
    // data: toHex(body.data),
    // proof: {
    //   merkleTreeDepth: BigInt(body.proof.merkleTreeDepth),
    //   merkleTreeRoot: BigInt(body.proof.merkleTreeRoot),
    //   nullifier: BigInt(body.proof.nullifier),
    //   message: BigInt(body.proof.message),
    //   scope: BigInt(body.proof.scope),
    //   points: body.proof.points.map(BigInt) as [
    //     bigint,
    //     bigint,
    //     bigint,
    //     bigint,
    //     bigint,
    //     bigint,
    //     bigint,
    //     bigint,
    //   ],
    // },
  }
}
