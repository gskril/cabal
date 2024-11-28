// npx hardhat run scripts/deploy-cabal.ts --network baseSepolia
import hre from 'hardhat'
import { encodeAbiParameters } from 'viem/utils'

import { generateSaltAndDeploy } from './lib/create2'

async function main() {
  const contractName = 'CabalFactory'

  const constructorArguments = [
    '0xcaba1cC2590F1f72041e01346e2e7307065A9108', // _relayers
  ] as const

  const encodedArgs = encodeAbiParameters(
    [{ type: 'address' }],
    constructorArguments
  )

  const { address } = await generateSaltAndDeploy({
    vanity: '0xcaba1',
    encodedArgs,
    contractName,
    caseSensitive: true,
    startingIteration: 5882000,
  })

  console.log(`Deployed ${contractName} to ${address}`)

  try {
    // Wait 30 seconds for block explorers to index the deployment
    await new Promise((resolve) => setTimeout(resolve, 30_000))
    await hre.run('verify:verify', { address, constructorArguments })

    // Verify the Cabal implementation contract
    const cabalFactory = await hre.viem.getContractAt('CabalFactory', address)
    const implementation = await cabalFactory.read.implementation()
    await hre.run('verify:verify', { address: implementation })
  } catch (error) {
    console.error(error)
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
