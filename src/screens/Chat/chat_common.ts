import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  button: {
    margin: 4,
    padding: 4,
    borderRadius: 4,
    backgroundColor: "#772ef5",
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2
  },
  buttonText: {
    fontSize: 18,
    color: "#f9f9f9",
    textAlign: "center"
  }
});

export const replyStyling = StyleSheet.create({
  replyButtonIos: {
    position: "absolute",
    zIndex: 9,
    right: -30,
    bottom: "50%"
  },
  replyButtonAndroid: {
    padding: 5,
    paddingLeft: 7,
    paddingBottom: 7,
    marginRight: -20,
    marginBottom: -10,
    marginTop: 5,
    borderBottomEndRadius: 25,
    borderTopLeftRadius: 5,
    backgroundColor: "#772ef5",
    width: 35,
    alignSelf: "flex-end"
  },
  container: {
    backgroundColor: "#fff",
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee"
  },
  msgBackground: {
    backgroundColor: "#f3f2f4",
    padding: 10,
    borderRadius: 5,
    borderLeftWidth: 3,
    borderColor: "#772ef5"
  },
  cancel: {
    position: "absolute",
    zIndex: 9,
    right: 5,
    top: 5,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center"
  }
});
