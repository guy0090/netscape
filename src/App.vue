<template>
  <v-app :theme="theme">
    <v-system-bar class="ps-1">
      <v-avatar
        class="meter-logo"
        :image="require(`@/assets/sprites/emojis/34.png`)"
      ></v-avatar>
      <span class="draggable">&nbsp;v{{ version }} {{ getBossTitle() }}</span>
      <v-col class="draggable"></v-col>
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
    <v-main class="main-panel" style="padding-bottom: 37px">
      <router-view
        :session="session"
        :compact="compact"
        :sessionDuration="sessionDurationSeconds"
        :pausedFor="pausedFor"
        :isPaused="isPaused"
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
        <v-col hidden cols="auto" class="pe-1 ps-0 py-0 align-self-center">
          <v-btn
            color="blue-darken-3"
            rounded="sm"
            size="x-small"
            icon="mdi-cloud-check-outline"
          ></v-btn>
        </v-col>
        <v-col cols="auto" class="px-0 py-0 align-self-center">
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
        <v-col cols="auto" class="ps-1 pe-0 py-0 align-self-center">
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
import { defineComponent, ref } from "vue";
import { mapActions, useStore } from "vuex";
import VConsole from "vconsole";
import { Entity, ENTITY_TYPE } from "@/encounters/objects";

export default defineComponent({
  name: "App",

  mounted() {
    // if (this.vCons) this.vCons.destroy();
    // this.vCons = new VConsole({ theme: "dark" });
    this.getVersion()
      .then((version) => {
        this.version = version;
      })
      .catch((err: Error) => {
        console.error(err.message);
      });

    this.applySettings();
    this.listenForIpcEvents();
  },

  methods: {
    ...mapActions([
      "getSetting",
      "updateSetting",
      "resetSession",
      "pauseSession",
      "resumeSession",
      "getVersion",
    ]),
    resetSessionButton() {
      this.resetSession();
      this.$router.push({ name: "home" });
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
          console.error(err);
        });

      this.getSetting("compactStyle")
        .then((d: { message: { value: boolean } }) => {
          this.compact = d.message.value;
        })
        .catch((err: Error) => {
          console.error(err);
        });
    },
    listenForIpcEvents() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).ipcBridge.receive("fromMain", (data: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { event, message } = data;
        switch (event) {
          case "vconsole":
            if (this.showConsoleCounter < 3) this.showConsoleCounter++;

            if (!this.vConsoleTimeout) {
              this.vConsoleTimeout = setTimeout(() => {
                this.showConsoleCounter = 0;
                console.log(`VConsole timeout`);
                this.vConsoleTimeout = undefined;
              }, 1000);
            }

            if (this.showConsoleCounter === 3) {
              if (this.vCons) this.vCons.show();
              this.showConsoleCounter = 0;

              clearTimeout(this.vConsoleTimeout);
            }
            break;
          case "new-setting":
            switch (message.setting) {
              case "compactStyle":
                console.log(
                  "Got compact change",
                  this.compact,
                  "=>",
                  message.value
                );
                if (message.value !== this.compact)
                  this.compact = message.value;
                break;
              case "anonymizeMeter":
                console.log(
                  "Got anon change",
                  this.anonymize,
                  "=>",
                  message.value
                );
                if (message.value !== this.anonymize)
                  this.anonymize = message.value;
                break;
            }

            if (
              message.setting === "compactStyle" &&
              message.value !== this.compact
            ) {
              this.compact = message.value;
            }
            break;
          case "session":
            this.session = message;
            if (this.session.paused || this.isPaused) return;
            if (!this.sessionTimer && this.session.firstPacket !== 0)
              this.startSessionTimer();
            else if (this.session.firstPacket === 0 && this.sessionTimer)
              this.stopSessionTimer();
            break;
          case "end-session":
            console.log("Got end session");
            this.stopSessionTimer(false);
            this.isPaused = true;
            break;
          case "pause-session":
            console.log("Got pause session event");
            this.session = message;
            if (this.isPaused) return;
            this.isPaused = true;
            break;
          case "resume-session":
            console.log("Got resume session event");
            this.session = message;
            if (!this.isPaused) return;
            this.isPaused = false;
            break;
          case "reset-session":
            if (this.$route.name !== "settings" && this.$route.name !== "home")
              this.$router.push({ name: "home" });

            console.log("Got reset session event", message);
            this.stopSessionTimer();

            this.session = message;
            this.isPaused = false;
            this.sessionDurationSeconds = 0;
            this.sessionDuration = "00:00";
            this.sessionDamage = "0";
            this.pausedFor = 0;
            break;
        }
      });
    },
    enableCompact() {
      this.updateSetting({ key: "compactStyle", value: true })
        .then(() => {
          this.compact = true;
        })
        .catch((err) => {
          console.error(err);
        });
    },
    disabledCompact() {
      this.updateSetting({ key: "compactStyle", value: false })
        .then(() => {
          this.compact = false;
        })
        .catch((err) => {
          console.error(err);
        });
    },
    getBossEntity() {
      let boss: Entity[];
      if (this.session && this.session?.entities) {
        boss = this.session?.entities.filter(
          (entity: Entity) => [1, 2].includes(entity.type) && entity.maxHp > 0
        );
        boss = boss.sort((a: Entity, b: Entity) => a.lastUpdate - b.lastUpdate);
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
          (entity: Entity) => entity.type === ENTITY_TYPE.PLAYER
        );
        if (playerEntities.length > 0) {
          dps =
            playerEntities.reduce((acc: number, cur: Entity) => {
              return acc + cur.stats.damageDealt;
            }, 0) / durationSeconds;
        }
      }
      const abbr = this.abbrNum(dps, 2);
      return abbr;
    },
    getEntityDPS(entity: Entity) {
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
      console.log("Started monitoring session", this.session);
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
      if (!this.sessionTimer) return;

      clearInterval(this.sessionTimer);

      if (reset) {
        this.sessionTimer = undefined;
        this.isPaused = false;
        this.sessionDurationSeconds = 0;
        this.sessionDuration = "00:00";
        this.sessionDamage = "0";
        this.sessionDps = "0";
        this.pausedFor = 0;
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
          (entity: Entity) => [1, 2].includes(entity.type) && entity.maxHp > 0
        );

        if (bossEntities.length > 0) {
          const mostRecentBoss: Entity = bossEntities.sort(
            (a: Entity, b: Entity) => b.lastUpdate - a.lastUpdate
          )[0];

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
        this.$router.go(-1);
      } else {
        this.$router.push({ name: "settings" });
      }
    },
  },

  setup() {
    let theme = ref("dark");
    let store = useStore();
    let showConsoleCounter = ref(0);
    let compact = ref(false);
    let isPaused = ref(false);
    let anonymize = ref(false);
    let sessionDurationSeconds = ref(0);
    let sessionDuration = ref("00:00");
    let sessionDamage = ref("0");
    let sessionTimer = ref();
    let sessionDps = ref("0");
    let pausedFor = ref(0);
    let session = ref({} as any);
    let version = ref("0.0.1");

    return {
      showConsoleCounter,
      theme,
      store,
      compact,
      isPaused,
      anonymize,
      sessionDurationSeconds,
      sessionDuration,
      sessionDamage,
      sessionTimer,
      sessionDps,
      pausedFor,
      session,
      version,
    };
  },

  data() {
    let vConsoleTimeout: ReturnType<typeof setTimeout> | undefined;
    let vCons: VConsole | undefined;
    return {
      vConsoleTimeout,
      vCons,
    };
  },
});
</script>

<style>
html {
  overflow: auto !important;
}

.v-system-var {
  user-select: none !important;
}

.draggable,
.draggable > * {
  -webkit-app-region: drag;
}

.settings-icon {
  cursor: pointer;
}

.meter-logo {
  width: 20px !important;
  height: 20px !important;
  -webkit-app-region: drag;
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
