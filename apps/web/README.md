# Web

> [!NOTE]  
> This was forked from [@stephancill/share-tx](https://github.com/stephancill/share-tx).

Web app for Cabal. Provides an interface for signing transactions and viewing group activity.

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
