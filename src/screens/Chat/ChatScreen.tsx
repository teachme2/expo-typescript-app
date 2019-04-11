import { Video } from "expo";
import { inject, observer } from "mobx-react";
import { default as React } from "react";
import {
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle
} from "react-native";
import { Header } from "react-navigation";
import { AppButton } from "../../components/AppButton";
import { AppText, AppTextInput } from "../../components/custom_font_components";
import { ChatMessage } from "../../models/models";
import { FLD_NEW_MESSAGES } from "../../stores/ChatStore";
import { Assert } from "../../utils/assert";
import { CleanupContainer, renderCounter, toBoolean, Utils } from "../../utils/misc";
import { Toasts } from "../../utils/toasts";
import { BaseProps } from "../common";
import { replyStyling } from "./chat_common";
import { LoadMissingMessages } from "./LoadMissingMessages";
import { Message } from "./Message";

interface ChatScreenProps extends BaseProps {}

class ChatScreenState {
  messageText: string = "";
  isAtBottom: boolean = false;
  refreshing: boolean = false;
  sending: boolean = false;
}

@inject("stores")
@observer
export default class ChatScreen extends React.Component<ChatScreenProps, ChatScreenState> {
  scrollViewRef: ScrollView; // TODO: FlatList!
  videoRef: any;

  cleanup = new CleanupContainer();

  constructor(props: ChatScreenProps) {
    super(props);
    this.state = new ChatScreenState();
    this.props.navigation.addListener("willFocus", this.willFocus);
    this.props.navigation.addListener("didBlur", this.didBlur);
  }

  willFocus = () => {
    this.props.stores.chatStore.setShowChatNotifications(!this.state.isAtBottom, "focus");
    this.props.stores.chatStore.reload();

    this.cleanup.mobxObserve(this.props.stores.chatStore, FLD_NEW_MESSAGES, _ => {
      const newMsgs = this.props.stores.chatStore[FLD_NEW_MESSAGES];
      if (Utils.size(newMsgs) > 0) {
        setTimeout(this.onScrollToBottom, 10);
      }
    });
  };

  didBlur = () => {
    this.props.stores.chatStore.setShowChatNotifications(false, "blur");
    this.cleanup.cleanup();
  };

  onScrollToBottom = (animated: boolean = true) => {
    console.log("scrolling");
    if (this.scrollViewRef) {
      this.scrollViewRef.scrollToEnd({ animated: animated });
    }
    console.log("done scrolling");
  };

  onSelectMsgToReply = (msg: ChatMessage) => {
    this.props.stores.chatStore.setReplyToMessage(msg);
  };

  componentDidMount() {
    this.cleanup.setTimeout(() => this.onScrollToBottom(false), 1);
  }

  componentWillUnmount() {
    this.cleanup.cleanup();
  }

  submitMessage = async () => {
    if (!this.state.messageText) {
      Toasts.warning("Empty message");
      Keyboard.dismiss();
      return;
    }
    const replyMessage = this.props.stores.chatStore.replyToMessage;
    try {
      this.setState({ sending: true });
      await this.props.stores.chatStore.sendMessage(this.state.messageText, replyMessage);
      Keyboard.dismiss();
      this.setState({ messageText: "" });
      this.props.stores.chatStore.setReplyToMessage(null);
      setTimeout(this.onScrollToBottom, 10);
    } catch (e) {
      console.error("error sending msg", e);
      Toasts.error(`Error sending ${replyMessage ? "reply" : "message"}`);
    } finally {
      this.setState({ sending: false });
    }
  };

  onPlayVideo = async (msg: ChatMessage) => {
    Assert.assert(msg.mediaURL, "media url must be set");
    Assert.assert(this.videoRef, "video ref must be set");
    try {
      await this.videoRef.loadAsync({ uri: msg.mediaURL });
      //await this.videoRef.playAsync();
      await this.videoRef.presentFullscreenPlayer();
    } catch (e) {
      console.error(e);
    }
  };

  onCallbackButtonClick = async (msg: ChatMessage, data: string) => {
    try {
      await this.props.stores.chatStore.callback(msg, data);
      Toasts.short("Reply sent");
    } catch (e) {
      Toasts.error("Error sending reply");
      console.error(e);
    }
  };

  onScroll = async (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    /*
        console.log(`contentOffset=${JSON.stringify(event.nativeEvent.contentOffset)}`);
        console.log(`contentInset=${JSON.stringify(event.nativeEvent.contentInset)}`);
        console.log(`contentSize=${JSON.stringify(event.nativeEvent.contentSize)}`);
        console.log(`layoutMeasurement=${JSON.stringify(event.nativeEvent.layoutMeasurement)}`);
        /*
        /*
        [15:20:55] contentOffset={"y":966.5,"x":0}
        [15:20:55] contentInset={"bottom":0,"top":0,"right":0,"left":0}
        [15:20:55] contentSize={"height":1464.5,"width":319}
        [15:20:55] layoutMeasurement={"height":498,"width":320}
        */

    const ne = event.nativeEvent;
    const isAtBottom = ne.contentOffset.y + ne.layoutMeasurement.height >= ne.contentSize.height - 20;
    this.setState({ isAtBottom: isAtBottom });
    this.props.stores.chatStore.setShowChatNotifications(!isAtBottom, `scroll isAtBottom=${isAtBottom}`);
    if (isAtBottom) {
      try {
        await this.props.stores.chatStore.markAllMessagesAsRead();
      } catch (e) {
        console.error(e);
      }
    }
  };

  onLoadMissingMessages = async (messageID: string) => {
    try {
      await this.props.stores.chatStore.retrieveAndImportMessages(messageID);
      this.setState({ refreshing: false });
      Toasts.short("Messages loaded");
    } catch (e) {
      Toasts.error("Err: " + e);
      console.error(e);
    }
  };

  cancelReplying = () => {
    this.props.stores.chatStore.setReplyToMessage(null);
  };

  // Check to see if user is using an iPhone X or higher
  // Add 40px to keyboardVerticalOffset if true
  keyboardVerticalOffset = () => {
    if (Platform.OS != "ios") {
      return Header.HEIGHT + 28;
    }
    const dim = Dimensions.get("window");
    if (dim.height >= 812 || dim.width >= 812) {
      return Header.HEIGHT + 40;
    } else {
      return Header.HEIGHT + 17;
    }
  };

  onRefresh = () => {
    this.setState({ refreshing: true });
    this.onLoadMissingMessages("");
  };

  onInputFocus = () => {
    setTimeout(this.onScrollToBottom, 600);
  };

  render() {
    renderCounter.count("chat screen");
    return (
      <KeyboardAvoidingView behavior="padding" style={[{ flex: 1, flexDirection: "column", justifyContent: "space-between" }]} keyboardVerticalOffset={this.keyboardVerticalOffset()}>
        <StatusBar barStyle="default" backgroundColor="#fff" />
        <Video
          ref={(component: any) => (this.videoRef = component)}
          style={{ width: 0, height: 0 }} /* not shown, will be played fullscreen if needed */
          rate={1.0}
          volume={1.0}
          resizeMode="contain"
          isMuted={false}
          shouldPlay={false}
          isLooping={false}
          useNativeControls={true}
        />
        {/* Chat feed */}
        <ScrollView
          onScroll={this.onScroll}
          refreshControl={<RefreshControl refreshing={this.state.refreshing} onRefresh={this.onRefresh} />}
          ref={component => (this.scrollViewRef = component)}
          scrollEnabled={true}
          style={[{ flex: 1 }]}
        >
          <View style={{ flexGrow: 1, paddingHorizontal: 15 }}>
            <View style={{ height: 15 }} />
            {this.props.stores.chatStore.chatMessages.map((msg, index) => {
              const prevMsg = index == 0 ? null : this.props.stores.chatStore.chatMessages[index - 1];
              return (
                <View>
                  {toBoolean(prevMsg && msg.previousMsgId && prevMsg.id != msg.previousMsgId) && <LoadMissingMessages onLoadMissingMsgs={this.onLoadMissingMessages} messageID={msg.id} />}
                  <Message onSelectMsgToReply={this.onSelectMsgToReply} key={msg.id} msg={msg} onPlayVideo={this.onPlayVideo} onClickButton={this.onCallbackButtonClick} />
                </View>
              );
            })}
          </View>
          {this.state.sending && (
            <View
              style={{
                maxWidth: "82%",
                alignSelf: "flex-end",
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 25,
                margin: 15,
                marginTop: 0,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#6E3BEC",
                opacity: 0.4
              }}
            >
              <AppText style={{ color: "#fff", fontSize: 18 }}>{this.state.messageText}</AppText>
            </View>
          )}
        </ScrollView>

        {/* Text input and reply */}
        <View style={[{ flexDirection: "column" }]}>
          {this.props.stores.chatStore.replyToMessage && (
            <View style={replyStyling.container}>
              <View style={replyStyling.msgBackground}>
                <TouchableOpacity style={replyStyling.cancel} onPress={this.cancelReplying}>
                  <Image style={{ width: 10, height: 10 }} source={require("../../../assets/cross_big.png")} />
                </TouchableOpacity>
                <AppText style={{ color: "#4C525B" }}>...</AppText>
              </View>
            </View>
          )}
          <View
            style={{
              flexDirection: "row",
              borderTopWidth: StyleSheet.hairlineWidth,
              borderColor: "#c9c9c9",
              paddingHorizontal: 15,
              paddingVertical: 8
            }}
          >
            <AppTextInput
              style={{ ...textInput, flex: 1, paddingLeft: 0, paddingTop: 15 }}
              onChangeText={text => this.setState({ messageText: text })}
              placeholder={"Send a message..."}
              placeholderTextColor={"#AFBACA"}
              multiline={true}
              onFocus={this.onInputFocus}
            >
              {this.state.messageText}
            </AppTextInput>
            {/* <TouchableOpacity
                            style={{
                                width: 52,
                                height: 52,
                                backgroundColor: "#7544E9",
                                justifyContent: "center",
                                alignItems: "center",
                                alignSelf: "center",
                                borderRadius: 4,
                                padding: 8
                            }}
                            onPress={this.submitMessage}
                        >
                            <Image style={{ width: 24, height: 24 }} source={require("../../../assets/send.png")} />
                        </TouchableOpacity> */}
            <AppButton
              iosOpacity={false}
              style={{
                width: 52,
                height: 52,
                backgroundColor: "#7544E9",
                justifyContent: "center",
                alignItems: "center",
                alignSelf: "center",
                borderRadius: 4,
                marginTop: Platform.OS === "ios" ? 2 : 0
              }}
              onPress={this.submitMessage}
              buttonType="buttonAddPurple"
            >
              <Image style={{ width: 24, height: 24 }} source={require("../../../assets/send.png")} />
            </AppButton>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }
}

const textInput: any = {
  backgroundColor: "white",
  borderColor: "#f0f1f3",
  minHeight: 50,
  fontSize: 18,
  color: "#4C525B",
  paddingHorizontal: 15,
  paddingVertical: 15
} as StyleProp<ViewStyle>;
