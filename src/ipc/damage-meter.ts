import log from "electron-log";
import { packetParser, win } from "@/background";
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
            log.info("Client requested session reset");
            packetParser.resetPrevious();

            if (arg.force) packetParser.resetSession(false, 0, false);
            else packetParser.resetSession(true, 0, false);
            break;
          case "pause-session":
            log.info("Client requested session pause");
            packetParser.pauseSession();
            break;
          case "resume-session":
            log.info("Client requested session resume");
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
          case "toggle-mini":
            try {
              const val = arg.mini;
              if (val) {
                const { width, height, x, y } = win.getBounds();

                win.setMinimumSize(346, 61);
                win.setBounds({ x, y: y + height - 61, width, height: 61 });
              } else {
                const { x, y } = appStore.get("meterPosition") as {
                  x: number;
                  y: number;
                };
                const { width, height } = appStore.get("meterDimensions") as {
                  width: number;
                  height: number;
                };
                win.setBounds({ x, y, width, height });
                win.setMinimumSize(346, 160);
              }
            } catch (err) {
              return err;
            }
            break;
          default:
            return { error: "Invalid event" };
        }
      }
    });
  }
}

export default DamageMeterEvents;
