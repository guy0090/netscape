import { EventEmitter } from "events";
import Store, { Schema } from "electron-store";
import os from "os";
import keytar from "keytar";
import { logger } from "@/util/logging";

const isDevelopment = process.env.NODE_ENV === "development";

const storeSchema: Schema<Record<string, unknown>> = {
  version: {
    type: "number",
    default: 0,
  },
  opacity: {
    type: "string",
    default: "0.9",
  },
  meterPosition: {
    type: "object",
    properties: {
      x: {
        type: "number",
        default: 0,
      },
      y: {
        type: "number",
        default: 0,
      },
    },
    default: {
      x: 0,
      y: 0,
    },
  },
  meterDimensions: {
    type: "object",
    properties: {
      width: {
        type: "number",
        default: 900,
      },
      height: {
        type: "number",
        default: 614,
      },
    },
    default: {
      width: 900,
      height: 614,
    },
  },
  hpBarPosition: {
    type: "object",
    properties: {
      x: {
        type: "number",
        default: 0,
      },
      y: {
        type: "number",
        default: 100,
      },
    },
    default: {
      x: 0,
      y: 100,
    },
  },
  hpBarDimensions: {
    type: "object",
    properties: {
      width: {
        type: "number",
        default: 600,
      },
      height: {
        type: "number",
        default: 40,
      },
    },
    default: {
      width: 600,
      height: 40,
    },
  },
  anonymizeMeter: {
    type: "boolean",
    default: false,
  },
  compactStyle: {
    type: "boolean",
    default: false,
  },
  pauseOnPhaseTransition: {
    type: "boolean",
    default: true,
  },
  resetOnZoneChange: {
    type: "boolean",
    default: true,
  },
  removeOverkillDamage: {
    type: "boolean",
    default: true,
  },
  server: {
    type: "string",
    default: "steam",
  },
  useWinpcap: {
    type: "boolean",
    default: true,
  },
  windowMode: {
    type: "number",
    default: 0, // 0 = always-on-top; 1 = overlay
  },
  showUploadButton: {
    type: "boolean",
    default: true,
  },
  uploadLogs: {
    type: "boolean",
    default: false,
  },
  openInBrowserOnUpload: {
    type: "boolean",
    default: false,
  },
  uploadUnlisted: {
    type: "boolean",
    default: true,
  },
  minifyDirection: {
    default: 0, // 0 = Down, 1 = Up
    type: "number",
  },
  minifyDelay: {
    default: 0, // in milliseconds
    type: "number",
  },
  hpBarColor: {
    type: "string",
    default: "#b71c1c",
  },
  hpBarClickable: {
    type: "boolean",
    default: false,
  },
  uploadKey: {
    type: "string",
    default: "",
  },
};

class AppStore extends EventEmitter {
  public store: Store;
  public static keytarAccount = os.userInfo().username;
  public static keytarApiKeyService =
    "netscape-upload-token" + (isDevelopment ? "-dev" : "");

  constructor() {
    // Extend
    super();

    // Init
    this.store = new Store({
      name: "netscape-nav" + (isDevelopment ? "-dev" : ""),
      schema: storeSchema,
    });
  }

  set(setting: string, value: unknown) {
    this.store.set(setting, value);
    this.emit("change", { setting, value });
  }

  get(setting: string) {
    return this.store.get(setting);
  }

  async setPassword(password: string) {
    try {
      this.store.set("uploadKey", password);

      return true;
    } catch (err) {
      logger.error("Failed to set password", err);
      return false;
    }
  }

  async getPassword() {
    try {
      let pw = this.store.get("uploadKey") as string | null;
      if (!pw || pw === "") {
        pw = await keytar.getPassword(
          AppStore.keytarApiKeyService,
          AppStore.keytarAccount
        );
      }

      return pw;
    } catch (err) {
      logger.error("Failed to get password", err);
      return undefined;
    }
  }

  getAll() {
    return this.store.store;
  }

  delete(setting: string) {
    this.store.delete(setting);
  }
}

export default AppStore;
