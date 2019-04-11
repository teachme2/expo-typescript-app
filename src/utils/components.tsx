import React, { Component } from "react";
import { View } from "react-native";
import { renderCounter } from "./misc";

interface HorizontalLineProps {
  horizontalMargin?: string | number;
}
interface HorizontalLineState {}
export class HorizontalLine extends React.PureComponent<HorizontalLineProps, HorizontalLineState> {
  constructor(props: HorizontalLineProps) {
    super(props);
    this.state = {};
  }
  render() {
    renderCounter.count("horizontal line");
    return (
      <View
        style={{
          borderBottomColor: "gray",
          borderBottomWidth: 1,
          marginLeft: this.props.horizontalMargin ? this.props.horizontalMargin : "5%",
          marginRight: this.props.horizontalMargin ? this.props.horizontalMargin : "5%"
        }}
      />
    );
  }
}

export class Hidden extends React.PureComponent {
  render(): Component {
    renderCounter.count("hidden");
    return null;
  }
}
