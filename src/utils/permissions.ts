import { Permissions } from "expo";

export async function askForPermission(permission: Permissions.PermissionType): Promise<boolean> {
  const { status: existingStatus } = await Permissions.getAsync(permission);
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Permissions.askAsync(permission);
    finalStatus = status;
  }

  return new Promise<boolean>((resolve, _) => {
    resolve(finalStatus === "granted");
  });
}
