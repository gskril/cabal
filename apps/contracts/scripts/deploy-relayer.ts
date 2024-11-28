// npx hardhat run scripts/deploy-relayer.ts --network baseSepolia
import hre from 'hardhat'
import { encodeAbiParameters } from 'viem/utils'

import { generateSaltAndDeploy } from './lib/create2'

async function main() {
  const contractName = 'RelayerRegistry'
  const constructorArguments = [] as const
  const encodedArgs = encodeAbiParameters([], constructorArguments)

  const { address } = await generateSaltAndDeploy({
    vanity: '0xcaba1',
    encodedArgs,
    contractName,
    caseSensitive: true,
    startingIteration: 1208000,
  })

  console.log(`Deployed ${contractName} to ${address}`)

  try {
    // Wait 30 seconds for block explorers to index the deployment
    await new Promise((resolve) => setTimeout(resolve, 30_000))
    await hre.run('verify:verify', { address, constructorArguments })
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
