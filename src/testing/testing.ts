import { Assert } from "../utils/assert";

/* Tests are run only in debug mode, but set this to false to disable even that. */
const RUN_TESTS = true;

export namespace Testing {
  const MAX_TEST_TIME_SECS = 30;

  export class TestingCtx {
    logs: string[] = [];
    private cleanups: (() => void)[] = [];

    constructor(private readonly testName: string) {}

    log(str: string) {
      console.debug(str);
      this.logs.push(str);
    }

    assert(expr: any, descr: string = "", ...params: any[]) {
      if (!expr) {
        console.error(`[${this.testName}] ${Assert.dbgString(descr, params)}
-----
Logs:
${this.logs.join("\n")}`);
      }
    }

    assertEquals(expr1: any, expr2: any, descr: string = "", ...params: any[]) {
      if (expr1 !== expr2) {
        console.error(`[${this.testName}] ${Assert.dbgString(descr, params)}
${expr1} (${typeof expr1}) !=== ${expr2} (${typeof expr2})
-----
Logs:
${this.logs.join("\n")}`);
      }
    }

    fail(reason: string) {
      this.log(`FAILED ${reason}`);
      throw new Error();
    }

    cleanLater(f: () => void) {
      this.cleanups.push(f);
    }

    async clean() {
      for (const f of this.cleanups) {
        try {
          await f();
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  const vars: any = {};
  const tests: { [desc: string]: (ctx: TestingCtx, vars: any) => void } = {};

  let testRun: boolean = false;
  let runOnlyRegexp: RegExp = null;

  export function runOnly(regexp: RegExp) {
    console.warn(`Running only tests matching ${regexp}`);
    runOnlyRegexp = regexp;
  }

  export function registerVar(name: string, value: any) {
    vars[name] = value;
  }

  export function registerTests(description: string, ...tests: ((ctx: TestingCtx, vars: any) => void)[]) {
    for (let n = 0; n < tests.length; n++) {
      registerTest(`${description} #${1 + n}`, tests[n]);
    }
  }

  /**
   * Executes test on the device if it's tun in developer mode.
   */
  export function registerTest(description: string, test: (ctx: TestingCtx, vars: any) => void) {
    if (!RUN_TESTS) {
      console.debug(`[${description}] NOT running test`);
      return;
    }
    if (__DEV__) {
      if (tests[description]) {
        console.error(`Two tests with description "${description}"`);
      } else {
        tests[description] = test;
      }
    }
  }

  export function runAllTests() {
    if (testRun) {
      console.error(`Tests already run`);
      return;
    }
    testRun = true;

    let i = 0;
    for (const desc in tests) {
      i += 1;
      setTimeout(async () => {
        await runTest(desc, tests[desc]);
      }, i * 100); // Fire one test every 100 millis
    }
  }

  async function runTest(description: string, test: (ctx: TestingCtx, vars: any) => void) {
    if (__DEV__) {
      if (runOnlyRegexp) {
        if (description.match(runOnlyRegexp)) {
          console.warn(`[${description}] <-- running only`);
        } else {
          console.debug(`[${description}] skipping`);
          return;
        }
      }

      const ctx = new TestingCtx(description);
      const maxTimeTimeout = setTimeout(() => {
        console.error(`[${description}] running more than ${MAX_TEST_TIME_SECS}s`);
      }, MAX_TEST_TIME_SECS * 1000);

      try {
        console.debug(`[${description}] test started`);
        await test(ctx, vars);
        await ctx.clean();
        console.debug(`[${description}] test finished`);
      } catch (e) {
        console.error(`[${description}] test error: ${e.message ? e.message : e}
${ctx.logs.join("\n")}`);
      } finally {
        clearTimeout(maxTimeTimeout);
        console.debug(`[${description}] test done`);
      }
    }
  }
}
