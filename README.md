# Mongoose TypeScript Prototype

A TypeScript project using Mongoose with Zod integration for schema validation and type safety.

## Prerequisites

- [Bun](https://bun.sh) installed
- MongoDB running locally (or update connection string in `src/index.ts`)

## Setup

1. Install dependencies:

```bash
bun install
```

1. Start the development server:

```bash
bun run dev
```

## Available Scripts

- `bun run start` - Run the application
- `bun run dev` - Run the application with watch mode
- `bun run build` - Build the TypeScript code
- `bun run typecheck` - Type check without emitting files

## Features

- TypeScript with strict mode enabled
- Mongoose for MongoDB interactions
- Zod for runtime validation and type inference
- Type-safe MongoDB models using @zodyac/zod-mongoose

## Project Structure

```txt
.
├── src/
│   └── index.ts    # Main application file
├── package.json
├── tsconfig.json
└── README.md
```

## Results

These results were obtained against a free AtlasDB server.

### Create

Create in Prisma is very slow.  We can speed it up by using `createMany([{}])` on a single object because it doesn't return the created object (only the count).

```txt
Prisma (create)               : mean: 50.23ms ± 2.15ms SE (min: 32.72ms, max: 71.76ms, n=20)
Prisma (createMany)           : mean: 32.99ms ± 1.45ms SE (min: 24.16ms, max: 51.72ms, n=20)
Mongoose (create)             : mean: 16.96ms ± 0.49ms SE (min: 12.74ms, max: 21.31ms, n=20)
```

### Read

```txt
Prisma (read)                 : mean: 34.57ms ± 2.32ms SE (min: 24.19ms, max: 66.55ms, n=20)
Mongoose (read)               : mean: 32.44ms ± 1.82ms SE (min: 21.99ms, max: 48.92ms, n=20)
```

### Update

```txt
Prisma (update)               : mean: 73.44ms ± 1.50ms SE (min: 61.55ms, max: 88.47ms, n=20)
Prisma (updateMany)           : mean: 62.13ms ± 1.98ms SE (min: 48.94ms, max: 82.14ms, n=20)
Mongoose (update)             : mean: 18.62ms ± 0.99ms SE (min: 12.42ms, max: 28.00ms, n=20)
```
