export namespace Assert {
  export function dbgString(msg: string, params: any[]) {
    if (!msg || !params) {
      return msg;
    }
    let n = 0;
    return msg.replace(/(\{\}|%o)/g, () => {
      return params ? params[n++] : "?";
    });
  }

  export function assert(e: any, msgIfFalse: string = "", ...params: any[]) {
    if (!e) {
      const err = new Error(dbgString(msgIfFalse, params));
      console.error(err.message);
      throw err;
    }
  }

  export function assertEquals(expr1: any, expr2: any, msgIfFalse: string = "", ...params: any[]) {
    if (expr1 !== expr2) {
      const err = new Error(dbgString(msgIfFalse, params) + `: "${expr1}" (${typeof expr1}) !== "${expr2}" (${typeof expr2})`);
      console.error(err.message);
      throw err;
    }
  }
}
