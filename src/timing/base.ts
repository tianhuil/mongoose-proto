export interface AbstractOperations {
  readonly name: string;
  setupData(): Promise<void>;
  runQuery(): Promise<number>;
  cleanup(): Promise<void>;
}

export const NUM_POSTS = 10;
export const NUM_AUTHORS = 2;
