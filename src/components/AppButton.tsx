import React from "react";
import { GestureResponderEvent, Platform, TouchableHighlight, TouchableNativeFeedback, TouchableOpacity, View, StyleSheet } from "react-native";
import { renderCounter } from "../utils/misc";
import { Toasts } from "../utils/toasts";
import { AppText } from "./custom_font_components";

interface AppButtonProps {
  text?: string;
  onPress: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  buttonType: "buttonAddPurple";
  style?: any;
  disabled?: boolean;
  underlayColor?: any;
  iosOpacity?: boolean;
  key?: any;
}

class AppButtonState {}

export class AppButton extends React.Component<AppButtonProps, AppButtonState> {
  constructor(props: AppButtonProps) {
    super(props);
    this.state = new AppButtonState();

    this.onPress = this.onPress.bind(this);
    this.onLongPress = this.onLongPress.bind(this);
  }

  iosButton = (buttonStyles: any, underlayColor: string) => {
    return (
      <TouchableHighlight
        disabled={this.props.disabled}
        onPress={this.onPress}
        onLongPress={this.onLongPress}
        style={[buttonStyles.button, this.props.style]}
        underlayColor={underlayColor}
        key={this.props.key}
      >
        <View style={buttonStyles.view ? buttonStyles.view : {}}>{this.props.children ? this.props.children : <AppText style={buttonStyles.text}>{this.props.text}</AppText>}</View>
      </TouchableHighlight>
    );
  };

  iosButtonOpacity = (buttonStyles: any) => {
    return (
      <TouchableOpacity key={this.props.key} onPress={this.onPress} onLongPress={this.onLongPress} style={[buttonStyles.button, this.props.style]}>
        <View style={buttonStyles.view ? buttonStyles.view : {}}>{this.props.children ? this.props.children : <AppText style={buttonStyles.text}>{this.props.text}</AppText>}</View>
      </TouchableOpacity>
    );
  };

  android = (buttonStyles: any, underlayColor: string) => (
    <View style={[buttonStyles.button, this.props.style, { overflow: "hidden" }]}>
      <TouchableNativeFeedback
        style={[buttonStyles.button, this.props.style]}
        disabled={this.props.disabled}
        onPress={this.onPress}
        onLongPress={this.onLongPress}
        background={TouchableNativeFeedback.Ripple(underlayColor, false)}
        key={this.props.key}
      >
        <View style={[buttonStyles.view, { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" }]}>
          {this.props.children ? this.props.children : <AppText style={buttonStyles.text}>{this.props.text}</AppText>}
        </View>
      </TouchableNativeFeedback>
    </View>
  );

  onPress() {
    if (this.props.onPress) {
      setTimeout(this.props.onPress, 20);
    }
  }

  onLongPress() {
    Toasts.debugIfDev("long press");
    if (this.props.onLongPress) {
      setTimeout(this.props.onLongPress, 20);
    }
  }

  render() {
    renderCounter.count("button");

    let buttonStyles: any;
    let underlayColor: string;

    switch (this.props.buttonType) {
      case "buttonAddPurple":
        buttonStyles = buttonAddPurpleStyles;
        underlayColor = "#2e0d82";
        break;
    }

    if (this.props.underlayColor) {
      underlayColor = this.props.underlayColor;
    }

    if (Platform.OS === "ios") {
      if (this.props.iosOpacity) {
        return this.iosButtonOpacity(buttonStyles);
      }
      return this.iosButton(buttonStyles, underlayColor);
    }
    return this.android(buttonStyles, underlayColor);
  }
}

export const buttonAddPurpleStyles = StyleSheet.create({
  button: {
    backgroundColor: "#6235e9",
    width: 60,
    height: 60,
    borderRadius: 200,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    marginTop: -13
  }
});