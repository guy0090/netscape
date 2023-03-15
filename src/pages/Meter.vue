<template>
  <v-app :theme="theme">
    <v-system-bar class="ps-1">
      <v-avatar
        class="meter-logo"
        :image="require(`@/assets/sprites/emojis/28.avif`)"
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
      } overflow-x: auto;`"
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
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from "vue";
import { mapActions, useStore } from "vuex";
import {
  DamageStatistics,
  SimpleEntity,
  SimpleSession,
} from "@/encounters/objects";
import { EntityType } from "@/bridge/log-lines";

export default defineComponent({
  name: "App",

  mounted() {
    this.getVersion()
      .then((version) => {
        this.version = version;
      })
      .catch((err: Error) => {
        this.error(err.message);
      });

    this.applySettings();
    this.listenForIpcEvents();
  },

  methods: {
    ...mapActions([
      "getSetting",
      "updateSetting",
      "setModifyHpBar",
      "resetSession",
      "pauseSession",
      "resumeSession",
      "getVersion",
      "getApiKey",
      "debug",
      "error",
    ]),
    resetSessionButton() {
      this.resetSession();
      this.$router.push({ name: "session" });
    },
    applySettings() {
      let htmlFrame = document.getElementsByTagName("html")[0];

      this.getSetting("opacity")
        .then((d: { message: { value: string } }) => {
          let opacity = d.message.value;
          try {
            parseFloat(d.message.value);
          } catch {
            opacity = "0.9";
          }

          htmlFrame.style.opacity = opacity;
        })
        .catch((err: Error) => {
          htmlFrame.style.opacity = "0.9";
          this.error(err);
        });

      this.getSetting("compactStyle")
        .then((d: { message: { value: boolean } }) => {
          this.compact = d.message.value;
        })
        .catch((err: Error) => {
          this.error(err);
        });

      this.getSetting("showUploadButton")
        .then((d: { message: { value: boolean } }) => {
          this.showUploadButton = d.message.value;
        })
        .catch((err: Error) => {
          this.error(err);
        });

      this.getSetting("uploadLogs")
        .then((d: { message: { value: boolean } }) => {
          this.uploadLogs = d.message.value;
        })
        .catch((err: Error) => {
          this.error(err);
        });

      this.getSetting("minifyDelay")
        .then((d: { message: { value: number } }) => {
          this.minifyDelay = d.message.value;
          if (this.minifyDelay > 0) {
            this.debug("Starting minify timer with delay: " + this.minifyDelay);
            this.stopMinifyTimer();
            this.startMinifyTimer();
          }
        })
        .catch((err: Error) => {
          this.error(err);
        });
    },
    listenForIpcEvents() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).ipcBridge.receive("fromMain", (data: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { event, message } = data;
        switch (event) {
          case "new-setting":
            switch (message.setting) {
              case "compactStyle":
                this.debug(
                  "Got compact change",
                  this.compact,
                  "=>",
                  message.value
                );
                if (message.value !== this.compact)
                  this.compact = message.value;
                break;
              case "anonymizeMeter":
                this.debug(
                  "Got anon change",
                  this.anonymize,
                  "=>",
                  message.value
                );
                if (message.value !== this.anonymize)
                  this.anonymize = message.value;
                break;
              case "showUploadButton":
                this.debug(
                  "Got showUploadButton change",
                  this.showUploadButton,
                  "=>",
                  message.value
                );
                if (message.value !== this.showUploadButton)
                  this.showUploadButton = message.value;
                break;
              case "uploadLogs":
                this.debug(
                  "Got upload change",
                  this.uploadLogs,
                  "=>",
                  message.value
                );
                if (message.value !== this.uploadLogs)
                  this.uploadLogs = message.value;
                break;
              case "minifyDelay":
                if (message.value !== this.minifyDelay) {
                  this.debug("Updating minify delay");
                  this.minifyDelay = message.value;
                  if (message.value === 0) {
                    this.debug("New delay is 0, stopping timer");
                    this.stopMinifyTimer();
                  } else {
                    this.debug("New delay is not 0, (re)starting timer");
                    this.stopMinifyTimer();
                    this.startMinifyTimer();
                  }
                }
            }
            break;
          case "session":
            if (!this.session.live) {
              this.clearSession();
              this.$router.push({ name: "session" });
            }

            this.updateSession(message);

            if (this.session.paused || this.isPaused) return;
            if (!this.sessionTimer && this.session.firstPacket !== 0) {
              this.startSessionTimer();
              if (this.minified) this.handleMiniToggle();
            } else if (this.session.firstPacket === 0 && this.sessionTimer) {
              this.stopSessionTimer();
            }
            break;
          case "end-session":
            this.debug("Got end session");
            this.stopSessionTimer(false);
            this.isPaused = true;

            if (!this.minified) {
              this.stopMinifyTimer();
              if (!message.protocol) this.startMinifyTimer();
            }

            if (!message.live) {
              this.updateSession(message);
              this.sessionDurationSeconds =
                (message.lastPacket - message.firstPacket) / 1000;
              this.sessionDuration = this.getSessionDuration();
            }
            break;
          case "pause-session":
            this.debug("Got pause session event");
            this.updateSession(message);
            if (this.isPaused) return;
            this.isPaused = true;
            break;
          case "resume-session":
            this.debug("Got resume session event");
            this.updateSession(message);
            if (!this.isPaused) return;
            this.isPaused = false;
            break;
          case "reset-session":
            break;
          case "zone-change":
            this.debug("Got zone change, trying to start minify timer");
            if (
              this.minifyDelay > 0 &&
              this.minifyTimer === undefined &&
              !this.minified
            ) {
              this.debug(
                "Starting minify timer with delay: " + this.minifyDelay
              );
              this.stopMinifyTimer();
              this.startMinifyTimer();
            }
            break;
        }
      });
    },
    updateSession(session: SimpleSession) {
      this.session.paused = session.paused;
      this.session.live = session.live;
      this.session.firstPacket = session.firstPacket;
      this.session.lastPacket = session.lastPacket;
      this.session.entities = session.entities;
      this.session.damageStatistics = session.damageStatistics;
    },
    clearSession() {
      this.stopSessionTimer();

      this.session.paused = false;
      this.session.live = true;
      this.session.firstPacket = 0;
      this.session.lastPacket = 0;
      this.session.entities = [];
      this.session.damageStatistics = {} as DamageStatistics;
    },
    enableCompact() {
      this.updateSetting({ key: "compactStyle", value: true })
        .then(() => {
          this.compact = true;
        })
        .catch((err) => {
          this.error(err);
        });
    },
    disabledCompact() {
      this.updateSetting({ key: "compactStyle", value: false })
        .then(() => {
          this.compact = false;
        })
        .catch((err) => {
          this.error(err);
        });
    },
    enableUploads() {
      this.getApiKey()
        .then((d: { message: { value: string } }) => {
          const key = d.message.value;

          if (key && key.length === 32) {
            this.updateSetting({ key: "uploadLogs", value: true })
              .then(() => {
                this.uploadLogs = true;
              })
              .catch((err) => {
                this.error(err);
              });
          } else {
            this.uploadLogs = false;
          }
        })
        .catch((err) => {
          this.error(err);
        });
    },
    disableUploads() {
      this.updateSetting({ key: "uploadLogs", value: false })
        .then(() => {
          this.uploadLogs = false;
        })
        .catch((err) => {
          this.error(err);
        });
    },
    getBossEntity() {
      let boss: SimpleEntity[];
      if (this.session && this.session?.entities) {
        boss = this.session?.entities.filter(
          (entity) => [1, 2].includes(entity.type) && entity.maxHp > 0
        );
        boss = boss.sort(
          (a: SimpleEntity, b: SimpleEntity) => a.lastUpdate - b.lastUpdate
        );
        if (boss.length > 0) return boss[0];
      }
      return undefined;
    },
    getSessionDuration() {
      if (!this.session || this.session.firstPacket === 0) return "00:00";
      let hours = 0;
      let minutes = 0;
      let seconds = 0;

      let durationSeconds = this.sessionDurationSeconds;
      seconds = Math.floor(durationSeconds % 60);
      minutes = Math.floor(durationSeconds / 60) % 60;
      hours = Math.floor(durationSeconds / 3600);

      return `${hours > 0 ? hours + ":" : ""}${
        minutes < 10 ? "0" + minutes : minutes
      }:${seconds < 10 ? "0" + seconds : seconds}`;
    },
    getSessionDPS() {
      if (!this.session || this.session.firstPacket === 0) return "0";
      let dps = 0;
      let durationSeconds = this.sessionDurationSeconds;
      if (durationSeconds > 0 && this.session.entities.length > 0) {
        const playerEntities = this.session.entities.filter(
          (entity) => entity.type === EntityType.PLAYER
        );
        if (playerEntities.length > 0) {
          dps =
            playerEntities.reduce((acc: number, cur) => {
              return acc + cur.stats.damageDealt;
            }, 0) / durationSeconds;
        }
      }
      const abbr = this.abbrNum(dps, 2);
      return abbr;
    },
    getEntityDPS(entity: SimpleEntity) {
      const damageDealt = entity.stats.damageDealt;
      let duration = this.sessionDurationSeconds;
      if (this.pausedFor && this.pausedFor > 0) duration -= this.pausedFor;

      if (damageDealt && duration) {
        const dps = damageDealt / duration;
        return dps;
      } else {
        return 0;
      }
    },
    startSessionTimer() {
      this.debug("Started monitoring session");
      if (this.sessionTimer) return;

      this.sessionTimer = setInterval(() => {
        if (this.session && this.session.firstPacket > 0 && !this.isPaused) {
          this.sessionDurationSeconds =
            (+new Date() - this.session.firstPacket) / 1000;
          this.sessionDuration = this.getSessionDuration();
        } else if (this.isPaused) {
          this.pausedFor += 1;
        }
      }, 1000);
    },
    stopSessionTimer(reset = true) {
      clearInterval(this.sessionTimer);

      if (reset) {
        this.sessionTimer = undefined;
        this.isPaused = false;
        this.sessionDurationSeconds = 0;
        this.sessionDuration = "00:00";
        this.sessionDps = "0";
        this.pausedFor = 0;
      }
    },
    startMinifyTimer() {
      if (this.minifyDelay > 0 && this.minifyTimer === undefined) {
        this.debug("Started minify timer");
        this.minifyTimer = setTimeout(() => {
          if (!this.minified) {
            if (
              this.$route.name === "settings" ||
              this.$route.name === "breakdown"
            ) {
              this.debug("Restarting auto minify timer: In settings route");
              this.stopMinifyTimer();
              this.startMinifyTimer();
            } else if (!this.session.live || this.session.firstPacket === 0) {
              this.debug("Auto minifying: reached set delay");
              this.stopMinifyTimer();
              this.handleMiniToggle();
            }
          } else {
            this.debug("Skipping auto minify: already minified");
            this.stopMinifyTimer();
          }
        }, this.minifyDelay);
      }
    },
    stopMinifyTimer() {
      if (this.minifyTimer !== undefined) {
        clearTimeout(this.minifyTimer);
        this.minifyTimer = undefined;
      }
    },
    getBossTitle() {
      if (
        !this.session ||
        !this.session?.entities ||
        this.session?.entities?.length < 1
      ) {
        return "";
      } else {
        const bossEntities = this.session?.entities?.filter(
          (entity) => [1, 2].includes(entity.type) && entity.maxHp > 0
        );

        if (bossEntities.length > 0) {
          bossEntities.sort((a, b) => b.lastUpdate - a.lastUpdate);
          const mostRecentBoss = bossEntities[0];

          return `| ${mostRecentBoss.name}`;
        } else {
          return "";
        }
      }
    },
    abbrNum(number: number, decPlaces: number) {
      // 2 decimal places => 100, 3 => 1000, etc
      decPlaces = Math.pow(10, decPlaces);

      let abbreviated = "0";
      // Enumerate number abbreviations
      const abbrev = ["k", "m", "b", "t"];

      // Go through the array backwards, so we do the largest first
      for (let i = abbrev.length - 1; i >= 0; i--) {
        // Convert array index to "1000", "1000000", etc
        const size = Math.pow(10, (i + 1) * 3);

        // If the number is bigger or equal do the abbreviation
        if (size <= number) {
          // Here, we multiply by decPlaces, round, and then divide by decPlaces.
          // This gives us nice rounding to a particular decimal place.
          number = Math.round((number * decPlaces) / size) / decPlaces;

          // Handle special case where we round up to the next abbreviation
          if (number == 1000 && i < abbrev.length - 1) {
            number = 1;
            i++;
          }

          // Add the letter for the abbreviation
          abbreviated = number + abbrev[i];

          // We are done... stop
          break;
        }
      }

      return abbreviated;
    },
    handleSettingsClick() {
      if (this.$route.name === "settings") {
        this.getSetting("hpBarClickable")
          .then((d: { message: { value: boolean } }) => {
            if (d.message.value) this.setModifyHpBar(false);
          })
          .catch((err: Error) => {
            this.error(err);
          });
        this.$router.go(-1);
      } else {
        if (this.minified) this.handleMiniToggle();
        this.$router.push({ name: "settings" });
      }
    },
    handleMiniToggle(click = false) {
      this.minified = !this.minified;

      if (
        !click &&
        !this.minified &&
        this.minifyDelay > 0 &&
        (!this.session.live || this.session.firstPacket === 0)
      ) {
        this.stopMinifyTimer();
        this.startMinifyTimer();
      }

      (window as any).ipcBridge.invoke("toMain", {
        message: "toggle-mini",
        mini: this.minified,
      });
      return;
    },
  },

  setup() {
    let theme = ref("dark");
    let store = useStore();
    let showConsoleCounter = ref(0);
    let compact = ref(false);
    let showUploadButton = ref(false);
    let uploadLogs = ref(false);
    let isPaused = ref(false);
    let anonymize = ref(false);
    let sessionDurationSeconds = ref(0);
    let sessionDuration = ref("00:00");
    let sessionTimer = ref();
    let sessionDps = ref("0");
    let pausedFor = ref(0);
    let session = reactive({
      paused: false,
      live: false,
      fromHistory: false,
      firstPacket: 0,
      lastPacket: 0,
      entities: [],
      damageStatistics: {} as DamageStatistics,
    } as SimpleSession);
    let version = ref("0.0.1");
    let minified = ref(false);
    let minifyDelay = ref(0);
    let minifyTimer = ref({} as undefined | ReturnType<typeof setTimeout>);

    return {
      showConsoleCounter,
      theme,
      store,
      compact,
      showUploadButton,
      uploadLogs,
      isPaused,
      anonymize,
      sessionDurationSeconds,
      sessionDuration,
      sessionTimer,
      sessionDps,
      pausedFor,
      session,
      version,
      minified,
      minifyDelay,
      minifyTimer,
    };
  },
});
</script>

<style>
.settings-icon {
  cursor: pointer;
}

.meter-logo > div > img {
  width: 20px !important;
  height: 20px !important;
  -webkit-app-region: drag;
}

.footer-panel {
  position: fixed;
  max-height: 37px;
  z-index: 9999;
  min-height: 37px;
  width: 100%;
  bottom: 0;
}

.vc-switch {
  display: none !important;
}

::-webkit-scrollbar {
  background-color: #202324;
  color: #aba499;
  width: 5px;
}

::-webkit-scrollbar-corner {
  background-color: #181a1b;
}

::-webkit-scrollbar-thumb {
  background-color: #454a4d;
}
</style>
