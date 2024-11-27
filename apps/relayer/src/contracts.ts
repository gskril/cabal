// TODO: Share this with the frontend app
export const CABAL_CONTRACT = {
  address: '0x0000000000000000000000000000000000000000',
  abi: [
    {
      inputs: [
        {
          internalType: 'uint256',
          name: '_identityCommitment',
          type: 'uint256',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'constructor',
    },
    {
      inputs: [],
      name: 'FailedToSendFee',
      type: 'error',
    },
    {
      inputs: [],
      name: 'GroupHasNoMembers',
      type: 'error',
    },
    {
      inputs: [],
      name: 'InsufficientBalance',
      type: 'error',
    },
    {
      inputs: [],
      name: 'InvalidIntent',
      type: 'error',
    },
    {
      inputs: [],
      name: 'InvalidProof',
      type: 'error',
    },
    {
      inputs: [],
      name: 'MerkleTreeDepthIsNotSupported',
      type: 'error',
    },
    {
      inputs: [],
      name: 'MerkleTreeRootIsExpired',
      type: 'error',
    },
    {
      inputs: [],
      name: 'MerkleTreeRootIsNotPartOfTheGroup',
      type: 'error',
    },
    {
      inputs: [],
      name: 'YouAreUsingTheSameNullifierTwice',
      type: 'error',
    },
    {
      anonymous: false,
      inputs: [],
      name: 'ExecutionFailure',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'uint256',
          name: 'value',
          type: 'uint256',
        },
        {
          indexed: true,
          internalType: 'uint256',
          name: 'fee',
          type: 'uint256',
        },
      ],
      name: 'ExecutionSuccess',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'FeeChanged',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'uint256',
          name: 'identityCommitment',
          type: 'uint256',
        },
      ],
      name: 'MemberAdded',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'sender',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'uint256',
          name: 'value',
          type: 'uint256',
        },
      ],
      name: 'Received',
      type: 'event',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'identityCommitment',
          type: 'uint256',
        },
        {
          components: [
            {
              internalType: 'uint256',
              name: 'merkleTreeDepth',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'merkleTreeRoot',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'nullifier',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'message',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'scope',
              type: 'uint256',
            },
            {
              internalType: 'uint256[8]',
              name: 'points',
              type: 'uint256[8]',
            },
          ],
          internalType: 'struct ISemaphore.SemaphoreProof',
          name: 'proof',
          type: 'tuple',
        },
      ],
      name: 'addMember',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'chainId',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'value',
          type: 'uint256',
        },
        {
          internalType: 'bytes',
          name: 'data',
          type: 'bytes',
        },
        {
          components: [
            {
              internalType: 'uint256',
              name: 'merkleTreeDepth',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'merkleTreeRoot',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'nullifier',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'message',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'scope',
              type: 'uint256',
            },
            {
              internalType: 'uint256[8]',
              name: 'points',
              type: 'uint256[8]',
            },
          ],
          internalType: 'struct ISemaphore.SemaphoreProof',
          name: 'proof',
          type: 'tuple',
        },
      ],
      name: 'execute',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'value',
          type: 'uint256',
        },
        {
          internalType: 'bytes',
          name: 'data',
          type: 'bytes',
        },
        {
          components: [
            {
              internalType: 'uint256',
              name: 'merkleTreeDepth',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'merkleTreeRoot',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'nullifier',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'message',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'scope',
              type: 'uint256',
            },
            {
              internalType: 'uint256[8]',
              name: 'points',
              type: 'uint256[8]',
            },
          ],
          internalType: 'struct ISemaphore.SemaphoreProof',
          name: 'proof',
          type: 'tuple',
        },
        {
          internalType: 'bool',
          name: 'takeFee',
          type: 'bool',
        },
      ],
      name: 'execute',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'feeAmount',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'getMerkleTreeDepth',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'getMerkleTreeRoot',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'getMerkleTreeSize',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          components: [
            {
              internalType: 'uint256',
              name: 'merkleTreeDepth',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'merkleTreeRoot',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'nullifier',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'message',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'scope',
              type: 'uint256',
            },
            {
              internalType: 'uint256[8]',
              name: 'points',
              type: 'uint256[8]',
            },
          ],
          internalType: 'struct ISemaphore.SemaphoreProof',
          name: 'proof',
          type: 'tuple',
        },
      ],
      name: 'isValidProof',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'name',
      outputs: [
        {
          internalType: 'string',
          name: '',
          type: 'string',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'semaphore',
      outputs: [
        {
          internalType: 'contract ISemaphore',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'semaphoreGroupId',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
        {
          components: [
            {
              internalType: 'uint256',
              name: 'merkleTreeDepth',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'merkleTreeRoot',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'nullifier',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'message',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'scope',
              type: 'uint256',
            },
            {
              internalType: 'uint256[8]',
              name: 'points',
              type: 'uint256[8]',
            },
          ],
          internalType: 'struct ISemaphore.SemaphoreProof',
          name: 'proof',
          type: 'tuple',
        },
      ],
      name: 'setFee',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      stateMutability: 'payable',
      type: 'receive',
    },
  ],
} as const
