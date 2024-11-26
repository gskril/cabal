import { time } from '@nomicfoundation/hardhat-network-helpers'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'

const SEVEN_DAYS = 7 * 24 * 60 * 60 // 7 days in seconds
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

const deploy = async () => {
  const relayerRegistry = await hre.viem.deployContract('RelayerRegistry', [
    NULL_ADDRESS,
  ])

  return { relayerRegistry }
}

describe('RelayerRegistry', function () {
  it('should allow adding a new relayer', async function () {
    const { relayerRegistry } = await loadFixture(deploy)
    const url = 'https://relay.example.com'

    await relayerRegistry.write.addRelayer([url])

    const count = await relayerRegistry.read.relayerCount()
    expect(count).to.equal(1n)
  })

  it('should not allow adding the same relayer twice', async function () {
    const { relayerRegistry } = await loadFixture(deploy)
    const url = 'https://relay.example.com'

    await relayerRegistry.write.addRelayer([url])

    const secondAddTx = relayerRegistry.write.addRelayer([url])
    await expect(secondAddTx).to.be.rejectedWith(`AlreadyExists("${url}")`)
  })

  it('should not allow removing a relayer before 7 days', async function () {
    const { relayerRegistry } = await loadFixture(deploy)
    const url = 'https://relay.example.com'

    await relayerRegistry.write.addRelayer([url])

    const removeRelayerTx = relayerRegistry.write.removeRelayer([url])
    await expect(removeRelayerTx).to.be.rejectedWith(`NotExpired("${url}")`)
  })

  it('should allow removing a relayer after 7 days', async function () {
    const { relayerRegistry } = await loadFixture(deploy)
    const url = 'https://relay.example.com'

    await relayerRegistry.write.addRelayer([url])

    // Fast forward time by 7 days
    await time.increase(SEVEN_DAYS)

    await relayerRegistry.write.removeRelayer([url])

    const count = await relayerRegistry.read.relayerCount()
    expect(count).to.equal(0n)
  })

  it('should handle multiple relayers correctly', async function () {
    const { relayerRegistry } = await loadFixture(deploy)
    const urls = [
      'https://relay1.example.com',
      'https://relay2.example.com',
      'https://relay3.example.com',
    ]

    // Add multiple relayers
    for (const url of urls) {
      await relayerRegistry.write.addRelayer([url])
    }

    const count = await relayerRegistry.read.relayerCount()
    expect(count).to.equal(3n)

    // Fast forward time
    await time.increase(SEVEN_DAYS)

    // Remove one relayer
    await relayerRegistry.write.removeRelayer([urls[0]])

    const newCount = await relayerRegistry.read.relayerCount()
    expect(newCount).to.equal(2n)
  })
})
