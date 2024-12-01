'use client'

import { Identity } from '@semaphore-protocol/identity'
import { useEffect, useState } from 'react'
import {
  useChainId,
  useSignMessage,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'

import { Button } from '@/components/ui/button'
import { CABAL_FACTORY } from '@/lib/contracts'

export function CabalManager() {
  const chainId = useChainId()
  const signature = useSignMessage()
  const transaction = useWriteContract()
  const txStatus = useWaitForTransactionReceipt({ hash: transaction.data })

  const [commitment, setCommitment] = useState<bigint | null>(null)
  const simulate = useSimulateContract({
    chainId,
    ...CABAL_FACTORY,
    functionName: 'createCabal',
    args: !!commitment ? [commitment] : undefined,
  })

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

      <div className="space-y-1">
        {(() => {
          return (
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
              <Button
                disabled={!commitment || (!!commitment && simulate.isLoading)}
                isLoading={!!commitment && simulate.isLoading}
                onClick={() => {
                  if (!simulate.data) {
                    return alert('Unreachable because the button is disabled')
                  }

                  // Call out to the relayer
                  console.log(simulate.data.request.args)
                }}
              >
                Create Cabal
              </Button>
            </div>
          )
        })()}

        <p>
          {!!transaction.data && txStatus.isPending && 'Creating Cabal...'}
          {txStatus.isSuccess && 'Cabal created successfully'}
          {txStatus.isError && 'Cabal creation failed'}
        </p>
      </div>
    </div>
  )
}
