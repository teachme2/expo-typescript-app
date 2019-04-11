import { Linking } from "expo";
import { default as React } from "react";
import { TextProps } from "react-native";
import { Testing } from "../testing/testing";
import { AppText } from "./custom_font_components";

interface TextWithLinksProps extends TextProps {
  text: string;
}
export class TextWithLinks extends React.PureComponent<TextWithLinksProps> {
  constructor(props: TextWithLinksProps) {
    super(props);
  }

  renderChunk(s: string, index: number) {
    if (s.indexOf("http") === 0) {
      return (
        <AppText key={"" + index} style={[{ color: "blue" }, this.props.style]} onPress={() => Linking.openURL(s)}>
          {s}
        </AppText>
      );
    } else {
      return <AppText key={"" + index}>{s}</AppText>;
    }
  }

  render() {
    return <AppText style={this.props.style}>{splitTextAndLinks(this.props.text).map((s, index) => this.renderChunk(s, index))}</AppText>;
  }
}

const delimiter = "" + Math.random() + Math.random();

function splitTextAndLinks(text: string): string[] {
  if (!text) {
    return [];
  }
  return text
    .replace(/https{0,1}:\S+/, s => {
      return delimiter + s + delimiter;
    })
    .split(delimiter);
}

Testing.registerTest("split text and links", ctx => {
  const parts = splitTextAndLinks("something https://aaa.bbb.ccc/aaa=bbb /ddd/eee?a=b");
  ctx.assertEquals(3, parts.length);
  ctx.assertEquals("something ", parts[0]);
  ctx.assertEquals("https://aaa.bbb.ccc/aaa=bbb", parts[1]);
  ctx.assertEquals(" /ddd/eee?a=b", parts[2]);
});
