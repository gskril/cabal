import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { Group } from '@semaphore-protocol/group'
import { Identity } from '@semaphore-protocol/identity'
import { generateProof } from '@semaphore-protocol/proof'
import { expect } from 'chai'
import hre from 'hardhat'
import {
  encodeAbiParameters,
  encodeFunctionData,
  keccak256,
  parseAbi,
} from 'viem'

import { formatProof } from './utils'

// All addresses are from npx hardhat node
const account1 = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const account1Pkey =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const account2 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
const account2Pkey =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
const account3 = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'

// https://docs.semaphore.pse.dev/guides/identities#create-deterministic-identities
// In practice, the secret value would be a signed message from the user instead of the private key itself
const identity1 = new Identity(account1Pkey)
const identity2 = new Identity(account2Pkey)

const deploy = async () => {
  const cabal = await hre.viem.deployContract('Cabal', [
    identity1.commitment, // _identityCommitment
  ])

  // Load up the contract with some ether
  const [walletClient] = await hre.viem.getWalletClients()
  await walletClient.sendTransaction({
    to: cabal.address,
    value: BigInt(2000),
  })

  return { cabal }
}

describe('Positive tests', function () {
  it('should return the contract name', async function () {
    const { cabal } = await loadFixture(deploy)

    const contractName = await cabal.read.name()
    expect(contractName).to.equal('Cabal')
  })

  it('should let relayers execute signed calls', async function () {
    const { cabal } = await loadFixture(deploy)

    const args = [
      account2, // to
      BigInt(1000), // value
      '0x', // data
    ] as const

    const abiEncodedCalldata = encodeAbiParameters(
      [{ type: 'address' }, { type: 'uint256' }, { type: 'bytes' }],
      args
    )

    const group = new Group([identity1.commitment])
    const scope = await cabal.read.getMerkleTreeRoot() // Merkle root of the group
    const message = BigInt(keccak256(abiEncodedCalldata)) // Hashed calldata
    const proof = await generateProof(identity1, group, message, scope)

    const sendEtherTx = cabal.write.execute(
      [
        ...args,
        formatProof(proof), // proof of membership from the sender
      ],
      { account: account1 }
    )

    await expect(sendEtherTx).to.be.fulfilled
  })

  it('should let a member add new members', async function () {
    const { cabal } = await loadFixture(deploy)

    const group = new Group([identity1.commitment])
    const scope = await cabal.read.getMerkleTreeRoot() // Merkle root of the group
    const message = identity2.commitment // Hashed calldata
    const proof = await generateProof(identity1, group, message, scope)

    const treeRootBefore = await cabal.read.getMerkleTreeRoot()

    const addMemberTx = cabal.write.addMember(
      [
        identity2.commitment, // commitment of new member
        formatProof(proof), // proof of membership from the existing member
      ],
      { account: account1 }
    )

    await expect(addMemberTx).to.be.fulfilled

    // Tree root should change whenever a new member is added
    const treeRootAfter = await cabal.read.getMerkleTreeRoot()
    expect(treeRootAfter).to.not.equal(treeRootBefore)
  })

  it('should let a member update the fee', async function () {
    const { cabal } = await loadFixture(deploy)

    const group = new Group([identity1.commitment])
    const scope = await cabal.read.getMerkleTreeRoot() // Merkle root of the group
    const message = BigInt(1000)
    const proof = await generateProof(identity1, group, message, scope)

    const updateFeeTx = cabal.write.setFee(
      [
        BigInt(1000), // amount
        formatProof(proof), // proof of membership from the existing member
      ],
      { account: account2 }
    )

    await expect(updateFeeTx).to.be.fulfilled
  })
})

describe('Negative tests', function () {
  it('should reject invalid proofs', async function () {
    const { cabal } = await loadFixture(deploy)

    const args = [
      account2, // to
      BigInt(1000), // value
      '0x', // data
    ] as const

    const abiEncodedCalldata = encodeAbiParameters(
      [{ type: 'address' }, { type: 'uint256' }, { type: 'bytes' }],
      args
    )

    const group = new Group([identity1.commitment])
    const scope = await cabal.read.getMerkleTreeRoot() // Merkle root of the group
    const message = BigInt(keccak256(abiEncodedCalldata)) // Hashed calldata
    const proof = await generateProof(identity1, group, message, scope)

    const sendEtherTx = cabal.write.execute(
      [
        ...args,
        { ...formatProof(proof), merkleTreeDepth: 2n }, // proof of membership from the sender
      ],
      { account: account1 }
    )

    await expect(sendEtherTx).to.be.rejectedWith('InvalidProof()')
  })

  it('should not let the same proof be used twice', async function () {
    const { cabal } = await loadFixture(deploy)

    const args = [
      account2, // to
      BigInt(1000), // value
      '0x', // data
    ] as const

    const abiEncodedCalldata = encodeAbiParameters(
      [{ type: 'address' }, { type: 'uint256' }, { type: 'bytes' }],
      args
    )

    const group = new Group([identity1.commitment])
    const scope = await cabal.read.getMerkleTreeRoot() // Merkle root of the group
    const message = BigInt(keccak256(abiEncodedCalldata)) // Hashed calldata
    const proof = await generateProof(identity1, group, message, scope)

    const sendEtherTx1 = cabal.write.execute(
      [
        ...args,
        formatProof(proof), // proof of membership from the sender
      ],
      { account: account1 }
    )

    const sendEtherTx2 = cabal.write.execute(
      [
        ...args,
        formatProof(proof), // proof of membership from the sender
      ],
      { account: account1 }
    )

    await expect(sendEtherTx1).to.be.fulfilled
    await expect(sendEtherTx2).to.be.rejectedWith(
      'YouAreUsingTheSameNullifierTwice()'
    )
  })

  it('should not let relayers execute unsigned calls', async function () {
    const { cabal } = await loadFixture(deploy)

    const group = new Group([identity1.commitment])
    const scope = await cabal.read.getMerkleTreeRoot() // Merkle root of the group
    const message = 1 // Hashed calldata
    const proof = await generateProof(identity1, group, message, scope)

    const sendEtherTx = cabal.write.execute(
      [
        account2, // to
        BigInt(1000), // value
        '0x', // data
        formatProof(proof), // proof of membership from the sender
      ],
      { account: account1 }
    )

    await expect(sendEtherTx).to.be.rejectedWith('InvalidIntent()')
  })

  it('should not let a relayer set a random fee', async function () {
    const { cabal } = await loadFixture(deploy)

    const group = new Group([identity1.commitment])
    const scope = await cabal.read.getMerkleTreeRoot() // Merkle root of the group
    const message = BigInt(1000)
    const proof = await generateProof(identity1, group, message, scope)

    const updateFeeTx = cabal.write.setFee(
      [
        BigInt(69), // amount
        formatProof(proof), // proof of membership from the existing member
      ],
      { account: account2 }
    )

    await expect(updateFeeTx).to.be.rejectedWith('InvalidIntent()')
  })

  it('should revert when there is not enough ether', async function () {
    const { cabal } = await loadFixture(deploy)

    const args = [
      account2, // to
      BigInt(1000000), // value
      '0x', // data
    ] as const

    const abiEncodedCalldata = encodeAbiParameters(
      [{ type: 'address' }, { type: 'uint256' }, { type: 'bytes' }],
      args
    )

    const group = new Group([identity1.commitment])
    const scope = await cabal.read.getMerkleTreeRoot() // Merkle root of the group
    const message = BigInt(keccak256(abiEncodedCalldata)) // Hashed calldata
    const proof = await generateProof(identity1, group, message, scope)

    const sendEtherTx = cabal.write.execute(
      [
        ...args,
        formatProof(proof), // proof of membership from the sender
      ],
      { account: account1 }
    )

    await expect(sendEtherTx).to.be.rejectedWith('InsufficientBalance()')
  })
})
