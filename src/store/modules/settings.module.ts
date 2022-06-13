import { Module } from "vuex";

/**
 * Module containing application settings.
 */
export const settings: Module<any, any> = {
  state: () => ({
    opacity: 0.9,
    compactStyle: false,
    anonymizeMeter: false,
  }),
  mutations: {
    setOpacity(state, opacity) {
      state.opacity = opacity;
    },
    setCompactStyle(state, compactStyle) {
      state.compactStyle = compactStyle;
    },
    setAnonymizeMeter(state, anonymizeMeter) {
      state.anonymizeMeter = anonymizeMeter;
    },
  },
  actions: {
    async setOpacity({ commit, dispatch }, opacity) {
      if (!opacity) return;
      try {
        await dispatch("updateSetting", {
          key: "opacity",
          value: opacity,
        });
        commit("setOpacity", opacity);
        return;
      } catch (err) {
        console.error(err);
        return err;
      }
    },
    async setCompactStyle({ commit, dispatch }, compactStyle) {
      await dispatch("updateSetting", {
        key: "compactStyle",
        value: compactStyle,
      });
      commit("setCompactStyle", compactStyle);
    },
    async setAnonymizeMeter({ commit, dispatch }, anonymizeMeter) {
      await dispatch("updateSetting", {
        key: "anonymizeMeter",
        value: anonymizeMeter,
      });
      commit("setAnonymizeMeter", anonymizeMeter);
    },
    async updateSetting(context, { key, value }) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (window as any).ipcBridge.invoke("toMain", {
          message: "set-setting",
          setting: key,
          value: value,
        });
        return;
      } catch (err) {
        return err;
      }
    },
    async getSetting(_context, setting) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const val = await (window as any).ipcBridge.invoke("toMain", {
          message: "get-setting",
          setting: setting,
        });
        return val;
      } catch (err) {
        console.error(err);
        return err;
      }
    },
    async getApiKey() {
      try {
        const val = await (window as any).ipcBridge.invoke("toMain", {
          message: "get-api-key",
        });
        return val;
      } catch (err) {
        console.error(err);
        return err;
      }
    },
    async setApiKey(context, apiKey) {
      try {
        await (window as any).ipcBridge.invoke("toMain", {
          message: "set-api-key",
          value: apiKey,
        });
        return;
      } catch (err) {
        return err;
      }
    },
  },
};
