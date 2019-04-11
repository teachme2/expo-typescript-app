import { action, observable } from "mobx";
import { ChatMessage, API_ChatMessage } from "../models/models";
import { Backoff } from "../utils/backoff";
import { Utils, ignore } from "../utils/misc";
import { ApiStore } from "./APIStore";
import { ApplicationStore } from "./ApplicationStore";
import { Dao } from "../dao";

const defaultLimit = 10; // FIXME! 50

export const FLD_NEW_MESSAGES = "newMessages";

interface LocalRootStore {
  apiStore: ApiStore;
  applicationStore: ApplicationStore;
  dao: Dao;
}

export class ChatStore {
  /**
   * Messages shown in the chat. Note that list can have "missing" parts. In that case the chat will show a button
   * to load more messages.
   */
  @observable
  chatMessages: ChatMessage[] = [];

  @observable
  showChatNotifications: boolean = true;

  @observable
  [FLD_NEW_MESSAGES]: ChatMessage[] = [];

  @observable
  replyToMessage: ChatMessage = null;

  @observable
  unreadMessages: number;

  reloadBackoff: Backoff;

  constructor(private readonly rootStore: LocalRootStore) {
    this.reloadBackoff = new Backoff("chat reload", 3 * 1000, 60 * 1000, 1.25, this.reload);
  }

  @action
  setShowChatNotifications(show: boolean, reason: string) {
    this.showChatNotifications = show;
    console.debug(`${show ? "Showing" : "Not showing"} toast msgs because: ${reason}`);
  }

  markAllMessagesAsRead = async () => {
    try {
      const now = Date.now();
      const rowsCount = await this.rootStore.dao.executeUpdate(ChatMessage, "set read_at=? where read_at=0", [now]);
      console.log(`Marked ${rowsCount} as read`);
      this.reloadUnreadMessages();
    } catch (e) {
      console.error(e);
    }
  };

  reloadUnreadMessages = async () => {
    try {
      /*
            for (const msg of await dao.query(ChatMessage, "1=1")) {
                console.log(`msg ${msg.id} reat_at=${msg.readAt}: ${msg.text}`);
            }
            */
      // TODO: Use count here, no need to load all:
      const msgs = await this.rootStore.dao.query(ChatMessage, "where read_at=0 limit 100");
      this.setUnreadMessages(Utils.size(msgs));
    } catch (e) {
      console.error(e);
    }
  };

  @action
  setUnreadMessages(count: number) {
    //Alert.alert(`unread ${count}`);
    this.unreadMessages = count;
  }

  @action
  setReplyToMessage(msg: ChatMessage) {
    this.replyToMessage = msg;
  }

  reload = async () => {
    console.log(`reloading(${Utils.size(this.chatMessages)})`);
    try {
      const lastMsgs = await this.lastMsgs(1);
      this.retrieveAndImportMessages(Utils.size(lastMsgs) > 0 ? lastMsgs[0].id : null);
    } catch (e) {
      console.warn(e);
    }
    try {
      await this.reloadUnreadMessages();
    } catch (e) {
      console.warn(e);
    }
  };

  async retrieveAndImportMessages(lastMessageID: string): Promise<void> {
    try {
      await this.loadMessages(lastMessageID);
    } catch (e) {
      Promise.reject(e);
    }

    if (!this.rootStore.applicationStore.networkAvailable) {
      return Promise.resolve();
    }

    try {
      const resp: any = null;
      console.log(`retrieving messages resp ${resp.status} `);
      this.importAPIMessages({} /* TODO */);
    } catch (e) {
      return Promise.reject(e);
    } finally {
      // Add messages from local db:
      await this.loadMessages(lastMessageID);
    }

    return Promise.resolve();
  }

  loadMessages = async (lastMessageID: string) => {
    try {
      let messages: ChatMessage[];
      let sql = `order by created_at desc limit ${defaultLimit} `;
      let params: any[] = [];
      if (lastMessageID) {
        const m = await this.rootStore.dao.loadIfExists(ChatMessage, lastMessageID);
        if (m) {
          sql = `where created_at <=? order by created_at desc limit ${defaultLimit} `;
          params = [m.createdAt];
        }
      }
      messages = await this.rootStore.dao.query(ChatMessage, sql, params);
      this.addMessages(messages);
    } catch (e) {
      console.error(e);
    }
  };

  lastMsgs = async (limit: number) => {
    return await this.rootStore.dao.query(ChatMessage, `order by created_at desc limit ${limit}`);
  };

  importAPIMessages = (updates: any) => {
    console.log(`update=${JSON.stringify(updates)}`);
    const msgs = this.convertAPIMsgs(updates.messages);
    //console.log("msgs=" + msgs);

    setTimeout(async () => {
      const lastMsgs = await this.lastMsgs(1);
      const lastCreatedAt = Utils.size(lastMsgs) > 0 ? lastMsgs[0].createdAt : 0;
      const newMsgs: ChatMessage[] = [];
      const importedMsgs: ChatMessage[] = [];
      for (const msg of msgs) {
        const existingMsg = await this.rootStore.dao.loadIfExists(ChatMessage, msg.id);
        if (existingMsg) {
          msg.readAt = existingMsg.readAt;
          await this.rootStore.dao.update(msg);
        } else {
          await this.rootStore.dao.insert(msg);
          importedMsgs.push(msg);
          if (msg.createdAt > lastCreatedAt) {
            newMsgs.push(msg);
          }
          if (msg.forceReply) {
            this.setReplyToMessage(msg);
          }
        }
      }

      console.debug(`Inserted ${importedMsgs.length} messages, of those ${newMsgs.length} are new`);

      setImmediate(() => {
        this.addMessages(msgs);
      });
      setImmediate(() => {
        if (newMsgs.length > 0) {
          this.reloadBackoff.resetInterval();
          this.updateNewMsgs(newMsgs);
        }
      });
      setImmediate(async () => {
        try {
          await this.reloadUnreadMessages();
        } catch (e) {
          console.warn(e);
        }
      });
    }, 10);
  };

  @action
  updateNewMsgs = (newMsgs: ChatMessage[]) => {
    this.newMessages = newMsgs;
  };

  /**
   * This method will show new message. New messages can be both:
   * - new messages (that must appear at the bottom)
   * - existing messages which weren't previously imported from the backend
   */
  @action
  addMessages(msgs: ChatMessage[]) {
    //console.debug(`Adding(maybe) ${ Utils.size(msgs) } messages`);
    let chatMsgs = this.chatMessages;

    const existingMsgsIDs: { [chatMsg: string]: ChatMessage } = {};
    for (const m of chatMsgs) {
      existingMsgsIDs[m.id] = m;
    }

    for (const newMsg of msgs) {
      if (!existingMsgsIDs[newMsg.id]) {
        chatMsgs.push(newMsg);
      }
      // Always save here, because it's possible we have an updated version of the message:
      existingMsgsIDs[newMsg.id] = newMsg;
    }

    this.chatMessages = chatMsgs.slice().sort((a: ChatMessage, b: ChatMessage) => Math.sign(a.createdAt - b.createdAt));
  }

  convertAPIMsgs = (apiMsgs: API_ChatMessage[]) => {
    if (!apiMsgs) {
      return (apiMsgs = []);
    }
    return apiMsgs.map(m => this.convertAPIMsg(API_ChatMessage.createFrom(m)));
  };

  convertAPIMsg = (apiMsg: API_ChatMessage) => {
    const msg = new ChatMessage();
    msg.id = apiMsg.id;
    msg.previousMsgId = apiMsg.previousID;
    msg.text = apiMsg.text;
    msg.quote = apiMsg.quote;
    msg.buttonsJSON = JSON.stringify(apiMsg.buttons);
    msg.hasButtons = Utils.size(apiMsg.buttons) > 0;
    msg.forceReply = apiMsg.forceReply;
    msg.name = apiMsg.name;
    msg.fromUser = apiMsg.fromUser;
    msg.createdAt = apiMsg.createdAt * 1000;
    msg.mediaURL = apiMsg.mediaURL;
    msg.mediaThumbnailURL = apiMsg.mediaThumbnailURL;
    msg.mediaTitle = apiMsg.mediaTitle;
    msg.mediaMIMEType = apiMsg.mediaMIMEType;
    msg.mediaWidth = apiMsg.mediaWidth;
    msg.mediaHeight = apiMsg.mediaHeight;
    return msg;
  };

  async sendMessage(msg: string, replyToMsg?: ChatMessage) {
    ignore(msg, replyToMsg);
    // TODO
  }

  async callback(msg: ChatMessage, data: string) {
    ignore(msg, data);
    // TODO
  }
}
