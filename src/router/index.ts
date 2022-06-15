import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import SessionView from "@/views/SessionView.vue";
import BreakdownPage from "@/views/BreakdownView.vue";
import SettingsPage from "@/views/SettingsView.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "session",
    component: SessionView,
  },
  {
    path: "/breakdown/:entityId",
    name: "breakdown",
    component: BreakdownPage,
  },
  {
    path: "/settings",
    name: "settings",
    component: SettingsPage,
  },
];

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes,
});

export default router;
