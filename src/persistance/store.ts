import { EventEmitter } from "events";
import Store, { Schema } from "electron-store";
import os from "os";
import keytar from "keytar";

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
  minifyDirection: {
    default: 0, // 0 = Down, 1 = Up
    type: "number",
  },
  minifyDelay: {
    default: 0, // in milliseconds
    type: "number",
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

  static async setPassword(
    password: string,
    service = this.keytarApiKeyService,
    account = this.keytarAccount
  ) {
    try {
      if (password) await keytar.setPassword(service, account, password);
      else await keytar.deletePassword(service, account);

      return true;
    } catch {
      console.error("Failed to set password");
      return false;
    }
  }

  static async getPassword(
    service = this.keytarApiKeyService,
    account = this.keytarAccount
  ) {
    try {
      const pw = await keytar.getPassword(service, account);
      return pw;
    } catch {
      console.error("Failed to get password");
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
