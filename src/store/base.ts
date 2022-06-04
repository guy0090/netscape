import { settings } from "./modules/settings.module";
import { sessions } from "./modules/sessions.module";

import { createStore } from "vuex";

export default createStore({
  getters: {},
  mutations: {},
  actions: {
    async getVersion(context) {
      try {
        const response = await (window as any).ipcBridge.invoke("toMain", {
          message: "version",
        });

        return response.message;
      } catch {
        return "0.0.0";
      }
    },
  },
  modules: { settings, sessions },
});
