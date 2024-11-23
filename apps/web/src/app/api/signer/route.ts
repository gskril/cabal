import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  proof: z.string(),
})

export async function GET(req: NextRequest) {
  // TODO: validate proof and return signer
  return NextResponse.json({ message: 'Hello, world!' })
}
