import { packetParser } from "@/background";
import { ipcMain, app, shell } from "electron";
import AppStore from "@/persistance/store";

class DamageMeterEvents {
  public static initialize(appStore: AppStore): void {
    ipcMain.handle("toMain", async (event, arg) => {
      if (!arg.message || typeof arg.message !== "string") {
        return { error: "Invalid event" };
      } else {
        switch (arg.message) {
          case "set-setting":
            appStore.set(arg.setting, arg.value);
            return { message: "set-setting" };
          case "get-setting":
            return {
              event: "get-setting",
              message: {
                setting: arg.setting,
                value: appStore.get(arg.setting),
              },
            };
          case "set-api-key":
            try {
              await AppStore.setPassword(arg.value);
              return { message: "set-api-key" };
            } catch (err) {
              return { message: "set-api-key", error: err };
            }
          case "get-api-key":
            try {
              const pw = await AppStore.getPassword();
              return { event: "get-api-key", message: { value: pw } };
            } catch (err) {
              return { message: "get-api-key", error: err };
            }
          case "reset-session":
            console.log("Client requested session reset");
            if (arg.force) packetParser.resetSession(false, 0, false);
            else packetParser.resetSession(true, 0, false);
            break;
          case "pause-session":
            console.log("Client requested session pause");
            packetParser.pauseSession();
            break;
          case "resume-session":
            console.log("Client requested session resume");
            packetParser.resumeSession();
            break;
          case "version":
            return {
              event: "version",
              message: app.getVersion(),
            };
          case "open-url":
            if (arg.url) shell.openExternal(arg.url);
            break;
          default:
            return { error: "Invalid event" };
        }
      }
    });
  }
}

export default DamageMeterEvents;
