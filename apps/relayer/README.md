# Relayer

Basic implementation of a relayer that can execute transactions for Cabal wallets.

This could easily be built into the [Next.js app](../web/README.md), but I've separated it for the sake of demonstrating simplicity and making it easier to run independently.

## How to run on [Railway](https://railway.app?referralCode=ONtqGs)

Fork this repo and create a [new project](https://railway.app/new) on Railway from your fork. During the setup process, add the following environment variables:

- `PRIVATE_KEY`: Private key that has a small ETH balance on whichever chain you want to relay transactions on.
- `RPC_URL`: RPC URL for the chain you want to relay transactions on.

Navigate to the Settings tab and configure the following:

- Press "Generate Domain" in the Networking section. The app is accessible at port 3000.
- Set your Custom Build Command to `pnpm run relayer:build`.
- Set your Watch Paths to be `/apps/relayer/**`.
- Set your Custom Start Command to be `pnpm run relayer:start`.

Once the app is running, you should register it in the [Relayer Registry](../contracts/README.md) so that apps can find and use it.
