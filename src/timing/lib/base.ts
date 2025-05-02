export interface AbstractOperations {
  readonly name: string;
  setupData(): Promise<void>;
  runQuery(): Promise<number>;
  cleanup(): Promise<void>;
}

export const NUM_POSTS = 10;
export const NUM_AUTHORS = 2;
export const ITERATIONS = 20;
export const DELAY_MS = 50;
export const WARMUP_ITERATIONS = 3;

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
