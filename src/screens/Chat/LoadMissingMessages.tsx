import { default as React } from "react";
import { TouchableOpacity, View } from "react-native";
import { AppText } from "../../components/custom_font_components";

interface LoadMissingMessagesProps {
  messageID: string;
  onLoadMissingMsgs: (messageID: string) => void;
}
export class LoadMissingMessages extends React.PureComponent<LoadMissingMessagesProps, any> {
  constructor(props: LoadMissingMessagesProps) {
    super(props);
  }

  onPress = () => {
    this.props.onLoadMissingMsgs(this.props.messageID);
  };

  render() {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <TouchableOpacity onPress={this.onPress}>
          <AppText>Load missing messages</AppText>
        </TouchableOpacity>
      </View>
    );
  }
}
