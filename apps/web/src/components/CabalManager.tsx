'use client'

import { Identity } from '@semaphore-protocol/identity'
import { useEffect, useState } from 'react'
import {
  useSignMessage,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'

import { Button } from './ui/button'

export function CabalManager() {
  const signature = useSignMessage()
  const transaction = useWriteContract()
  const txStatus = useWaitForTransactionReceipt({ hash: transaction.data })

  const [commitment, setCommitment] = useState<bigint | null>(null)

  useEffect(() => {
    if (signature.data) {
      const identity = new Identity(signature.data)
      setCommitment(identity.commitment)
    }
  }, [signature.data])

  return (
    <div className="space-y-4">
      <p>
        Cabal is an anonymous, shared smart contract wallet powered by{' '}
        <a href="https://semaphore.pse.dev/" target="_blank">
          Semaphore
        </a>
        .
      </p>

      <p>
        First, sign this message. Your address is not saved anywhere, but the
        hash is used to create a{' '}
        <a
          href="https://docs.semaphore.pse.dev/guides/identities"
          target="_blank"
        >
          Semaphore Identity
        </a>
        .
      </p>

      <div className="flex gap-2">
        <Button
          isLoading={signature.isPending}
          disabled={!!commitment}
          onClick={() => {
            signature.signMessage({ message: 'Create a Cabal account' })
          }}
        >
          Create Identity
        </Button>

        <Button disabled={!commitment} onClick={() => {}}>
          Create Cabal
        </Button>
      </div>
    </div>
  )
}
