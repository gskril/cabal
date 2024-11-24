import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'

const deploy = async () => {
  const cabal = await hre.viem.deployContract('Cabal', [
    9022851237816727909830035369521039964336266435400005713137341011998902891977n, // _identityCommitment
  ])

  return { cabal }
}

describe('Tests', function () {
  it('should return the contract name', async function () {
    const { cabal } = await loadFixture(deploy)

    const contractName = await cabal.read.name()
    expect(contractName).to.equal('Cabal')
  })
})
