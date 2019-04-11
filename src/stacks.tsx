import { createAppContainer, createStackNavigator } from "react-navigation";
import { Routes } from "./routes";
import ChatScreen from "./screens/Chat/ChatScreen";

////////////////////////////////////////////////////////////////////////////////////////////////////

export const Stack = createAppContainer(
  createStackNavigator(
    {
      [Routes.SCREEN_CHAT]: ChatScreen
    },
    {
      headerMode: "none",
      initialRouteName: Routes.SCREEN_CHAT
    }
  )
);
