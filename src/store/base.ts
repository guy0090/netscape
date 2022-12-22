import { settings } from "./modules/settings.module";
import { sessions } from "./modules/sessions.module";
import { util } from "./modules/util.module";

import { createStore } from "vuex";

const isDevelopment = process.env.NODE_ENV !== "production";

export default createStore({
  modules: { settings, sessions, util },
  getters: {},
  mutations: {},
  actions: {
    async getVersion() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await (window as any).ipcBridge.invoke("toMain", {
          message: "version",
        });

        return response.message;
      } catch {
        return "0.0.0";
      }
    },
    openUrl(_context, url) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).ipcBridge.invoke("toMain", {
          message: "open-url",
          url,
        });
        return;
      } catch (err) {
        console.error(err);
        return err;
      }
    },
    debug(_context, ...args) {
      if (isDevelopment) console.log(...args);
    },
    error(_context, ...args) {
      console.error(...args);
    },
  },
});
