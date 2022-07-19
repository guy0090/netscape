"use strict";

import path from "path";
import log from "electron-log";
import ms from "ms";
import {
  app,
  dialog,
  screen,
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
import { HttpBridge } from "@/bridge/http-bridge";
import DamageMeterEvents from "@/ipc/damage-meter";
import { PacketParser, PacketParserConfig } from "@/bridge/parser";
import AppStore from "@/persistance/store";
import { Session } from "@/encounters/objects";

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);
app.setAsDefaultProtocolClient("loal");

export const isDevelopment = process.env.NODE_ENV !== "production";
export const gotAppLock = app.requestSingleInstanceLock();
export const appStore = new AppStore();

export let httpBridge: HttpBridge;
export let electronBridge: ElectronBridge;
export let packetParser: PacketParser;

export const parserConfig: PacketParserConfig = {
  resetOnZoneChange: appStore.get("resetOnZoneChange") as boolean,
  removeOverkillDamage: appStore.get("removeOverkillDamage") as boolean,
  pauseOnPhaseTransition: appStore.get("pauseOnPhaseTransition") as boolean,
  uploadLogs: appStore.get("uploadLogs") as boolean,
  openUploadInBrowser: appStore.get("openInBrowserOnUpload") as boolean,
};

export const windowMode = appStore.get("windowMode") as number;
export let win: BrowserWindow;
export let hpBarWin: BrowserWindow;
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
          httpBridge.stop();
          // electronBridge.closeConnection();
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

  const { width, height } = appStore.get("meterDimensions") as {
    width: number;
    height: number;
  };
  const { x, y } = appStore.get("meterPosition") as { x: number; y: number };

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

async function createHpBar(screenWidth: number) {
  const { height, width } = appStore.get("hpBarDimensions") as {
    height: number;
    width: number;
  };

  const pos = appStore.get("hpBarPosition") as { x: number; y: number };

  if (pos.x === 0) pos.x = screenWidth / 2 - width / 2;

  hpBarWin = new BrowserWindow({
    minWidth: 500,
    minHeight: 40,
    width,
    height,
    x: pos.x,
    y: pos.y,
    skipTaskbar: false,
    frame: false,
    show: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: process.env
        .ELECTRON_NODE_INTEGRATION as unknown as boolean,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  hpBarWin.setAlwaysOnTop(true, "pop-up-menu");

  hpBarWin.on("resized", () => {
    log.debug("resized hpbar", hpBarWin.getBounds());
    const { width, height, x, y } = hpBarWin.getBounds();

    if (height > 61) {
      appStore.set("hpBarDimensions", { width, height });
      appStore.set("hpBarPosition", { x, y });
    }
  });

  hpBarWin.on("moved", () => {
    log.debug("moved hpbar", hpBarWin.getBounds());
    const { width, height, x, y } = hpBarWin.getBounds();

    appStore.set("hpBarDimensions", { width, height });
    appStore.set("hpBarPosition", { x, y });
  });

  hpBarWin.setIgnoreMouseEvents(true);
  appStore.on("change", ({ setting, value }) => {
    if (setting === "hpBarColor") {
      if (hpBarWin)
        hpBarWin.webContents.send("fromMain", {
          event: "new-setting",
          message: { setting, value },
        });
    } else if (setting === "hpBarClickable") {
      if (value) {
        hpBarWin.show();
        hpBarWin.setIgnoreMouseEvents(false);
      } else {
        // hpBarWin.hide();
        hpBarWin.setIgnoreMouseEvents(true);
      }
    }
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await hpBarWin.loadURL(
      (process.env.WEBPACK_DEV_SERVER_URL as string) + "#/hpbar"
    );
    if (!process.env.IS_TEST)
      hpBarWin.webContents.openDevTools({ mode: "detach", activate: false });
  } else {
    // createProtocol("app");
    // Load the index.html when not in development
    // win.loadURL("app://./index.html");
    hpBarWin.loadURL(`file://${__dirname}/index.html#/hpbar`);
    // win.webContents.openDevTools({ mode: "detach", activate: false });
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
  overlayWindow.attachTo(win, "LOST ARK (64-bit, DX11) v.2.4.1.2");

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
      httpBridge.stop();
      // electronBridge.closeConnection();
      clearInterval(updateInterval);
    } catch {
      // ignore
    }
    app.quit();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  if (!gotAppLock) {
    log.debug("App is already running");
    app.quit();
  } else {
    try {
      // electronBridge = new ElectronBridge(appStore);
      httpBridge = new HttpBridge(appStore);
    } catch (err) {
      log.error("Failed to initialize electron bridge", err);
      app.quit();
    }

    // Wait for connection to logger
    // electronBridge.on("ready", () => {
    httpBridge.on("listen", () => {
      packetParser = new PacketParser(appStore, parserConfig);

      // Start processing packets
      packetParser.startBroadcasting(200);
      // electronBridge.on("packet", (packet) => {
      httpBridge.on("packet", (packet) => {
        packetParser.parse(packet);
      });

      httpBridge.on("close", () => {
        try {
          packetParser.stopBroadcasting();
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

      // Initialize IPC events for window context
      DamageMeterEvents.initialize(appStore);

      const { width } = screen.getPrimaryDisplay().size;

      // Create main window
      createWindow();
      createHpBar(width);

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

      packetParser.on("show-hp", (data) => {
        if (hpBarWin) {
          if (hpBarWin.isMinimized() || !hpBarWin.isVisible()) {
            hpBarWin.show();
          }

          hpBarWin.webContents.send("fromMain", {
            event: "init-enc",
            message: data,
          });
        }
      });

      packetParser.on("boss-damaged", (data) => {
        if (hpBarWin) {
          hpBarWin.webContents.send("fromMain", {
            event: "boss-damaged",
            message: data,
          });
        }
      });

      packetParser.on("hide-hp", () => {
        const beingModified = appStore.get("hpBarClickable") as boolean;
        if (hpBarWin && !beingModified) {
          // hpBarWin.minimize();
          hpBarWin.hide();

          hpBarWin.webContents.send("fromMain", {
            event: "end-enc",
          });
        }
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

    /*
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
    */
  }
});

app.on("second-instance", (_e, argv) => {
  if (win) {
    win.focus();

    const encounterFile = argv.find((arg) => arg.includes(".enc"));
    if (encounterFile) {
      log.debug(`Loading encounter file ${encounterFile}`);
      packetParser.readEncounterFile(encounterFile);
    } else {
      log.debug("No encounter file specified, doing nothing");
    }
  }
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        packetParser.stopBroadcasting();
        // electronBridge.closeConnection();
        httpBridge.stop();
        clearInterval(updateInterval);
        clearInterval(updateInterval);
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      packetParser.stopBroadcasting();
      // electronBridge.closeConnection();
      httpBridge.stop();
      clearInterval(updateInterval);
      app.quit();
    });
  }
}
