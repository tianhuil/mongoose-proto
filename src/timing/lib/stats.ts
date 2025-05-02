export class TimingSamples {
  private samples: number[] = [];

  add(timing: number): void {
    this.samples.push(timing);
  }

  get mean(): number {
    if (this.samples.length === 0) return 0;
    return this.samples.reduce((a, b) => a + b) / this.samples.length;
  }

  get min(): number {
    if (this.samples.length === 0) return 0;
    return Math.min(...this.samples);
  }

  get max(): number {
    if (this.samples.length === 0) return 0;
    return Math.max(...this.samples);
  }

  get standardDeviation(): number {
    if (this.samples.length <= 1) return 0;
    const mean = this.mean;
    const variance =
      this.samples.reduce((acc, val) => acc + (val - mean) ** 2, 0) /
      (this.samples.length - 1);
    return Math.sqrt(variance);
  }

  get standardError(): number {
    return this.standardDeviation / Math.sqrt(this.samples.length);
  }

  get summary(): string {
    return `mean: ${this.mean.toFixed(2)}ms ± ${this.standardError.toFixed(2)}ms SE (min: ${this.min.toFixed(2)}ms, max: ${this.max.toFixed(2)}ms, n=${this.samples.length})`;
  }

  reset(): void {
    this.samples = [];
  }
}
