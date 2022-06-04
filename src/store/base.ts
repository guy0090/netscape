import { settings } from "./modules/settings.module";
import { sessions } from "./modules/sessions.module";

import { createStore } from "vuex";

export default createStore({
  getters: {},
  mutations: {},
  actions: {},
  modules: { settings, sessions },
});
