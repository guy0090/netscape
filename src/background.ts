"use strict";

import winctl from "winctl";
import path from "path";
import { logger } from "@/util/logging";
import ms from "ms";
import {
  app,
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
import LostArkLogger from "@/bridge/logger";
import DamageMeterEvents from "@/ipc/damage-meter";
import { PacketParser, PacketParserConfig } from "@/bridge/parser";
import AppStore from "@/persistance/store";
import { Session } from "@/encounters/objects";

app.disableHardwareAcceleration();

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);
app.setAsDefaultProtocolClient("loal");

export const isDevelopment = process.env.NODE_ENV !== "production";
export const gotAppLock = app.requestSingleInstanceLock();
export const appStore = new AppStore();

export let loaLogger: LostArkLogger;
export let packetParser: PacketParser;

export const parserConfig: PacketParserConfig = {
  resetOnZoneChange: appStore.get("resetOnZoneChange") as boolean,
  removeOverkillDamage: appStore.get("removeOverkillDamage") as boolean,
  pauseOnPhaseTransition: appStore.get("pauseOnPhaseTransition") as boolean,
  uploadLogs: appStore.get("uploadLogs") as boolean,
  openUploadInBrowser: appStore.get("openInBrowserOnUpload") as boolean,
  uploadUnlisted: appStore.get("uploadUnlisted") as boolean,
};

export let windowMode = appStore.get("windowMode") as number;
export let win: BrowserWindow | undefined;
export let hpBarWin: BrowserWindow | undefined;
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
          loaLogger.stop();
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
      // case "pauseOnPhaseTransition":
      //   packetParser.setPauseOnPhaseTransition(value);
      //   break;
      // case "resetOnZoneChange":
      //   packetParser.setResetOnZoneChange(value);
      //   break;
      case "removeOverkillDamage":
        packetParser.setRemoveOverkillDamage(value);
        break;
      case "uploadLogs":
        packetParser.setUploadLogs(value);
        break;
      case "openInBrowserOnUpload":
        packetParser.setOpenUploadInBrowser(value);
        break;
      case "uploadUnlisted":
        packetParser.setUploadUnlisted(value);
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
    if (!win) return;

    logger.debug("Resized", win.getBounds());
    const { width, height, x, y } = win.getBounds();

    // Don't change dimension settings on minify
    if (height > 61) {
      appStore.set("meterDimensions", { width, height });
      appStore.set("meterPosition", { x, y });
    }
  });

  win.on("moved", () => {
    if (!win) return;

    logger.debug("Moved", win.getBounds());
    const { width, height, x, y } = win.getBounds();

    // Don't change dimension settings on minify
    if (height > 61) {
      appStore.set("meterDimensions", { width, height });
      appStore.set("meterPosition", { x, y });
    }
  });

  win.on("close", () => {
    packetParser?.stopBroadcasting();
    loaLogger?.stop();
    hpBarWin?.destroy();

    app.quit();
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

    startUpdater();
  }
}

function startUpdater() {
  autoUpdater
    .checkForUpdatesAndNotify()
    .then((update) => {
      logger.updater("Initial update check complete", update);
      update?.downloadPromise
        ?.then((download) => {
          logger.updater("Initial update download complete", download);
        })
        .catch((e) => {
          logger.updater("Initial update download failed", e);
        });
    })
    .catch((err) => {
      logger.updater("Initial update check failed", err);
    });

  setInterval(() => {
    autoUpdater
      .checkForUpdatesAndNotify()
      .then((update) => {
        logger.updater("Update check complete", update);
      })
      .catch((e) => {
        logger.updater("Failed to check for updates", e);
      });
  }, ms("10m")); // 10min checks

  autoUpdater.on("update-available", () => {
    logger.updater("Update available");
    if (win) {
      win.webContents.send("fromMain", {
        event: "update-found",
      });
    }
  });

  autoUpdater.on("update-not-available", () => {
    if (win) {
      win.webContents.send("fromMain", {
        event: "update-not-found",
      });
    }
  });

  autoUpdater.on("download-progress", (progressObj) => {
    const percent = Math.round(progressObj.percent);
    logger.updater(`Update dl progress: ${percent}%`);
    if (win) {
      win.webContents.send("fromMain", {
        event: "update-progress",
        message: {
          progress: percent,
        },
      });
    }
  });

  autoUpdater.on("update-downloaded", () => {
    logger.updater("Update downloaded");
    if (win) {
      win.webContents.send("fromMain", {
        event: "update-downloaded",
      });
    }
  });
}

async function createHpBar(screenWidth: number) {
  if (hpBarWin) return;

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
    if (!hpBarWin) return;

    logger.debug("Resized HP Bar", hpBarWin.getBounds());
    const { width, height, x, y } = hpBarWin.getBounds();

    if (height > 61) {
      appStore.set("hpBarDimensions", { width, height });
      appStore.set("hpBarPosition", { x, y });
    }
  });

  hpBarWin.on("moved", () => {
    if (!hpBarWin) return;

    logger.debug("Moved HP Bar", hpBarWin.getBounds());
    const { width, height, x, y } = hpBarWin.getBounds();

    appStore.set("hpBarDimensions", { width, height });
    appStore.set("hpBarPosition", { x, y });
  });

  hpBarWin.on("closed", () => {
    hpBarWin = undefined;
  });

  hpBarWin.setIgnoreMouseEvents(true);
  appStore.on("change", async ({ setting, value }) => {
    if (!hpBarWin) await createHpBar(screenWidth);

    if (setting === "hpBarColor") {
      hpBarWin?.webContents.send("fromMain", {
        event: "new-setting",
        message: { setting, value },
      });
    } else if (setting === "hpBarClickable") {
      if (value) {
        hpBarWin?.show();
        hpBarWin?.setIgnoreMouseEvents(false);
      } else {
        // hpBarWin.hide();
        hpBarWin?.setIgnoreMouseEvents(true);
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

function initOverlay(title: string) {
  if (!win) return;

  const { width, height } = appStore.get("meterDimensions") as Record<
    string,
    number
  >;
  const { x, y } = appStore.get("meterPosition") as Record<string, number>;

  win.setIgnoreMouseEvents(false);
  makeInteractive();
  overlayWindow.attachTo(win, title);

  overlayWindow.on("attach", () => {
    attached = true;
    logger.info("Overlay attached");
    overlayWindow.emit("moveresize", { x, y, width, height });
  });
}

function makeInteractive() {
  let isInteractable = true;

  function toggleOverlayState() {
    if (isInteractable) {
      win?.setIgnoreMouseEvents(true);
      isInteractable = false;
      overlayWindow.focusTarget();
      win?.webContents.send("focus-change", false);
    } else {
      win?.setIgnoreMouseEvents(false);
      isInteractable = true;
      overlayWindow.activateOverlay();
      win?.webContents.send("focus-change", true);
    }
  }

  globalShortcut.register("Ctrl + H", toggleOverlayState);
}

// Quit when all windows are closed.
app.on("window-all-closed", async () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    try {
      packetParser.stopBroadcasting();
      loaLogger.stop();
      // electronBridge.closeConnection();
      clearInterval(updateInterval);
      app.quit();
    } catch {
      app.exit();
    }
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  if (!gotAppLock) {
    logger.error("App is already running");
    app.quit();
  } else {
    try {
      loaLogger = new LostArkLogger();
      await loaLogger.start();

      logger.debug(
        `Logger started - Listening on device: ${loaLogger.device} (${loaLogger.address})`
      );
    } catch (err) {
      logger.error("Failed to initialize electron bridge", err);
      app.quit();
    }

    packetParser = new PacketParser(appStore, parserConfig);

    // Start processing packets
    packetParser.startBroadcasting(200);
    loaLogger.on("packet", (packet) => {
      packetParser.parse(packet);
    });

    // Initialize IPC events for window context
    DamageMeterEvents.initialize(appStore);

    const { width } = screen.getPrimaryDisplay().size;

    const windowRgx = /LOST ARK \(64-bit, DX11\) v.[0-9].[0-9].[0-9].[0-9]/;
    const lostArkWindow = winctl.GetWindowByClassName(
      "EFLaunchUnrealUWindowsClient"
    );

    const invalidTitle =
      lostArkWindow.getTitle() === "" ||
      !windowRgx.test(lostArkWindow.getTitle());

    // If the Lost Ark client isn't opened, ignore the overlay setting
    // TODO: Wait until client is open, then spawn window
    if (invalidTitle && windowMode !== 0) {
      windowMode = 0;
      logger.info("Game client not open, ignoring overlay mode");
    } else {
      logger.info(
        `Game Client Open - Attaching to Window: '${lostArkWindow.getTitle()}'`,
        { gameMonitor: lostArkWindow.getMonitor() }
      );
    }

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

    packetParser.on("show-hp", async (data) => {
      if (!hpBarWin) await createHpBar(width);

      if (hpBarWin?.isMinimized() || !hpBarWin?.isVisible()) {
        hpBarWin?.show();
      }
      hpBarWin?.webContents.send("fromMain", {
        event: "init-enc",
        message: data,
      });
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
      logger.debug("Hiding HP Bar", { beingModified });
      if (hpBarWin && !beingModified) {
        // hpBarWin.minimize();
        hpBarWin.hide();

        hpBarWin.webContents.send("fromMain", {
          event: "end-enc",
        });
        logger.debug("Hid HP Bar");
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
      logger.debug("Attaching overlay");
      // Attach overlay delayed
      setTimeout(() => {
        initOverlay(lostArkWindow.getTitle());
      }, 1000);
    }

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
      logger.debug(`Loading encounter file ${encounterFile}`);
      packetParser.readEncounterFile(encounterFile);
    } else {
      logger.debug("No encounter file specified, doing nothing");
    }
  } else {
    app.exit();
  }
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        packetParser.stopBroadcasting();
        // electronBridge.closeConnection();
        loaLogger.stop();
        clearInterval(updateInterval);
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      packetParser.stopBroadcasting();
      // electronBridge.closeConnection();
      loaLogger.stop();
      clearInterval(updateInterval);
      app.quit();
    });
  }
}
