import {
  delay,
  DELAY_MS,
  ITERATIONS,
  WARMUP_ITERATIONS,
  type AbstractOperations,
} from './base';
import { TimingSamples } from './stats';

export const run = async (operations: AbstractOperations[]): Promise<void> => {
  try {
    // Setup all operations
    await Promise.all(operations.map((op) => op.setupData()));
    console.log('Data setup complete');

    console.log('Warming up connections...');
    for (let i = 0; i < WARMUP_ITERATIONS; i++) {
      for (const op of operations) {
        await op.runQuery();
        await delay(DELAY_MS);
      }
    }
    console.log('Warmup complete');

    const timings = new Map<string, TimingSamples>();
    for (const op of operations) {
      timings.set(op.name, new TimingSamples());
    }

    for (let i = 0; i < ITERATIONS; i++) {
      console.log(`\nIteration ${i + 1}/${ITERATIONS}`);

      // interleave operations so that anything affecting timing affects all
      // operations more equally
      for (const op of operations) {
        const time = await op.runQuery();
        timings.get(op.name)?.add(time);
        // Single thread and delay to avoid CPU contention
        await delay(DELAY_MS);
      }
    }

    console.log('\nResults:');
    for (const [name, timing] of timings) {
      console.log(`${name.padEnd(30)}:`, timing.summary);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await Promise.all(operations.map((op) => op.cleanup()));
    console.log('\nCleanup complete');
  }
};
