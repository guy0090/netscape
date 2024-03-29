import { logger } from "@/util/logging";
import { packetParser, win } from "@/background";
import { ipcMain, app, shell } from "electron";
import { autoUpdater } from "electron-updater";
import AppStore from "@/persistance/store";
import { renameOldEncounters } from "@/encounters/helpers";

class DamageMeterEvents {
  public static renameTriggered: boolean;

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
              appStore.setPassword(arg.value);
              return { message: "set-api-key" };
            } catch (err) {
              return { message: "set-api-key", error: err };
            }
          case "get-api-key":
            try {
              const pw = await appStore.getPassword();
              return { event: "get-api-key", message: { value: pw } };
            } catch (err) {
              return { message: "get-api-key", error: err };
            }
          case "reset-session":
            logger.debug("Client requested session reset");
            packetParser.resetPrevious();

            if (arg.force) packetParser.resetSession(100, false, true);
            else packetParser.resetSession(100, false, true);
            break;
          case "pause-session":
            logger.debug("Client requested session pause");
            packetParser.pauseSession();
            break;
          case "resume-session":
            logger.debug("Client requested session resume");
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
            if (!win) return;
            try {
              const val = arg.mini;
              if (val) {
                const { width, height, x, y } = win.getBounds();

                const direction = appStore.get("minifyDirection");
                win.setMinimumSize(346, 61);
                win.setBounds({
                  x,
                  y: y + (direction === 0 ? height - 61 : 0),
                  width,
                  height: 61,
                });
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
          case "rename-logs":
            if (this.renameTriggered)
              return { message: "Rename already triggered", count: 0 };

            this.renameTriggered = true;
            try {
              const renamed = await renameOldEncounters();
              return { message: "Renamed logs", count: renamed };
            } catch (err) {
              return err;
            }
          case "get-update":
            autoUpdater.checkForUpdates();
            break;
          case "install-update":
            try {
              autoUpdater.quitAndInstall();
            } catch {
              return { message: "Failed to install update" };
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
