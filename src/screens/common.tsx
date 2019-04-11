import { NavigationScreenProp } from "react-navigation";
import { RootStore } from "../stores/RootStore";

export interface BaseProps {
  stores?: RootStore;
  navigation?: NavigationScreenProp<any, any>;
}
