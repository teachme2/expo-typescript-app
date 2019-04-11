import { action, observable } from "mobx";
import { ConnectionInfo, NetInfo } from "react-native";
import { ApiStore } from "./APIStore";

interface LocalRootStore {
  apiStore: ApiStore;
  applicationStore: ApplicationStore;
}

export class ApplicationStore {
  @observable
  isReady: boolean = false;

  @observable
  connectionType: string;

  @observable
  networkAvailable: boolean;

  constructor(public readonly rootStore: LocalRootStore) {
    this.init();
  }

  init = async () => {
    this.isReady = true;
    await this.setupNetworkAndSessionChecks();
  };

  checkSessionStatus = async () => {
    // TODO
  };

  setupNetworkAndSessionChecks = async () => {
    this.checkSessionStatus();

    NetInfo.addEventListener("connectionChange", (connInfo: ConnectionInfo) => {
      this.updateNetworkState(connInfo);
    });
    this.updateNetworkState(await NetInfo.getConnectionInfo());
  };

  @action
  updateNetworkState = (connInfo: ConnectionInfo) => {
    console.log(`connInfo.type=${connInfo ? connInfo.type : "none"}`);
    this.connectionType = connInfo.type;
    this.networkAvailable = connInfo.type != "none";
  };

  logout = async () => {
    console.debug(`Logging out`);
    // TODO
  };
}
