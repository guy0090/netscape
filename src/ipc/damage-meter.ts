import { packetParser } from "@/background";
import { ipcMain, app } from "electron";
import AppStore from "@/persistance/store";

class DamageMeterEvents {
  public static initialize(appStore: AppStore): void {
    ipcMain.handle("toMain", (event, arg) => {
      if (!arg.message || typeof arg.message !== "string") {
        return { error: "Invalid event" };
      } else {
        switch (arg.message) {
          case "set-setting":
            appStore.set(arg.setting, arg.value);
            return { message: "set-setting" };
          case "get-setting":
            // console.log(`Client requested setting: ${arg.setting}`);
            return {
              event: "get-setting",
              message: {
                setting: arg.setting,
                value: appStore.get(arg.setting),
              },
            };
          case "reset-session":
            console.log("Client requested session reset");
            if (arg.force) packetParser.resetSession(false, 0);
            else packetParser.resetSession(true, 0);
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
          default:
            return { error: "Invalid event" };
        }
      }
    });
  }
}

export default DamageMeterEvents;
