import Store, { Schema } from "electron-store";
import { EventEmitter } from "events";

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
      heigth: 614,
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
    default: false,
  },
};

class AppStore extends EventEmitter {
  public store: Store;

  constructor() {
    // Extend
    super();

    // Init
    this.store = new Store({
      name: "lost-ark-damage-meter",
      schema: storeSchema,
    });
  }

  set(setting: string, value: any) {
    this.store.set(setting, value);
    this.emit("change", { setting, value });
  }

  get(setting: string) {
    return this.store.get(setting);
  }

  getAll() {
    return this.store.store;
  }

  delete(setting: string) {
    this.store.delete(setting);
  }
}

export default AppStore;
