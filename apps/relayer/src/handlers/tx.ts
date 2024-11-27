import { Context } from 'hono'
import { Hex, getAddress, toHex } from 'viem'
import { z } from 'zod'

import { client } from '../client.js'
import { CABAL_CONTRACT } from '../contracts.js'
import { txSchema } from '../schema.js'

export async function handleTxRequest(c: Context) {
  const body = await c.req.json()
  const safeParse = txSchema.safeParse(body)

  if (!safeParse.success) {
    return c.json({ error: safeParse.error }, 400)
  }

  let formatted: ReturnType<typeof formatTxRequest>

  try {
    formatted = formatTxRequest(safeParse.data)
  } catch (error) {
    return c.json({ error: 'Invalid request' }, 400)
  }

  const { to, value, data, proof } = formatted

  const tx = await client.simulateContract({
    ...CABAL_CONTRACT,
    functionName: 'execute',
    args: [to, value, data, proof],
  })

  return c.json({ message: 'ok', data: tx })
}

// z.infer<typeof txSchema> is not strict enough
function formatTxRequest(body: z.infer<typeof txSchema>) {
  return {
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
