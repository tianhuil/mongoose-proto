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

2. Start the development server:
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

```
.
├── src/
│   └── index.ts    # Main application file
├── package.json
├── tsconfig.json
└── README.md
``` 

