import { Module } from "vuex";

/**
 * Module containing session actions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sessions: Module<any, any> = {
  actions: {
    async resetSession(context, force) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (window as any).ipcBridge.invoke("toMain", {
          message: "reset-session",
          force: force,
        });
        return;
      } catch (err) {
        return err;
      }
    },
    async pauseSession() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (window as any).ipcBridge.invoke("toMain", {
          message: "pause-session",
        });
        return;
      } catch (err) {
        return err;
      }
    },
    async resumeSession() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (window as any).ipcBridge.invoke("toMain", {
          message: "resume-session",
        });
        return;
      } catch (err) {
        return err;
      }
    },
  },
};
