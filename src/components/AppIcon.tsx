import React from "react";
import { View, TouchableNativeFeedback, TouchableOpacity, Platform, StyleSheet, GestureResponderEvent } from "react-native";

interface AppIconProps {
  onPress: (event: GestureResponderEvent) => void;
  style?: object;
  // The 'size' prop should be the highest measurement of the image/icon (e.g if width is greater than height, 'size' should be the width's value)
  size: number;
  rippleColor?: string;
}

class AppIconState {}

export class AppIcon extends React.Component<AppIconProps, AppIconState> {
  constructor(props: AppIconProps) {
    super(props);
    this.state = new AppIconState();
  }

  androidIcon = () => {
    const onPress = this.props.onPress;
    const size = this.props.size + 25;
    const rippleColor = this.props.rippleColor ? this.props.rippleColor : "#d0d0d0";
    return (
      <View style={[styles.androidIcon, this.props.style, { width: size, height: size, overflow: "hidden" }]}>
        <TouchableNativeFeedback onPress={() => setTimeout(onPress, 20)} background={TouchableNativeFeedback.Ripple(rippleColor, false)}>
          <View style={[styles.androidIcon, { width: size, height: size }]}>{this.props.children}</View>
        </TouchableNativeFeedback>
      </View>
    );
  };

  render() {
    const onPress = this.props.onPress;
    const size = this.props.size + 12;
    return (
      <View>
        {Platform.OS === "android" ? (
          this.androidIcon()
        ) : (
          <TouchableOpacity onPress={onPress} style={{ width: size, height: size }}>
            {this.props.children}
          </TouchableOpacity>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  androidIcon: {
    borderRadius: 200,
    justifyContent: "center",
    alignItems: "center"
  }
});
