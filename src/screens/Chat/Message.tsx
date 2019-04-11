import { default as React } from "react";
import { Image, Platform, StyleSheet, TextStyle, TouchableHighlight, TouchableOpacity, View, ViewStyle } from "react-native";
import { AppText } from "../../components/custom_font_components";
import { TextWithLinks } from "../../components/TextWithLinks";
import { ChatMessage, API_ChatMessageButton } from "../../models/models";
import { renderCounter } from "../../utils/misc";
import { replyStyling, styles } from "./chat_common";
import { ChatQuote } from "./Quote";

interface MessageProps {
  msg: ChatMessage;
  onClickButton: (msg: ChatMessage, data: string) => void;
  onPlayVideo: (msg: ChatMessage) => void;
  onSelectMsgToReply: (msg: ChatMessage) => void;
  //prevMsg: ChatMessage;
  //onLoadMissingMsgs: (messageID: string) => void;
}
class MessageState {
  clicked: boolean = false;
}
export class Message extends React.PureComponent<MessageProps, MessageState> {
  constructor(props: MessageProps) {
    super(props);
    this.state = new MessageState();

    this.onSelectMsgToReply = this.onSelectMsgToReply.bind(this);
  }

  onSelectMsgToReply() {
    this.props.onSelectMsgToReply(this.props.msg);
  }

  onOpenVideo = () => {
    this.props.onPlayVideo(this.props.msg);
  };

  render() {
    renderCounter.count("message");
    return (
      <View key={this.props.msg.id} style={{ flex: 1 }}>
        <View
          style={{
            ...(messageStyles.messageStyle as any),
            alignSelf: this.props.msg.fromUser ? "flex-end" : "flex-start",
            backgroundColor: this.props.msg.fromUser ? "#6E3BEC" : "#F1ECFC"
          }}
        >
          {/*<AppText>{this.props.msg.readAt}</AppText>*/}
          {this.renderMsgContents()}
          <MessageOptionButtons msg={this.props.msg} onClickButton={this.props.onClickButton} />
          {!this.props.msg.fromUser &&
            (this.props.msg.forceReply ? (
              <TouchableOpacity onPress={this.onSelectMsgToReply} style={Platform.OS === "ios" ? replyStyling.replyButtonIos : replyStyling.replyButtonAndroid}>
                <Image style={{ width: 18, height: 18 }} source={Platform.OS === "ios" ? require("../../../assets/reply.png") : require("../../../assets/reply-white.png")} />
              </TouchableOpacity>
            ) : null)}
        </View>
      </View>
    );
  }

  renderMsgContents() {
    if (this.props.msg.text) {
      return (
        <View>
          <ChatQuote quote={this.props.msg.quote} />
          <TextWithLinks text={this.props.msg.text} style={{ ...(messageStyles.textStyle as any), color: this.props.msg.fromUser ? "#fff" : "#4C525B" }} />
        </View>
      );
    } else if (this.props.msg.mediaURL && this.props.msg.mediaMIMEType) {
      const type = this.props.msg.mediaMIMEType.split("/")[0];
      switch (type) {
        case "image":
          const w = this.props.msg.mediaWidth ? this.props.msg.mediaWidth : 200;
          const h = this.props.msg.mediaHeight ? this.props.msg.mediaHeight : 150;
          return (
            <View>
              {/* <AppText>{this.props.msg.mediaWidth}x{this.props.msg.mediaHeight}</AppText> */}
              <Image
                style={{
                  width: 200,
                  height: (h * 200) / w,
                  resizeMode: "contain",
                  borderRadius: messageBorderRadius / 4
                }}
                source={{ uri: this.props.msg.mediaURL }}
              />
            </View>
          );
        case "audio":
          return <AppText>Audio missing</AppText>;
        case "video":
          // const ratio = messageWidth / this.props.msg.mediaWidth;
          return (
            <View>
              <Image
                style={{
                  width: 200,
                  height: 150,
                  borderRadius: messageBorderRadius / 4
                }}
                source={this.props.msg.mediaThumbnailURL ? { uri: this.props.msg.mediaThumbnailURL } : require("../../../assets/hourglass.png")}
              />
              <View
                style={[
                  videoOverlayStyles.overlay,
                  {
                    zIndex: 2
                  }
                ]}
              >
                <Image
                  style={{
                    width: 60,
                    height: 60,
                    opacity: 0.5
                  }}
                  source={require("../../../assets/play-circle.png")}
                />
              </View>
              <TouchableHighlight
                style={[
                  videoOverlayStyles.overlay,
                  {
                    borderRadius: messageBorderRadius / 4,
                    zIndex: 3
                  }
                ]}
                underlayColor="rgba(0, 0, 0, 0.1)"
                onPress={this.onOpenVideo}
              >
                <Image
                  style={{
                    width: 26,
                    height: 26,
                    marginLeft: 4
                  }}
                  source={require("../../../assets/play.png")}
                />
              </TouchableHighlight>
            </View>
          );
      }
    }

    return <AppText style={messageStyles.textStyle}>???</AppText>;
  }
}

function MessageOptionButtons({ msg, onClickButton }: { msg: ChatMessage; onClickButton: (msg: ChatMessage, data: string) => void }) {
  if (!msg.hasButtons || !msg.buttons || msg.buttons.length == 0) {
    return null;
  }
  return (
    <View>
      {msg.buttons.map((btn: API_ChatMessageButton) => (
        <MessageOptionButton key={msg.key} msg={msg} btn={btn} onClickButton={onClickButton} />
      ))}
    </View>
  );
}

function MessageOptionButton({ msg, btn, onClickButton }: { msg: ChatMessage; btn: API_ChatMessageButton; onClickButton: (msg: ChatMessage, data: string) => void }) {
  return (
    <TouchableHighlight style={styles.button} underlayColor="#5b0be5" onPress={() => onClickButton(msg, btn.callbackData)}>
      <AppText style={styles.buttonText}>{btn.text}</AppText>
    </TouchableHighlight>
  );
}

const videoOverlayStyles = StyleSheet.create({
  overlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%"
  }
});

const messageWidth = 85;
const messageBorderRadius = 25;
const messageStyles = StyleSheet.create({
  messageStyle: {
    maxWidth: `${messageWidth}%`,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 15,
    borderRadius: messageBorderRadius
  } as ViewStyle,
  textStyle: {
    fontSize: 18
  } as TextStyle
});
