import { inject, observer } from "mobx-react";
import { default as React } from "react";
import { AppScreen } from "./AppScreen";
import { RootStore } from "./stores/RootStore";

const myErrorHandler = (e: any, isFatal?: boolean) => {
  console.error(`uncaught ${isFatal ? "fatal" : ""} error: ${e}`);
  const defaultErrorHandler = ErrorUtils.getGlobalHandler();
  defaultErrorHandler(e, isFatal);
};
ErrorUtils.setGlobalHandler(myErrorHandler);

interface RootProps {
  stores?: RootStore;
}

/** Component deciding what to show when the app is started. */
@inject("stores")
@observer
export class RootComponent extends React.Component<RootProps> {
  constructor(props: any) {
    super(props);
  }

  render() {
    console.log("render" + this.constructor.name);

    return <AppScreen />;
  }
}
