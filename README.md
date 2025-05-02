# Mongoose TypeScript Prototype

Benchmarking Mongoose against Prisma Mongo performance.  They use matching schemas with identical indexes.

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
Same logic as created but with worse results.

```txt
Prisma (update)               : mean: 73.44ms ± 1.50ms SE (min: 61.55ms, max: 88.47ms, n=20)
Prisma (updateMany)           : mean: 62.13ms ± 1.98ms SE (min: 48.94ms, max: 82.14ms, n=20)
Mongoose (update)             : mean: 18.62ms ± 0.99ms SE (min: 12.42ms, max: 28.00ms, n=20)
```
