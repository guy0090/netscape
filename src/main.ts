import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import App from "./App.vue";
import router from "./router";
import store from "./store/base";
import vuetify from "./plugins/vuetify";
import { loadFonts } from "./plugins/webfontloader";

import en from "@/i18n/en";
const i18n = createI18n({
  locale: "en",
  fallbackLocale: "en",
  messages: {
    en,
  },
});

loadFonts();

createApp(App).use(i18n).use(router).use(store).use(vuetify).mount("#app");
