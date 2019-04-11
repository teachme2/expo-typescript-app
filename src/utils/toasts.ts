import Toast from "react-native-root-toast";

export namespace Toasts {
  export function short(msg: string) {
    return Toast.show(msg, {
      duration: Toast.durations.SHORT,
      position: Toast.positions.CENTER
    });
  }

  export function long(msg: string) {
    return Toast.show(msg, {
      duration: Toast.durations.LONG,
      position: Toast.positions.CENTER
    });
  }

  export function error(msg: string) {
    return Toast.show(msg, {
      duration: Toast.durations.SHORT,
      position: Toast.positions.CENTER,
      backgroundColor: "red"
    });
  }

  export function warning(msg: string) {
    return Toast.show(msg, {
      duration: Toast.durations.SHORT,
      position: Toast.positions.CENTER,
      backgroundColor: "orange"
    });
  }

  export function debugIfDev(msg: string) {
    if (__DEV__) {
      return Toast.show(msg, {
        duration: Toast.durations.SHORT,
        position: Toast.positions.CENTER,
        backgroundColor: "gray"
      });
    }
  }
}
