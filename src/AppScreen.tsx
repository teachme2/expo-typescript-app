import { inject, observer } from "mobx-react";
import { default as React } from "react";
import { Alert, StatusBar, StyleSheet, View, ViewStyle } from "react-native";
import { NavigationActions, NavigationContainerComponent, SafeAreaView } from "react-navigation";
import { AppText } from "./components/custom_font_components";
import { BaseProps } from "./screens/common";
import { Stack } from "./stacks";

interface AppScreenProps extends BaseProps {}

@inject("stores")
@observer
export class AppScreen extends React.Component<AppScreenProps> {
  navigation: NavigationContainerComponent;

  constructor(props: AppScreenProps) {
    super(props);
  }

  navigate = (routeName: string) => {
    if (!this.navigation.dispatch(NavigationActions.navigate({ routeName: routeName }))) {
      Alert.alert("Error navigating");
    }
  };

  back = () => {
    if (!this.navigation.dispatch(NavigationActions.back())) {
      Alert.alert("Error navigating");
    }
  };

  componentWillMount() {}

  render() {
    const topPadding = StatusBar.currentHeight ? StatusBar.currentHeight : 0;
    const header = 60;
    //const footer = 55;
    /*
    const paddingTop = Platform.OS === "ios" ? 20 : 0;
    const paddingLeft = Platform.OS === "ios" ? 25 : 10;
    */
    //const screen = height - topPadding - header - (showFooter ? footer : 0) - bottomPadding;
    return (
      <SafeAreaView
        style={{
          flex: 1,
          flexDirection: "column",
          justifyContent: "space-between",
          zIndex: 1
        }}
      >
        <View style={[{ height: topPadding }]}>{/*<AppText>Empty top</AppText>*/}</View>

        <View
          style={[
            styles.header,
            {
              height: header,
              zIndex: 5
            }
          ]}
        >
          {/*<AppText>Header</AppText>*/}
          <View style={{ width: 53, height: 45, justifyContent: "center" }}>
            <AppText>...</AppText>
          </View>
          <View>
            <AppText style={[styles.headerTitle]}> ... </AppText>
          </View>
        </View>

        <View style={[styles.main, { flex: 1 }]}>
          <Stack
            ref={navigatorRef => {
              this.navigation = navigatorRef;
            }}
          />
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    flexDirection: "row"
  },
  headerTitle: {
    fontSize: 19,
    color: "#2e2e2e"
  },
  main: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#c9c9c9"
  },
  footer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    alignItems: "flex-start",
    justifyContent: "space-around"
  },
  footerButton: {
    height: 55,
    width: "45%",
    alignItems: "center",
    justifyContent: "center"
  },
  notificationContainer: {
    position: "absolute",
    right: 3,
    top: 1
  },
  notificationBackground: {
    backgroundColor: "#FF265D",
    borderRadius: 50,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center"
  },
  notificationText: {
    color: "#fff",
    fontSize: 11
  },
  taskAddButton: {
    backgroundColor: "#6235e9",
    width: 60,
    height: 60,
    borderRadius: 200,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    marginTop: -13
  } as ViewStyle
});
