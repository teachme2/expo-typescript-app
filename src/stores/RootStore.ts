import { SQLite } from "expo";
import { Dao } from "../dao";
import { ChatMessage } from "../models/models";
import { Testing } from "../testing/testing";
import { ApiStore } from "./APIStore";
import { ApplicationStore } from "./ApplicationStore";
import { ChatStore } from "./ChatStore";

export const DATABASE_FILE = `local.db`;

const storeInstances: { [dbFile: string]: any } = {};

export class RootStore {
  public readonly applicationStore: ApplicationStore = new ApplicationStore(this);
  public readonly apiStore: ApiStore = new ApiStore(this);
  public readonly chatStore: ChatStore = new ChatStore(this);
  public readonly dao: Dao;

  static instance: RootStore;

  constructor(databaseFile: string) {
    if (storeInstances[databaseFile]) {
      throw new Error(`Store ${databaseFile} already initialized`);
    }
    storeInstances[databaseFile] = this;

    this.dao = new Dao(SQLite.openDatabase(databaseFile));

    this.init();
  }

  public init() {
    this.dao.register(ChatMessage);
  }
}

export const rootStore = new RootStore(DATABASE_FILE);

// Use another store for testing
Testing.registerVar("stores", new RootStore(`test_${Date.now()}_${DATABASE_FILE}`));
