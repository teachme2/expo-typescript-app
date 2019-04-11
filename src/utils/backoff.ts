let counter = 0;

export class Backoff {
  currentInterval: number = 1000;
  timeout: any;
  counter: number;

  constructor(
    private readonly name: string,
    private readonly initialMillis: number,
    private readonly maxMillis: number,
    private readonly rate: number, // if 2 each times 2x longer
    private readonly action: () => void
  ) {
    this.currentInterval = initialMillis;
    this.scheduleNext();
    this.counter = ++counter;
  }

  private scheduleNext() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(this.doAction.bind(this), this.currentInterval);
    console.debug(`[${this.name}#${this.counter}] next backoff in ${this.currentInterval}ms: ${new Date(Date.now() + this.currentInterval)}`);
    this.currentInterval *= this.rate;
    if (this.currentInterval > this.maxMillis) {
      this.currentInterval = this.maxMillis;
    }
  }

  private doAction() {
    try {
      console.debug(`[${this.name}#${this.counter}] executing`);
      this.action();
    } catch (e) {
      console.error(e);
    } finally {
      this.scheduleNext();
    }
  }

  resetInterval() {
    console.debug(`[${this.name}#${this.counter}] Reseting backoff`);
    this.currentInterval = this.initialMillis;
    this.scheduleNext();
  }

  /** Call this to cancel executing. */
  stop() {
    clearTimeout(this.timeout);
  }
}
