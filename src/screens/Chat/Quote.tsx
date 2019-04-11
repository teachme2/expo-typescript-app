import { default as React } from "react";
import { View } from "react-native";
import { AppText } from "../../components/custom_font_components";
import { renderCounter } from "../../utils/misc";
import { replyStyling } from "./chat_common";

interface ChatQuoteProps {
  quote: string;
}
export class ChatQuote extends React.PureComponent<ChatQuoteProps> {
  constructor(props: ChatQuoteProps) {
    super(props);
    //this.state = new ChatQuoteState();
  }
  render() {
    renderCounter.count("quote");
    if (!this.props.quote) {
      return null;
    }
    return (
      <View style={[replyStyling.msgBackground, { marginHorizontal: -10, marginBottom: 5 }]}>
        <AppText style={{ color: "#4C525B" }}>{this.props.quote}</AppText>
      </View>
    );
  }
}
