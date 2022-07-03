"use strict";

import path from "path";
import log from "electron-log";
import ms from "ms";
import {
  app,
  dialog,
  protocol,
  Tray,
  Menu,
  BrowserWindow,
  globalShortcut,
} from "electron";
import { autoUpdater } from "electron-updater";
import { overlayWindow } from "electron-overlay-window";
// import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import { ElectronBridge } from "@/bridge/electron-bridge";
import DamageMeterEvents from "@/ipc/damage-meter";
import { PacketParser, PacketParserConfig } from "@/bridge/parser";
import AppStore from "@/persistance/store";
import { Session } from "./encounters/objects";

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);
app.setAsDefaultProtocolClient("loal");

export const isDevelopment = process.env.NODE_ENV !== "production";
export const gotAppLock = app.requestSingleInstanceLock();
export const appStore = new AppStore();
export const electronBridge = new ElectronBridge(appStore);

export const parserConfig: PacketParserConfig = {
  resetOnZoneChange: appStore.get("resetOnZoneChange") as boolean,
  removeOverkillDamage: appStore.get("removeOverkillDamage") as boolean,
  pauseOnPhaseTransition: appStore.get("pauseOnPhaseTransition") as boolean,
  uploadLogs: appStore.get("uploadLogs") as boolean,
  openUploadInBrowser: appStore.get("openInBrowserOnUpload") as boolean,
};

export const packetParser = new PacketParser(parserConfig);

export const windowMode = appStore.get("windowMode") as number;
export let win: BrowserWindow;
export let attached = false;
export let tray: Tray;
export let updateInterval: ReturnType<typeof setInterval> | undefined;

function setupTray() {
  tray = new Tray(
    isDevelopment
      ? path.resolve(__dirname, "../public/icons/netscape.png")
      : path.resolve(__dirname, "icons/netscape.png")
  );

  const menu = Menu.buildFromTemplate([
    {
      label: "Quit",
      click() {
        try {
          packetParser.stopBroadcasting();
          electronBridge.closeConnection();
          clearInterval(updateInterval);
        } catch {
          // ignore
        }
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Netscape");
  tray.setContextMenu(menu);
}

async function createWindow() {
  setupTray();

  appStore.on("change", ({ setting, value }) => {
    switch (setting) {
      case "pauseOnPhaseTransition":
        packetParser.setPauseOnPhaseTransition(value);
        break;
      case "resetOnZoneChange":
        packetParser.setResetOnZoneChange(value);
        break;
      case "removeOverkillDamage":
        packetParser.setRemoveOverkillDamage(value);
        break;
      case "uploadLogs":
        packetParser.setUploadLogs(value);
        break;
      case "openInBrowserOnUpload":
        packetParser.setOpenUploadInBrowser(value);
        break;
      default:
        break;
    }

    if (win)
      win.webContents.send("fromMain", {
        event: "new-setting",
        message: { setting, value },
      });
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let extraParams: any = overlayWindow.WINDOW_OPTS;
  if (windowMode === 0) {
    extraParams = {
      skipTaskbar: false,
      frame: false,
      show: true,
      transparent: true,
      resizable: true,
    };
  }

  const { width, height } = appStore.get("meterDimensions") as Record<
    string,
    number
  >;
  const { x, y } = appStore.get("meterPosition") as Record<string, number>;

  win = new BrowserWindow({
    maxWidth: 900,
    maxHeight: 900,
    minHeight: 160, // 61 is actual min content height
    minWidth: 346,
    x,
    y,
    width,
    height,
    webPreferences: {
      nodeIntegration: process.env
        .ELECTRON_NODE_INTEGRATION as unknown as boolean,
      preload: path.join(__dirname, "preload.js"),
    },
    ...extraParams,
  });

  if (windowMode === 0) {
    globalShortcut.register("Ctrl + H", () => {
      if (win) {
        const isOnTop = win.isAlwaysOnTop();
        if (isOnTop) win.setAlwaysOnTop(false, "normal");
        else win.setAlwaysOnTop(true, "pop-up-menu");
      }
    });
    win.setAlwaysOnTop(true, "pop-up-menu");
  }

  win.on("resized", () => {
    log.debug("resized", win.getBounds());
    const { width, height, x, y } = win.getBounds();

    // Don't change dimension settings on minify
    if (height > 61) {
      appStore.set("meterDimensions", { width, height });
      appStore.set("meterPosition", { x, y });
    }
  });

  win.on("moved", () => {
    log.debug("moved", win.getBounds());
    const { width, height, x, y } = win.getBounds();

    // Don't change dimension settings on minify
    if (height > 61) {
      appStore.set("meterDimensions", { width, height });
      appStore.set("meterPosition", { x, y });
    }
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    if (!process.env.IS_TEST)
      win.webContents.openDevTools({ mode: "detach", activate: false });
  } else {
    // createProtocol("app");
    // Load the index.html when not in development
    // win.loadURL("app://./index.html");
    win.loadURL(`file://${__dirname}/index.html`);
    // win.webContents.openDevTools({ mode: "detach", activate: false });

    autoUpdater.checkForUpdatesAndNotify();
    setInterval(() => {
      try {
        autoUpdater.checkForUpdatesAndNotify();
      } catch (err) {
        log.error("Update check failed", err);
      }
    }, ms("10m")); // 10min checks
  }
}

function initOverlay() {
  const { width, height } = appStore.get("meterDimensions") as Record<
    string,
    number
  >;
  const { x, y } = appStore.get("meterPosition") as Record<string, number>;

  win.setIgnoreMouseEvents(false);
  makeInteractive();
  overlayWindow.attachTo(win, "LOST ARK (64-bit, DX11) v.2.3.5.1");

  overlayWindow.on("attach", () => {
    attached = true;
    log.info(`Overlay attached`);
    overlayWindow.emit("moveresize", { x, y, width, height });
  });
}

function makeInteractive() {
  let isInteractable = true;

  function toggleOverlayState() {
    if (isInteractable) {
      win.setIgnoreMouseEvents(true);
      isInteractable = false;
      overlayWindow.focusTarget();
      win.webContents.send("focus-change", false);
    } else {
      win.setIgnoreMouseEvents(false);
      isInteractable = true;
      overlayWindow.activateOverlay();
      win.webContents.send("focus-change", true);
    }
  }

  globalShortcut.register("Ctrl + H", toggleOverlayState);
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    try {
      packetParser.stopBroadcasting();
      electronBridge.closeConnection();
      clearInterval(updateInterval);
    } catch {
      // ignore
    }
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  if (!gotAppLock) {
    dialog.showErrorBox(
      "Error Starting",
      "Could not start app due to a second instance being present. Close all other instances before attempting to start."
    );
    try {
      packetParser.stopBroadcasting();
      electronBridge.closeConnection();
      clearInterval(updateInterval);
    } catch {
      // ignore
    }
    app.quit();
  }

  // Wait for connection to logger
  electronBridge.on("ready", () => {
    // Start processing packets
    packetParser.startBroadcasting(200);
    electronBridge.on("packet", (packet) => {
      packetParser.parse(packet);
    });

    // Initialize IPC events for window context
    DamageMeterEvents.initialize(appStore);

    // Create main window
    createWindow();

    // Start packet parser events
    packetParser.on("session-broadcast", (data: Session) => {
      if (win)
        win.webContents.send("fromMain", {
          event: "session",
          message: data,
        });
    });

    packetParser.on("raid-end", (data) => {
      if (win)
        win.webContents.send("fromMain", {
          event: "end-session",
          message: data,
        });
    });

    packetParser.on("pause-session", (data) => {
      if (win)
        win.webContents.send("fromMain", {
          event: "pause-session",
          message: data,
        });
    });

    packetParser.on("resume-session", (data) => {
      if (win)
        win.webContents.send("fromMain", {
          event: "resume-session",
          message: data,
        });
    });

    packetParser.on("reset-session", (data) => {
      if (win)
        win.webContents.send("fromMain", {
          event: "reset-session",
          message: data,
        });
    });

    packetParser.on("zone-change", () => {
      if (win)
        win.webContents.send("fromMain", {
          event: "zone-change",
          message: "",
        });
    });

    if (windowMode === 1) {
      log.info("Attaching overlay");
      // Attach overlay delayed
      setTimeout(() => {
        initOverlay();
      }, 1000);
    }
  });

  electronBridge.on("disconnected", () => {
    try {
      packetParser.stopBroadcasting();
      electronBridge.closeConnection();
      clearInterval(updateInterval);
      app.quit();
    } catch (err) {
      dialog.showErrorBox(
        "Error",
        "Disconnected from logger process; Exiting app."
      );
      app.exit();
    }
  });
});

app.on("second-instance", () => {
  if (win) win.focus();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        packetParser.stopBroadcasting();
        electronBridge.closeConnection();
        clearInterval(updateInterval);
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      packetParser.stopBroadcasting();
      electronBridge.closeConnection();
      clearInterval(updateInterval);
      app.quit();
    });
  }
}
