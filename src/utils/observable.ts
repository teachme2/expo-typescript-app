class Observable<T extends any> {
  _val: T;

  listeners: { [listenerKey: string]: (val: T) => void } = {};

  constructor(initial: T) {
    this._val = initial;
  }

  get value() {
    return this._val;
  }

  set value(val: T) {
    this._val = val;
    this.notifyListeners();
  }

  /** Do something with value and refresh. */
  updateAndNotifyListeners(something: (val: T) => void) {
      try {
          something(this._val)
      } catch (e) {
          console.error(e);
      } finally {
          this.notifyListeners();
      }
  }

  /**
   * Use this explicitly only if the value changed with `this.value.method()`, otherwise it's called every time it changed.
   */
  notifyListeners() {
    for (const key in this.listeners) {
        this.notifyListener(key);
    }
  }

  private notifyListener(key: string) {
      try {
        this.listeners[key](this._val);
      } catch (e) {
        console.error(e);
      }
  }

  addListenerAndGetKey(listener: (val: T) => void) {
    const key = "" + Math.random();
    this.listeners[key] = listener;
    setImmediate(() => {
        this.notifyListener(key);
    });
    return key;
  }

  removeListenerByKey(key: string) {
    delete this.listeners[key];
  }
}
