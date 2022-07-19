<template>
  <router-view></router-view>
  <!--
  <v-app :theme="theme">
    <v-system-bar class="ps-1">
      <v-avatar
        class="meter-logo"
        :image="require(`@/assets/sprites/emojis/28.webp`)"
      ></v-avatar>
      <span class="draggable">&nbsp;v{{ version }} {{ getBossTitle() }}</span>
      <v-col class="draggable"></v-col>
      <v-icon
        :icon="minified ? 'mdi-plus' : 'mdi-minus'"
        @click="handleMiniToggle(true)"
      ></v-icon>
      <v-icon
        v-if="!compact"
        class="settings-icon me-1"
        icon="mdi-view-compact-outline"
        @click="enableCompact()"
      ></v-icon>
      <v-icon
        v-else
        class="settings-icon me-1"
        icon="mdi-view-compact"
        @click="disabledCompact()"
      ></v-icon>
      <v-icon
        class="settings-icon"
        icon="mdi-cog"
        @click="handleSettingsClick"
      ></v-icon>
    </v-system-bar>
    <v-main
      class="main-panel"
      :style="`padding-bottom: 37px; ${
        minified ? 'display: none !important;' : ''
      }`"
    >
      <router-view
        :compact="compact"
        :session="session"
        :sessionDuration="sessionDurationSeconds"
        :isPaused="isPaused"
        :pausedFor="pausedFor"
      />
    </v-main>
    <v-footer class="py-0 footer-panel">
      <v-row>
        <v-col cols="auto" class="align-self-center ps-0 pe-2 py-0">
          <span>
            <v-icon size="sm" icon="mdi-timer-outline"></v-icon>
            {{ sessionDuration }}
          </span>
        </v-col>
        <v-divider vertical class="me-2"></v-divider>
        <v-col cols="auto">
          <v-row class="pb-2">
            <small
              >Total Damage:
              {{
                abbrNum(session.damageStatistics?.totalDamageDealt, 1)
              }}</small
            >
          </v-row>
          <v-row>
            <small>Party DPS: {{ getSessionDPS() }}/s</small>
          </v-row>
        </v-col>
        <v-divider vertical class="ms-2"></v-divider>
        <v-spacer></v-spacer>
        <v-col
          v-if="showUploadButton"
          cols="auto"
          class="pe-1 ps-0 py-0 align-self-center"
        >
          <v-btn
            v-if="uploadLogs"
            color="blue-darken-3"
            rounded="sm"
            size="x-small"
            icon="mdi-cloud-check-outline"
            @click="disableUploads()"
          ></v-btn>
          <v-btn
            v-else
            color="orange"
            rounded="sm"
            size="x-small"
            icon="mdi-cloud-off-outline"
            @click="enableUploads()"
          ></v-btn>
        </v-col>
        <v-col
          v-if="session.live"
          cols="auto"
          class="px-0 py-0 align-self-center"
        >
          <v-btn
            v-if="!isPaused"
            color="red-darken-3"
            rounded="sm"
            size="x-small"
            icon="mdi-pause"
            @click="pauseSession()"
          ></v-btn>
          <v-btn
            v-else
            color="green-darken-3"
            rounded="sm"
            size="x-small"
            icon="mdi-play"
            @click="resumeSession()"
          ></v-btn>
        </v-col>
        <v-col
          cols="auto"
          :class="`${
            session.live ? 'ps-1' : 'ps-0'
          } pe-0 py-0 align-self-center`"
        >
          <v-btn
            color="grey-darken-3"
            rounded="sm"
            size="x-small"
            icon="mdi-refresh"
            @click="resetSessionButton()"
          ></v-btn>
        </v-col>
      </v-row>
    </v-footer>
  </v-app>
   -->
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "App",
});
</script>

<style>
html {
  overflow: auto !important;
}

.v-system-bar {
  user-select: none !important;
}

.draggable,
.draggable > * {
  -webkit-app-region: drag;
}

.meter-logo {
  width: 20px !important;
  height: 20px !important;
  -webkit-app-region: drag;
}
</style>
