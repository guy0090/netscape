import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";

// Pages
import Meter from "@/pages/Meter.vue";
import HPBar from "@/pages/HPBar.vue";

import SessionView from "@/views/SessionView.vue";
import BreakdownView from "@/views/BreakdownView.vue";
import SettingsView from "@/views/SettingsView.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/meter",
  },
  {
    path: "/meter",
    name: "meter",
    component: Meter,
    children: [
      {
        path: "",
        name: "session",
        component: SessionView,
      },
      {
        path: "breakdown/:entityId",
        name: "breakdown",
        component: BreakdownView,
      },
      {
        path: "settings",
        name: "settings",
        component: SettingsView,
      },
    ],
  },
  {
    path: "/hpbar",
    name: "hpbar",
    component: HPBar,
  },
];

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes,
});

export default router;
