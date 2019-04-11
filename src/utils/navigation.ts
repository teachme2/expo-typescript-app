import { NavigationContainerComponent } from "react-navigation";

export namespace NavigationUtils {
  export function getRouteNameFromNavigationState(state: any) {
    if (state && "routes" in state && "index" in state) {
      return state.routes[state.index].routeName;
    }
    return "";
  }

  export function getRouteNameFromNavigation(navigation: NavigationContainerComponent) {
    if (!navigation) {
      return "";
    }
    if (!navigation.state) {
      return "";
    }
    return getRouteNameFromNavigationState((navigation.state as any)["nav"]);
  }
}
