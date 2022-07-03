<template style="height: 100">
  <v-container>
    <v-row class="mb-2 mt-1"> <h3>General Settings</h3> </v-row>
    <v-row class="mb-8"
      ><small>These settings modify the functionality of the app</small></v-row
    >
    <v-row>
      <v-col cols="auto" class="pb-0">
        <v-row class="mb-2"
          ><v-icon icon="mdi-wifi-arrow-left"></v-icon>&nbsp;Npcap</v-row
        >
        <v-row class="mb-3"
          ><small
            >Toggle between using Npcap. May help if packets aren't being
            detected.</small
          ></v-row
        >
      </v-col>
      <v-spacer></v-spacer>
      <v-col class="mb-0 pb-0 pt-0 mt-0" cols="auto">
        <v-switch
          v-model="useNpcap"
          :label="useNpcap ? 'Npcap' : 'Raw Sockets'"
          color="green-accent-4"
          hide-details
          @change="handleUseNpcapChange"
        ></v-switch>
      </v-col>
    </v-row>
    <v-row hidden class="mt-5">
      <v-col cols="auto" class="pb-0">
        <v-row class="mb-2"
          ><v-icon icon="mdi-refresh"></v-icon>&nbsp;Reset on Zone Change
        </v-row>
        <v-row class="mb-3"
          ><small
            >Automatically resets the meter if you exit or enter a loading
            screen.</small
          ></v-row
        >
      </v-col>
      <v-spacer></v-spacer>
      <v-col class="mb-0 pb-0 pt-0 mt-0" cols="auto">
        <v-switch
          v-model="resetOnZoneChange"
          :label="resetOnZoneChange ? 'Reset' : 'Don\'t Reset'"
          color="green-accent-4"
          hide-details
          @change="handleResetOnZoneChange"
        ></v-switch>
      </v-col>
    </v-row>
    <v-row class="mt-5">
      <v-col cols="auto" class="pb-0">
        <v-row class="mb-2">
          <v-icon icon="mdi-dock-window"></v-icon>&nbsp;Window Mode
        </v-row>
        <v-row class="mb-3">
          <small
            >Toggles between overlay mode or always-on-top mode (requires app
            restart)</small
          >
        </v-row>
      </v-col>
      <v-spacer></v-spacer>
      <v-col class="mb-0 pb-0 pt-0 mt-0" cols="auto">
        <v-switch
          v-model="windowMode"
          :label="windowMode ? 'Overlay' : 'On Top'"
          color="green-accent-4"
          hide-details
          @change="handleWindowModeChange"
        ></v-switch>
      </v-col>
    </v-row>
    <v-row class="mt-5">
      <v-col cols="auto" class="pb-0">
        <v-row class="mb-2"
          ><v-icon icon="mdi-incognito"></v-icon>&nbsp;Anonymize Player Names
        </v-row>
        <v-row class="mb-3"
          ><small
            >Toggle between showing player names or class names.</small
          ></v-row
        >
      </v-col>
      <v-spacer></v-spacer>
      <v-col class="mb-0 pb-0 pt-0 mt-0" cols="auto">
        <v-switch
          v-model="anonymizeMeter"
          :label="anonymizeMeter ? 'Class Names' : 'Player Names'"
          color="green-accent-4"
          hide-details
          @change="handleAnonymizeChange"
        ></v-switch>
      </v-col>
    </v-row>
    <v-row class="mt-5">
      <v-col cols="auto" class="pb-0">
        <v-row class="mb-2"
          ><v-icon icon="mdi-filter-outline"></v-icon>&nbsp;Remove Overkill
          Damage
        </v-row>
        <v-row class="mb-3"
          ><small
            >Toggle between removing damage that would do more than the boss has
            remaining HP.</small
          ></v-row
        >
      </v-col>
      <v-spacer></v-spacer>
      <v-col class="mb-0 pb-0 pt-0 mt-0" cols="auto">
        <v-switch
          v-model="removeOverkillDamage"
          :label="removeOverkillDamage ? 'Remove' : 'Keep'"
          color="green-accent-4"
          hide-details
          @change="handleRemoveOverkillDamage"
        ></v-switch>
      </v-col>
    </v-row>
    <v-row class="mt-5">
      <v-col cols="auto" class="pb-0">
        <v-row class="mb-2"
          ><v-icon
            :icon="minifyDirection === 0 ? 'mdi-arrow-down' : 'mdi-arrow-up'"
          ></v-icon
          >&nbsp;Minify Direction
        </v-row>
        <v-row class="mb-3"
          ><small>Sets the collapse direction when minifying.</small></v-row
        >
      </v-col>
      <v-spacer></v-spacer>
      <v-col cols="auto" class="pt-0 pb-0">
        <v-switch
          v-model="minifyDirection"
          :label="minifyDirection === 0 ? 'Down' : 'Up'"
          :false-value="0"
          :true-value="1"
          color="green-accent-4"
          hide-details
          @change="handleMinifyDirectionChange"
        ></v-switch>
      </v-col>
    </v-row>
    <v-row class="mt-5">
      <v-col cols="8" class="pb-0">
        <v-row class="mb-2"
          ><v-icon icon="mdi-minus"></v-icon>&nbsp;Auto Minify&nbsp;
          <small
            :class="`px-1 align-self-center ${
              !toMs(minifyDelay) || minifyDelay === ''
                ? 'bg-red-darken-3'
                : 'bg-green-darken-3'
            }`"
            >{{
              !toMs(minifyDelay) || minifyDelay === "" ? "INACTIVE" : "ACTIVE"
            }}</small
          >
        </v-row>
        <v-row class="mb-3"
          ><small
            >If set the meter will automatically minify after the specified time
            if no session is active. Disabled if no value is set.</small
          ></v-row
        >
      </v-col>
      <v-col class="pt-0">
        <v-text-field
          v-model="minifyDelay"
          label="Delay"
          variant="outlined"
          hint="Must be a number (ms) or abbreviated time format (e.g. 30s, 1min, 1hr, etc.)"
          clearable
          clear-icon="mdi-delete"
          type="text"
          @update:model-value="handleMinifyDelayChange"
        >
        </v-text-field>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { mapActions } from "vuex";
import ms from "ms";

export default defineComponent({
  name: "GeneralSettings",

  setup() {
    let useNpcap = ref(false);
    let pauseOnPhaseTransition = ref(true);
    let resetOnZoneChange = ref(true);
    let windowMode = ref(false); // False = Window | True = Overlay
    let anonymizeMeter = ref(false);
    let removeOverkillDamage = ref(true);
    let minifyDelay = ref("");
    let minifyDirection = ref(0);

    return {
      useNpcap,
      pauseOnPhaseTransition,
      resetOnZoneChange,
      windowMode,
      anonymizeMeter,
      removeOverkillDamage,
      minifyDelay,
      minifyDirection,
    };
  },

  mounted() {
    this.applySettings();
    this.listenForChanges();
  },

  methods: {
    ...mapActions(["updateSetting", "getSetting", "debug", "error"]),
    toMs(input: string) {
      try {
        return ms(input);
      } catch {
        return undefined;
      }
    },
    applySettings() {
      this.getSetting("useWinpcap")
        .then((d: { message: { value: boolean } }) => {
          this.useNpcap = d.message.value;
        })
        .catch((err: Error) => {
          this.error(err);
        });

      this.getSetting("pauseOnPhaseTransition")
        .then((d: { message: { value: boolean } }) => {
          this.pauseOnPhaseTransition = d.message.value;
        })
        .catch((err: Error) => {
          this.error(err);
        });

      this.getSetting("resetOnZoneChange")
        .then((d: { message: { value: boolean } }) => {
          this.resetOnZoneChange = d.message.value;
        })
        .catch((err: Error) => {
          this.error(err);
        });

      this.getSetting("windowMode")
        .then((d: { message: { value: number } }) => {
          this.windowMode = d.message.value === 0 ? false : true;
        })
        .catch((err: Error) => {
          this.error(err);
        });

      this.getSetting("anonymizeMeter")
        .then((d: { message: { value: boolean } }) => {
          this.anonymizeMeter = d.message.value;
        })
        .catch((err: Error) => {
          this.error(err);
        });

      this.getSetting("removeOverkillDamage")
        .then((d: { message: { value: boolean } }) => {
          this.removeOverkillDamage = d.message.value;
        })
        .catch((err: Error) => {
          this.error(err);
        });

      this.getSetting("minifyDirection")
        .then((d: { message: { value: number } }) => {
          this.minifyDirection = d.message.value;
        })
        .catch((err: Error) => {
          this.error(err);
        });

      this.getSetting("minifyDelay")
        .then((d: { message: { value: number } }) => {
          this.minifyDelay =
            d.message.value === 0 ? "" : ms(d.message.value, { long: false });
        })
        .catch((err: Error) => {
          this.error(err);
        });
    },
    listenForChanges() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).ipcBridge.receive("fromMain", (data: any) => {
        const { event, message } = data;
        if (event === "new-setting") {
          const { setting, value } = message;
          switch (setting) {
            case "pauseOnPhaseTransition":
              this.pauseOnPhaseTransition = value;
              break;
            case "resetOnZoneChange":
              this.resetOnZoneChange = value;
              break;
            case "windowMode":
              this.windowMode = value === 0 ? false : true;
              break;
            case "anonymizeMeter":
              this.anonymizeMeter = value;
              break;
            case "removeOverkillDamage":
              this.removeOverkillDamage = value;
              break;
            default:
              break;
          }
        }
      });
    },
    handleUseNpcapChange() {
      this.updateSetting({
        key: "useWinpcap",
        value: this.useNpcap,
      });
    },
    handlePauseOnPhaseTransition() {
      this.updateSetting({
        key: "pauseOnPhaseTransition",
        value: this.pauseOnPhaseTransition,
      });
    },
    handleResetOnZoneChange() {
      this.updateSetting({
        key: "resetOnZoneChange",
        value: this.resetOnZoneChange,
      });
    },
    handleWindowModeChange() {
      this.updateSetting({
        key: "windowMode",
        value: this.windowMode ? 1 : 0,
      });
    },
    handleAnonymizeChange() {
      this.updateSetting({
        key: "anonymizeMeter",
        value: this.anonymizeMeter,
      });
    },
    handleRemoveOverkillDamage() {
      this.updateSetting({
        key: "removeOverkillDamage",
        value: this.removeOverkillDamage,
      });
    },
    handleMinifyDelayChange() {
      let val = this.toMs(this.minifyDelay);
      if (!val || val < 1000) val = 0;

      this.updateSetting({
        key: "minifyDelay",
        value: val,
      });
    },
    handleMinifyDirectionChange() {
      this.updateSetting({
        key: "minifyDirection",
        value: this.minifyDirection,
      });
    },
  },
});
</script>
