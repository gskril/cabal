# Web

> [!NOTE]  
> This was forked from [@stephancill/share-tx](https://github.com/stephancill/share-tx).

Web app for Cabal. Provides an interface for signing transactions and viewing group activity. Also includes a [Relayer](#relayer) to execute and earn fees from Cabal transactions.

## Local Development

From the parent monorepo directory, install dependencies.

```bash
pnpm install
```

Navigate to the web directory and create a `.env.local` file.

```bash
cd apps/web
cp .env.example .env
```

Start the development server.

```bash
pnpm dev
```

## Relayer

A Relayer is a simple HTTP server that can execute transactions for Cabal wallets. In addition to the above steps, operating a Relayer requires you to add a few more environment variables:

- `PRIVATE_KEY`: Private key that has a small ETH balance on whichever chain you want to relay transactions on.
- `RPC_URL_<chainId>`: RPC URL for the chains you want to relay transactions on.

Once the app is running, you should register it in the [Relayer Registry](../contracts/README.md) so that apps can find and use it. Note that the URL should include the path, like `https://{yourdomain}/execute`.

### Schema

The standard relayer interface includes a GET and POST request to the same route. The GET request is used to check if the relayer is online and working, while the POST request is used to receive transaction requests.

#### GET

Healthcheck that returns a 200 status code if the relayer is online and ready to relay transactions. It should return the following JSON body:

```json
{
  // If the service is available and the account has enough ETH for gas on relayed transactions
  "ready": false,
  // Chain ID that the relayer is running on
  "chainId": 1337,
  // If the service is not available, return a message with the reason to be displayed to the user
  "message": "The service is currently unavailable"
}
```

#### POST

Relayers are expected to support calling any function on [CabalFactory.sol](../contracts/src/CabalFactory.sol) and [Cabal.sol](../contracts/src/Cabal.sol). They will need to parse the request body to determine which function to call on which contract.

An example request body is formatted as follows:

```json
{
  // Address of the contract to call (CabalFactory or Cabal)
  "target": "0xcaba192BB6D2b5fCeC3808Ecc7bBAbf1392e0Ae9",
  // Chain ID of the chain to send the transaction on
  "chainId": 8453,
  // Function name on the target contract
  "function": "createCabal",
  // Arguments to pass to the function
  "args": [
    "21344552451673981039923583252399396490599926921642695445913578891340383234428",
    "0"
  ]
}
```
