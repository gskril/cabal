'use client'

import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Identity } from '@semaphore-protocol/identity'
import { Info, Terminal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Hex, toFunctionSelector } from 'viem'
import { toFunctionSignature } from 'viem'
import {
  useAccount,
  useChainId,
  useSignMessage,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'

import { Tx } from '@/app/api/v1/relay/[chainId]/schema'
import { Button } from '@/components/ui/button'
import { CABAL_FACTORY } from '@/lib/contracts'
import { convertBigintToString } from '@/lib/utils'

import { Alert, AlertDescription, AlertTitle } from './ui/alert'

export function CabalManager() {
  const { address } = useAccount()
  const { openConnectModal } = useConnectModal()
  const chainId = useChainId()
  const signature = useSignMessage()
  const [createCabalTxHash, setCreateCabalTxHash] = useState<Hex>()
  const txStatus = useWaitForTransactionReceipt({
    hash: createCabalTxHash,
    chainId: baseSepolia.id,
  })

  const [commitment, setCommitment] = useState<bigint | null>(null)
  const simulate = useSimulateContract({
    chainId: baseSepolia.id,
    ...CABAL_FACTORY,
    functionName: 'createCabal',
    args: !!commitment ? [commitment, BigInt(0)] : undefined,
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
        Cabal is an anonymous, shared smart contract wallet. Thanks to
        zero-knowledge proofs, any Cabal member can sign a transaction without
        revealing who they are.
      </p>

      <p>
        To get started, create a{' '}
        <a
          href="https://docs.semaphore.pse.dev/guides/identities"
          target="_blank"
        >
          Semaphore Identity
        </a>{' '}
        by signing a message with your wallet. This derives an anonymous
        identity from your existing private key.
      </p>

      <div className="space-y-1">
        {(() => {
          if (!address) {
            return <Button onClick={openConnectModal}>Connect Wallet</Button>
          }

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
                disabled={!commitment}
                isLoading={!!commitment && simulate.isLoading}
                onClick={async () => {
                  if (!simulate.data) {
                    return alert('Unreachable because the button is disabled')
                  }

                  // Call out to the relayer
                  const functionSelector = toFunctionSelector(
                    simulate.data.request.abi[0]
                  )

                  if (!functionSelector) {
                    return alert('Function selector not found')
                  }

                  const body: Tx = {
                    target: CABAL_FACTORY.address,
                    chainId: Number(chainId),
                    function: simulate.data.request.functionName,
                    args: simulate.data.request.args.map((arg) =>
                      arg.toString()
                    ),
                  }

                  const res = await fetch(`/api/v1/relay/${chainId}`, {
                    method: 'POST',
                    body: JSON.stringify(body),
                  })

                  if (!res.ok) {
                    return alert('Failed to create Cabal')
                  }

                  const data = (await res.json()) as { data: Hex }
                  setCreateCabalTxHash(data.data)
                  return alert(`Transaction hash: ${data.data}`)
                }}
              >
                Create Cabal
              </Button>
            </div>
          )
        })()}

        <p>
          {!!createCabalTxHash && txStatus.isPending && 'Creating Cabal...'}
          {txStatus.isSuccess && 'Cabal created successfully'}
          {txStatus.isError && 'Cabal creation failed'}
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
          If you create multiple Cabals via this frontend, the public will be
          able to see that the same signer exists across them.
        </AlertDescription>
      </Alert>
    </div>
  )
}
