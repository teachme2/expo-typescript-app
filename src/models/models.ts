import { Model, ModelDescriptor } from "../dao";

export class ChatMessage extends Model<string> {
  previousMsgId: string;
  text: string;
  quote: string;
  buttonsJSON: string;
  hasButtons: boolean; // so that we know in advance if we need to un-jsonize buttons
  forceReply: boolean;
  name: string;
  fromUser: boolean;
  createdAt: number;
  readAt: number = 0;

  mediaURL: string;
  mediaThumbnailURL: string;
  mediaTitle: string;
  mediaMIMEType: string;
  mediaWidth: number;
  mediaHeight: number;

  get buttons() {
    if (!this.buttonsJSON) {
      return [];
    }
    return <API_ChatMessageButton[]>JSON.parse(this.buttonsJSON);
  }

  getModelDescriptor(): ModelDescriptor<ChatMessage> {
    return new ModelDescriptor<ChatMessage>("chat_msgs", "text")
      .withColumn("text", "text", t => t.text, (t, value: any) => (t.text = value))
      .withColumn("quote", "text", t => t.quote, (t, value: any) => (t.quote = value))
      .withColumn("previous_id", "text", t => t.previousMsgId, (t, value: any) => (t.previousMsgId = value))
      .withColumn("force_reply", "integer", t => (t.forceReply ? 1 : 0), (t, value: any) => (t.forceReply = !!value))
      .withColumn("name", "text", t => t.name, (t, value: any) => (t.name = value))
      .withColumn("has_buttons", "integer", t => (t.hasButtons ? 1 : 0), (t, value: any) => (t.hasButtons = !!value))
      .withColumn("buttons_json", "text", t => t.buttonsJSON, (t, value: any) => (t.buttonsJSON = value))
      .withColumn("from_user", "integer", t => (t.fromUser ? 1 : 0), (t, value: any) => (t.fromUser = !!value))
      .withColumn("created_at", "integer", t => t.createdAt, (t, value: any) => (t.createdAt = value))
      .withColumn("read_at", "integer", t => t.readAt, (t, value: any) => (t.readAt = value))
      .withColumn("media_url", "text", t => t.mediaURL, (t, value: any) => (t.mediaURL = value))
      .withColumn("media_thumbnail_url", "text", t => t.mediaThumbnailURL, (t, value: any) => (t.mediaThumbnailURL = value))
      .withColumn("media_title", "text", t => t.mediaTitle, (t, value: any) => (t.mediaTitle = value))
      .withColumn("media_mime_type", "text", t => t.mediaMIMEType, (t, value: any) => (t.mediaMIMEType = value))
      .withColumn("media_width", "integer", t => t.mediaWidth, (t, value: any) => (t.mediaWidth = value))
      .withColumn("media_height", "integer", t => t.mediaHeight, (t, value: any) => (t.mediaHeight = value));
  }
}

export class API_ChatMessageButton {
  text: string;
  callbackData: string;

  static createFrom(source: any) {
    if ("string" === typeof source) source = JSON.parse(source);
    const result = new API_ChatMessageButton();
    result.text = source["text"];
    result.callbackData = source["callbackData"];
    return result;
  }

  //[API_ChatMessageButton:]

  //[end]
}
export class API_ChatMessage {
  id: string;
  previousID: string;
  userID: string;
  quote: string;
  text: string;
  buttons: API_ChatMessageButton[];
  replied: boolean;
  forceReply: boolean;
  name: string;
  fromUser: boolean;
  createdAt: number;
  mediaURL: string;
  mediaThumbnailURL: string;
  mediaTitle: string;
  mediaMIMEType: string;
  mediaWidth: number;
  mediaHeight: number;
  mediaCaption: string;

  static createFrom(source: any) {
    if ("string" === typeof source) source = JSON.parse(source);
    const result = new API_ChatMessage();
    result.id = source["id"];
    result.previousID = source["previousID"];
    result.userID = source["userID"];
    result.quote = source["quote"];
    result.text = source["text"];
    result.buttons = source["buttons"]
      ? source["buttons"].map(function(element: any) {
          return API_ChatMessageButton.createFrom(element);
        })
      : null;
    result.replied = source["replied"];
    result.forceReply = source["forceReply"];
    result.name = source["name"];
    result.fromUser = source["fromUser"];
    result.createdAt = source["createdAt"];
    result.mediaURL = source["mediaURL"];
    result.mediaThumbnailURL = source["mediaThumbnailURL"];
    result.mediaTitle = source["mediaTitle"];
    result.mediaMIMEType = source["mediaMIMEType"];
    result.mediaWidth = source["mediaWidth"];
    result.mediaHeight = source["mediaHeight"];
    result.mediaCaption = source["mediaCaption"];
    return result;
  }

  //[API_ChatMessage:]

  //[end]
}
export class API_ChatMessages {
  all: boolean;
  unreadCounters: { [userID: string]: number };
  messages: API_ChatMessage[];

  static createFrom(source: any) {
    if ("string" === typeof source) source = JSON.parse(source);
    const result = new API_ChatMessages();
    result.all = source["all"];
    result.unreadCounters = source["unreadCounters"];
    result.messages = source["messages"]
      ? source["messages"].map(function(element: any) {
          return API_ChatMessage.createFrom(element);
        })
      : null;
    return result;
  }

  //[API_ChatMessages:]

  //[end]
}