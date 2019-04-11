import { IObjectDidChange, observable, observe } from "mobx";
import { Alert, AsyncStorage } from "react-native";
import { Testing } from "../testing/testing";
import { Toasts } from "../utils/toasts";

export namespace Errors {
  /** If an error thrown implements this interface -- this is the message to show to the user. */
  export interface UserError {
    userError: string;
  }

  export function getUserError(e: any, defaultMsg?: string) {
    if ((e as UserError).userError) {
      return e.userError;
    }
    return defaultMsg;
  }

  export function alertErr(e: any, defaultMsg?: string) {
    Alert.alert(getUserError(e, defaultMsg));
  }

  export function toastErr(e: any, defaultMsg?: string) {
    Toasts.error(getUserError(e, defaultMsg));
  }
}

/** Dbg helper to ignore unused variables (so that the linter don't complain). Shouldn't be used in releases */
export function ignore(..._: any[]) {}

export function toBoolean(a: any) {
  if (!a) {
    return false;
  }
  return !!a;
}

/**
 * Custom variable that's automatically stored in AsyncStorage.
 * No need to mark with @observable, because the inner property is already observable.
 *
 * Can also be used to execute something only once, by usind onFirstSet.
 */
export class AsyncPersistedVariable<T extends any> {
  @observable
  private _val: T;

  onFirstSet: () => void;

  constructor(private readonly key: string, initVal: T, onFirstSet?: () => void) {
    this._val = initVal;
    this.onFirstSet = onFirstSet;
    setImmediate(async () => {
      await this.load();
    });
  }

  async load() {
    try {
      const val = await AsyncStorage.getItem(this.key);
      if (val === null && this._val !== null) {
        await AsyncStorage.setItem(this.key, JSON.stringify(this._val));
        if (this.onFirstSet) {
          await this.onFirstSet();
        }
      }
      this._val = JSON.parse(val);
    } catch (e) {
      throw new Error(`Error getting ${this.key}: ${e}`);
    }
    return this;
  }

  isSet() {
    return !!this._val;
  }

  get val(): T {
    return this._val;
  }

  set val(v: T) {
    if (v !== this._val) {
      setImmediate(async () => {
        try {
          await AsyncStorage.setItem(this.key, JSON.stringify(v));
        } catch (e) {
          console.error(e);
        }
      });
    }
    this._val = v;
  }
}

Testing.registerTest("test AsyncPersistentVariable", async ctx => {
  const key = "_async_";
  const apvar = new AsyncPersistedVariable<number>(key, 10);
  ctx.log("before:" + JSON.stringify(apvar));
  ctx.assert(10 === apvar.val, `val=${JSON.stringify(apvar.val)}`);

  ctx.log("after getvar:" + JSON.stringify(apvar));
  apvar.val = 111;

  // Since setting to async storage is done asynchronously, this call will is to force the save to finish:
  await AsyncStorage.getItem(key);

  ctx.assertEquals(111, apvar.val, "checking appvar");
  ctx.assertEquals(111, JSON.parse(await AsyncStorage.getItem(key)), "checking async storage");

  const apvar2 = new AsyncPersistedVariable<number>(key, -13);
  await apvar.load();
  ctx.assertEquals(111, JSON.parse(await AsyncStorage.getItem(key)), "checking async storage second time");
  ctx.assertEquals(111, apvar2.val, "checking apvar2");
});

/**
 * Container of functions to be executed when the component unmount. Cleanup should be called explisictly with:
 *   componentWillUnmount() {
 *       this.cleanup.cleanup();
 *   }
 */
export class CleanupContainer {
  cleanups: (() => void)[] = [];

  constructor() {}

  setRandomTimeout(f: () => void, min: number, max: number) {
    return this.setTimeout(f, Utils.randomInt(min, max));
  }

  setTimeout(f: () => void, time: number) {
    const timeout = setTimeout(f, time);
    this.addCleanup(() => clearTimeout(timeout));
    return timeout;
  }

  setImmediate(f: () => void) {
    const im = setImmediate(f);
    this.addCleanup(() => clearImmediate(im));
    return im;
  }

  setIntervalAndStartImmediately(f: () => void, time: number) {
    this.setTimeout(f, 10);
    return this.setInterval(f, time);
  }

  setInterval(f: () => void, time: number) {
    const interval = setInterval(f, time);
    this.addCleanup(() => clearInterval(interval));
    return interval;
  }

  mobxObserve(store: any, storePropery: string, listener: (change: IObjectDidChange) => void, fireImmediately?: boolean) {
    console.log(`adding listener ${storePropery}`);
    const fieldLIstener = (change: IObjectDidChange) => {
      if (change.name == storePropery) {
        listener(change);
      }
    };
    const dispose = observe(store, fieldLIstener, fireImmediately);
    this.addCleanup(() => dispose());
  }

  addCleanup(f: () => void) {
    this.cleanups.push(f);
  }

  cleanup = () => {
    this.cleanups.forEach(f => {
      try {
        f();
      } catch (e) {
        console.error(e);
      }
    });
    this.cleanups = [];
  };
}

export namespace Utils {
  export function firstNonNul(...objs: any[]) {
    if (size(objs) == 0) {
      return null;
    }
    if (objs[objs.length - 1] === null) {
      console.warn("last element must be not null");
    }
    for (const o of objs) {
      if (o) {
        return o;
      }
    }
    return null;
  }

  export function size(a: any) {
    if (!a) {
      return 0;
    }
    if ("object" == typeof a) {
      if ("length" in a) {
        return a.length;
      } else {
        return Object.keys(a).length;
      }
    }
    return 0;
  }

  export function isEmpty(a: any) {
    if (!a) {
      return true;
    }
    if ("object" == typeof a) {
      for (const _ in a) {
        return false;
      }
      return true;
    }
    return !a;
  }

  export function randomInt(from: number, to: number) {
    from = Math.min(from, to);
    to = Math.max(from, to);
    return Math.floor(Math.random() * (to - from)) + from;
  }

  Testing.registerTest("random number", ctx => {
    const [min, max] = [15, 20];
    let [mins, maxs] = [0, 0];
    for (let i = 0; i < 200; i++) {
      const n = randomInt(min, max);
      ctx.assert(n >= min, `n=${n}, min/max=${min}/${max}`);
      ctx.assert(n < max, `n=${n}, min/max=${min}/${max}`);
      if (n == min) {
        mins++;
      }
      if (n == max - 1) {
        maxs++;
      }
    }
    ctx.assert(mins > 0, `mins=${mins}`);
    ctx.assert(maxs > 0, `maxs=${maxs}`);
  });
}

export namespace Strings {
  export function trim(s: string) {
    if (!s) {
      return "";
    }
    return s.trim();
  }
}

interface RenderCounterData {
  name: string;
  count: number;
}

class RenderCounter {
  counters: { [name: string]: RenderCounterData } = {};

  constructor() {
    setInterval(this.logAndReset, 10 * 1000);
  }

  count = (name: string) => {
    console.debug(`rendering ${name}`);
    if (this.counters[name]) {
      this.counters[name].count++;
    } else {
      this.counters[name] = { name: name, count: 1 };
    }
  };

  logAndReset = () => {
    const counters: RenderCounterData[] = [];
    for (const name in this.counters) {
      counters.push(this.counters[name]);
    }
    if (counters.length > 0) {
      counters.sort((a, b) => Math.sign(b.count - a.count));
      let msg = "Render counters:\n";
      for (const c of counters) {
        msg += `${c.count} times rendering ${c.name}` + "\n";
      }
      console.log(msg);
    }
    this.counters = {};
  };
}

export const renderCounter = new RenderCounter();
