# Contracts

A smart contract wallet that is governed by a [Semaphore group](https://docs.semaphore.pse.dev/guides/groups).

A wallet is instantiated with a single [Semaphore identity](https://docs.semaphore.pse.dev/guides/identities). From then on, transactions can only be executed by providing a valid [Semaphore proof](https://docs.semaphore.pse.dev/guides/proofs) for a member of the group. It is never known which identity corresponds to a given signature.

Because submitting a transaction directly to the chain would weaken the anonymity of the group, all transactions are meant to be relayed by a 3rd party. This is a trustless process, incentivized by a fee paid in Ether which can be configured by any member of the group.

## Local Development

From the parent monorepo directory, install dependencies.

```bash
pnpm install
```

Navigate to the contracts directory and create a `.env` file. You don't have to change any of the values for testing purposes.

```bash
cd apps/contracts
cp .env.example .env
```

Compile contracts and run the tests.

```bash
pnpm test
```

## Deployments

| Contract        | Network      | Address                                    |
| --------------- | ------------ | ------------------------------------------ |
| CabalFactory    | Base         | 0xcaba192BB6D2b5fCeC3808Ecc7bBAbf1392e0Ae9 |
| CabalFactory    | Base Sepolia | 0xcaba192BB6D2b5fCeC3808Ecc7bBAbf1392e0Ae9 |
| RelayerRegistry | Base         | 0xcaba1cC2590F1f72041e01346e2e7307065A9108 |
| RelayerRegistry | Base Sepolia | 0xcaba1cC2590F1f72041e01346e2e7307065A9108 |
