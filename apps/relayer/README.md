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

## Schema

The standard relayer interface includes a GET and POST request to the same route. The GET request is used to check if the relayer is online and working, while the POST request is used to receive transaction requests.

### GET

Healthcheck that returns a 200 status code if the relayer is online and ready to relay transactions. It should return the following JSON body:

```json
{
  // If the service is available and the account has enough ETH for gas on relayed transactions
  "ready": true,
  // Chain ID that the relayer is running on
  "chainId": 1337
}
```

### POST

Relayers are expected to support calling any function on [CabalFactory.sol](../contracts/src/CabalFactory.sol) and [Cabal.sol](../contracts/src/Cabal.sol). They will need to parse the request body to determine which function to call on which contract.

An example request body is formatted as follows:

```json
{
  // Address of the contract to call (CabalFactory or Cabal)
  "target": "0xcaba15de77BC1a93556347030D299995dFE777c6",
  // Chain ID of the chain to send the transaction on
  "chainId": 84532,
  // Function selector on the target contract
  "function": "0xcd358100",
  // Arguments to pass to the function
  "args": [
    "identityCommitment": "15072455385723004728391568434269917452175057560864330595979104241296826134229"
  ]
}
```
