'use client'

import { useMutation } from '@tanstack/react-query'
import { Copy, Eye, Loader2, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  type AbiFunction,
  Address,
  encodeFunctionData,
  isAddress,
  toFunctionSelector,
} from 'viem'
import { mainnet } from 'viem/chains'
import { usePublicClient } from 'wagmi'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAbi } from '@/hooks/useAbi'
import { useDecimals } from '@/hooks/useDecimals'
import { useSourcify } from '@/hooks/useSourcify'
import { bigintReplacer, getChainName, scaleMagnitude } from '@/lib/utils'
import { chains } from '@/lib/web3'
import { SupportedChain, SupportedChainId } from '@/types'

interface ContractSearchResult {
  address: Address
  name: string
  chainId: SupportedChainId
}

export default function Page() {
  const publicClient = usePublicClient()
  const mainnetClient = usePublicClient({ chainId: mainnet.id })
  const [contractAddress, setContractAddress] = useState('')
  const [selectedChain, setSelectedChain] = useState<SupportedChain | null>(
    null
  )
  const [selectedFunctionSelector, setSelectedFunctionSelector] = useState<
    string | null
  >(null)

  const [inputs, setInputs] = useState<string[]>([])
  const [valueInput, setValueInput] = useState<string>('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchInput, setSearchInput] = useState<string>('')
  const [searchResults, setSearchResults] = useState<ContractSearchResult[]>([])

  const {
    data: abi,
    isLoading: isLoadingAbi,
    error: abiError,
  } = useAbi({
    chainId: selectedChain?.id,
    address: contractAddress,
  })

  const handleInputChange = useMemo(() => {
    return (index: number, value: string) => {
      setInputs((prev) => {
        const newInputs = [...prev]
        newInputs[index] = value
        return newInputs
      })
    }
  }, [])

  const functions = useMemo(() => {
    return (abi || []).filter(
      (item): item is AbiFunction => item.type === 'function'
    )
  }, [abi])

  const selectedFunction = useMemo(() => {
    return selectedFunctionSelector
      ? functions.find(
          (f) => toFunctionSelector(f) === selectedFunctionSelector
        )
      : null
  }, [selectedFunctionSelector, functions])

  const encodedData = useMemo(() => {
    if (!selectedFunction || !inputs) return null

    if (
      selectedFunction.stateMutability === 'view' ||
      selectedFunction.stateMutability === 'pure'
    )
      return null

    if (selectedFunction.inputs.length !== inputs.length) return null

    try {
      return encodeFunctionData({
        abi: [selectedFunction],
        functionName: selectedFunction.name,
        args: inputs,
      })
    } catch (error) {
      console.error('Error encoding function data:', error)
      return null
    }
  }, [selectedFunction, inputs])

  const resolveEnsName = useCallback(
    async (input: string, index: number) => {
      if (!input || isAddress(input) || !input.toLowerCase().endsWith('.eth'))
        return

      try {
        const resolved = await mainnetClient?.getEnsAddress({
          name: input,
        })
        if (resolved) {
          handleInputChange(index, resolved)
        }
      } catch (error) {
        console.error('Error resolving ENS name:', error)
      }
    },
    [handleInputChange, mainnetClient]
  )

  const readContractMutation = useMutation({
    mutationFn: async (): Promise<any | null> => {
      if (
        !selectedFunctionSelector ||
        !contractAddress ||
        !inputs ||
        !selectedChain
      )
        return null

      const f = functions.find(
        (f) => toFunctionSelector(f) === selectedFunctionSelector
      )

      if (!f) return null

      return publicClient?.readContract({
        address: contractAddress as `0x${string}`,
        abi: [f],
        functionName: f.name,
        args: inputs,
      })
    },
  })

  const { data: decimals } = useDecimals({
    chainId: selectedChain?.id,
    address: contractAddress,
  })

  const { data: verification, isLoading: isLoadingVerification } =
    useSourcify(contractAddress)

  const availableChains = useMemo(() => {
    if (!verification) return verification

    const filteredChains = chains.filter((chain) =>
      verification.chainIds?.some((v) => v.chainId === chain.id.toString())
    )
    return filteredChains.length > 0 ? filteredChains : chains
  }, [verification])

  useEffect(() => {
    if (availableChains && availableChains.length > 0) {
      setSelectedChain(availableChains[0])
    } else {
      setSelectedChain(null)
    }
  }, [availableChains])

  useEffect(() => {
    setSelectedFunctionSelector(null)
    setInputs([])
  }, [contractAddress])

  const scaleInput = (index: number, value: string, magnitude: number) => {
    try {
      const bigIntValue = scaleMagnitude(value, magnitude)
      handleInputChange(index, bigIntValue.toString())
    } catch (error) {
      console.error('Error scaling input:', error)
    }
  }

  const scaleValueInput = (value: string) => {
    try {
      const bigIntValue = scaleMagnitude(value, 18)
      setValueInput(bigIntValue.toString())
    } catch (error) {
      console.error('Error scaling value:', error)
    }
  }

  useEffect(() => {
    if (!searchInput || searchInput.length < 2) {
      setSearchResults([])
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search-contracts?q=${encodeURIComponent(searchInput)}`,
          { signal: controller.signal }
        )
        if (response.ok) {
          const data = await response.json()
          setSearchResults(data)
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Search failed:', error)
        }
      }
    }, 300)

    return () => {
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [searchInput])

  const handleShare = useCallback(() => {
    if (!selectedChain || !contractAddress || !encodedData) return

    const params = new URLSearchParams({
      chainId: selectedChain.id.toString(),
      data: encodedData,
      to: contractAddress,
      value: valueInput || '0',
    })

    const url = `${window.location.origin}/tx?${params.toString()}`
    navigator.clipboard.writeText(url)
  }, [selectedChain, contractAddress, encodedData, valueInput])

  return (
    <div className="mx-auto p-10">
      <div className="flex flex-col gap-6 lg:flex-row">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Contract</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="contractAddress">Contract Address</Label>
              <div className="flex gap-2">
                <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                  <PopoverTrigger asChild>
                    <Input
                      id="contractAddress"
                      value={contractAddress}
                      onChange={(e) => {
                        const value = e.target.value
                        setContractAddress(value)
                        if (!isAddress(value)) {
                          setSearchInput(value)
                          setSearchOpen(true)
                        } else {
                          setSearchOpen(false)
                        }
                      }}
                      placeholder="Search by name or address..."
                      className="text-left"
                    />
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] max-w-[var(--radix-popover-content-available-width)] p-0"
                    align="start"
                  >
                    <Command
                      className="rounded-lg shadow-md"
                      shouldFilter={false}
                    >
                      <CommandInput
                        placeholder="Search contracts..."
                        value={searchInput}
                        onValueChange={(value) => {
                          setContractAddress(value)
                          if (!isAddress(value)) {
                            setSearchInput(value)
                            setSearchOpen(true)
                          } else {
                            setSearchOpen(false)
                          }
                        }}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {searchInput === ''
                            ? 'Start typing to search contracts...'
                            : 'No contracts found.'}
                        </CommandEmpty>
                        <CommandGroup>
                          {searchResults.map((result) => (
                            <CommandItem
                              key={`${result.address}-${result.chainId}`}
                              value={result.address}
                              onSelect={() => {
                                setContractAddress(result.address)
                                setSearchOpen(false)
                              }}
                              className={
                                contractAddress.toLowerCase() ===
                                result.address.toLowerCase()
                                  ? 'bg-gray-100'
                                  : ''
                              }
                            >
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {result.name}
                                  </span>
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                                    {getChainName(result.chainId)}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {result.address}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {isAddress(contractAddress) && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      navigator.clipboard.writeText(contractAddress)
                    }
                    disabled={!isAddress(contractAddress)}
                    title="Copy address"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {isLoadingVerification && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Loader2 className="animate-spin" size={16} />
                <span>Checking verified chains...</span>
              </div>
            )}

            {verification && availableChains && (
              <div className="space-y-2">
                <Label htmlFor="chainSelector">Select Chain</Label>
                <Select
                  onValueChange={(value) => {
                    const chain = availableChains.find(
                      (c) => c.id === Number(value)
                    )
                    setSelectedChain(chain || null)
                  }}
                  defaultValue={availableChains[0].id.toString()}
                >
                  <SelectTrigger id="chainSelector">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableChains.map((chain) => (
                      <SelectItem key={chain.id} value={chain.id.toString()}>
                        <div className="flex items-center">
                          {chain.name}{' '}
                          {!verification.chainIds?.find(
                            (v) => v.chainId === chain.id.toString()
                          ) && ' (unverified)'}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {isLoadingAbi && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Loader2 className="animate-spin" size={16} />
                <span>Loading contract ABI...</span>
              </div>
            )}

            {abiError && (
              <div className="text-destructive text-sm">
                Error loading ABI: {abiError.message}
              </div>
            )}

            {abi && abi.length > 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="functionSelector">Select Function</Label>
                  <div className="flex gap-2">
                    <Select
                      value={selectedFunctionSelector || undefined}
                      onValueChange={(selector) => {
                        setSelectedFunctionSelector(selector)
                        setInputs([])
                      }}
                    >
                      <SelectTrigger id="functionSelector">
                        <SelectValue placeholder="Select a function" />
                      </SelectTrigger>
                      <SelectContent>
                        {functions.map((func) => (
                          <SelectItem
                            key={toFunctionSelector(func)}
                            value={toFunctionSelector(func)}
                          >
                            <div className="flex items-center gap-2">
                              {func.name} ({toFunctionSelector(func)})
                              {func.stateMutability === 'view' && (
                                <Eye className="h-4 w-4 text-gray-500" />
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedFunctionSelector(null)
                        setInputs([])
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                {selectedFunction && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Function Arguments
                    </h3>

                    {selectedFunction.stateMutability === 'payable' && (
                      <div className="space-y-2">
                        <Label htmlFor="value-input">value (payable)</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="value-input"
                            value={valueInput}
                            onChange={(e) => setValueInput(e.target.value)}
                            placeholder="0.0"
                            type="text"
                          />
                          <Button
                            variant="outline"
                            onClick={() => scaleValueInput(valueInput)}
                            disabled={!valueInput}
                            title="Scale by 18 decimals"
                          >
                            ×1e18
                          </Button>
                        </div>
                      </div>
                    )}

                    {selectedFunction.inputs.map(
                      (input: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <Label htmlFor={`input-${index}`}>
                            {input.name || `Input ${index + 1}`} ({input.type})
                          </Label>
                          <div className="flex space-x-2">
                            <Input
                              id={`input-${index}`}
                              value={inputs[index] || ''}
                              onChange={(e) =>
                                handleInputChange(index, e.target.value)
                              }
                              placeholder={`Enter ${input.type}`}
                            />
                            {input.type === 'address' &&
                              !isAddress(inputs[index]) &&
                              !!inputs[index] && (
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    resolveEnsName(inputs[index], index)
                                  }
                                >
                                  <Search className="h-4 w-4" />
                                  ENS
                                </Button>
                              )}
                            {input.type.startsWith('uint') ||
                            input.type.startsWith('int') ? (
                              <Button
                                variant="outline"
                                onClick={() =>
                                  scaleInput(
                                    index,
                                    inputs[index],
                                    decimals || 18
                                  )
                                }
                                disabled={!inputs[index]}
                                title={`Scale by ${decimals || 18} decimals`}
                              >
                                ×1e{decimals || 18}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      )
                    )}

                    {encodedData && (
                      <div className="space-y-2">
                        <Label>Encoded Data:</Label>
                        <div className="relative">
                          <pre className="bg-muted whitespace-pre-wrap break-all rounded-md border p-4">
                            {encodedData}
                          </pre>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2"
                            onClick={() =>
                              navigator.clipboard.writeText(encodedData)
                            }
                          >
                            <Copy size={16} />
                          </Button>
                        </div>
                      </div>
                    )}

                    {selectedFunction.stateMutability === 'view' ? (
                      <Button
                        onClick={() => readContractMutation.mutate()}
                        disabled={readContractMutation.isPending}
                      >
                        {readContractMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Reading...
                          </>
                        ) : (
                          'Read'
                        )}
                      </Button>
                    ) : (
                      <div>
                        <Button onClick={handleShare} disabled={!encodedData}>
                          <Copy className="mr-2 h-4 w-4" />
                          Share
                        </Button>
                      </div>
                    )}

                    {selectedFunction.stateMutability === 'view' && (
                      <div>
                        {readContractMutation.error && (
                          <div className="text-destructive text-sm">
                            Error: {readContractMutation.error.message}
                          </div>
                        )}
                        {readContractMutation.data !== undefined && (
                          <div className="space-y-2">
                            <Label>Result:</Label>
                            <pre className="bg-muted overflow-x-auto rounded-md p-4">
                              {JSON.stringify(
                                readContractMutation.data,
                                bigintReplacer,
                                2
                              )}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
