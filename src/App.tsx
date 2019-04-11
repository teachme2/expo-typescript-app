import { Provider } from "mobx-react";
import React from "react";
import { RootComponent } from "./RootComponent";
import { rootStore } from "./stores/RootStore";
import { Testing } from "./testing/testing";
import { renderCounter } from "./utils/misc";

class App extends React.Component {
  constructor(props: any) {
    super(props);
  }

  componentDidMount() {
    Testing.runAllTests();
  }

  render() {
    renderCounter.count("app");
    return (
      <Provider stores={rootStore}>
        <RootComponent />
      </Provider>
    );
  }
}

export default App;
