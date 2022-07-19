<template>
  <v-container>
    <v-row class="mb-2 pt-2"> <h3>Appearance Settings</h3> </v-row>
    <v-row class="mb-8"
      ><small>These settings modify the look of the app</small></v-row
    >
    <v-row>
      <v-col>
        <v-row class="mb-3"
          ><v-icon icon="mdi-eye-outline"></v-icon>&nbsp;Window Opacity</v-row
        >
        <v-row class="mb-3"
          ><small>Adjusts the transparency of the app window.</small></v-row
        >
        <v-row class="mb-5 pb-0">
          <v-slider
            v-model="opacity"
            :min="0.4"
            :max="1"
            :step="0.01"
            color="green-accent-4"
            label="color"
            hide-details
          >
            <template v-slot:append>
              <v-text-field
                v-model="opacity"
                hide-details
                single-line
                density="compact"
                type="number"
                :min="0.4"
                :max="1"
                :step="0.01"
                style="width: 80px"
              ></v-text-field> </template
          ></v-slider>
        </v-row>
        <v-row class="mb-5" align="center">
          <v-col cols="auto">
            <v-row class="mb-3">
              <v-icon icon="mdi-hospital-box"></v-icon>
              &nbsp;Modify HP Bar
            </v-row>
            <v-row>
              <small>Toggle to enable resizing/moving of HP bar.</small>
            </v-row>
          </v-col>
          <v-spacer></v-spacer>
          <v-col class="mb-0 pb-0 pt-0 mt-0" cols="auto">
            <v-switch
              v-model="modifyHpBar"
              :label="modifyHpBar ? 'Editing' : 'Off'"
              color="green-accent-4"
              hide-details
              @change="handleHpBarModifyChange"
            ></v-switch>
          </v-col>
        </v-row>
        <v-row class="mb-4" align="center">
          <v-col cols="12">
            <v-row class="mb-3">
              <v-icon icon="mdi-palette"></v-icon>
              &nbsp;HP Bar Color
            </v-row>
            <v-row>
              <small>Changes the color of the HP bar.</small>
            </v-row>
            <v-row class="mt-5" justify="center">
              <v-col cols="auto">
                <v-color-picker
                  v-model="hpBarColor"
                  hide-canvas
                  v-on:update:model-value="handleHpBarColorChange"
                ></v-color-picker>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
        <v-row class="mb-0" align="center">
          <v-col cols="auto">
            <v-row class="mb-3">
              <v-icon v-if="compact" icon="mdi-view-compact"></v-icon>
              <v-icon v-else icon="mdi-view-compact-outline"></v-icon>
              &nbsp;Compact Design
            </v-row>
            <v-row>
              <small>Toggle to a more dense design.</small>
            </v-row>
          </v-col>
          <v-spacer></v-spacer>
          <v-col class="mb-0 pb-0 pt-0 mt-0" cols="auto">
            <v-switch
              v-model="compact"
              :label="compact ? 'Compact' : 'Normal'"
              color="green-accent-4"
              hide-details
              @change="handleCompactChange"
            ></v-switch>
          </v-col>
        </v-row>
        <v-row justify="center" class="pt-2">
          <v-col align="center" cols="auto" class="px-0">
            <v-row justify="center">
              <v-icon
                v-if="compact"
                icon="mdi-check-bold"
                color="green-accent-4"
                class="me-1"
              ></v-icon>
              Compact Player Entry
            </v-row>
            <v-row justify="center" class="mt-5 mb-5">
              <entity-card
                :entity="fakeEntities[Math.floor(Math.random() * 3)]"
                :anon="false"
                :sessionDuration="220"
                :totalDamage="170642192"
                :compact="true"
                :paused="false"
                :pausedFor="0"
                style="min-width: 310px !important; max-width: 310px !important"
              ></entity-card>
            </v-row>
            <v-row justify="center">
              <v-icon
                v-if="!compact"
                icon="mdi-check-bold"
                color="green-accent-4"
                class="me-1"
              ></v-icon>
              Normal Player Entry
            </v-row>
            <v-row justify="center" class="mt-5">
              <entity-card
                :entity="fakeEntities[Math.floor(Math.random() * 3)]"
                :anon="false"
                :sessionDuration="220"
                :totalDamage="170642192"
                :compact="false"
                :paused="false"
                :pausedFor="0"
                style="min-width: 340px !important"
              ></entity-card>
            </v-row>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { mapActions } from "vuex";

// Components
import EntityCard from "@/components/Session/EntityCard.vue";

export default defineComponent({
  name: "AppearanceSettings",

  components: {
    EntityCard,
  },

  mounted() {
    this.applySettings();
    this.listenForChanges();
  },

  methods: {
    ...mapActions([
      "setOpacity",
      "setCompactStyle",
      "setHpBarColor",
      "setModifyHpBar",
      "getSetting",
      "debug",
      "error",
    ]),
    applySettings() {
      this.getSetting("opacity")
        .then((d: { message: { value: string } }) => {
          let opacity = d.message.value;
          try {
            parseFloat(d.message.value);
            this.opacity = opacity;
          } catch {
            this.opacity = "0.9";
          }
        })
        .catch((err: Error) => {
          this.opacity = "0.9";
          this.error(err);
        });

      this.getSetting("compactStyle")
        .then((d: { message: { value: boolean } }) => {
          this.compact = d.message.value;
        })
        .catch((err: Error) => {
          this.error(err);
        });

      this.getSetting("hpBarColor")
        .then((d: { message: { value: string } }) => {
          this.hpBarColor = d.message.value;
        })
        .catch((err: Error) => {
          this.error(err);
        });

      this.getSetting("hpBarClickable")
        .then((d: { message: { value: boolean } }) => {
          this.modifyHpBar = d.message.value;
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
            case "compactStyle":
              this.compact = value;
              break;
            default:
              break;
          }
        }
      });
    },
    handleHpBarColorChange() {
      this.setHpBarColor(this.hpBarColor);
    },
    handleHpBarModifyChange() {
      this.setModifyHpBar(this.modifyHpBar);
    },
    handleCompactChange() {
      this.setCompactStyle(this.compact);
    },
  },

  watch: {
    opacity(after, before) {
      if (!before) return;
      let newOpacity = after;
      if (isNaN(newOpacity) || newOpacity < 0.4) {
        newOpacity = "0.9";
      }

      this.setOpacity(`${newOpacity}`);
      let htmlFrame = document.getElementsByTagName("html")[0];
      htmlFrame.style.opacity = `${newOpacity}`;
    },
  },

  setup() {
    const opacity = ref();
    const compact = ref(false);
    const hpBarColor = ref("red-darken-3");
    const modifyHpBar = ref(false);
    const fakeEntities = ref([
      {
        lastUpdate: 0,
        id: "4",
        name: "Destroyer",
        type: 3,
        class: "Destroyer",
        classId: 103,
        level: 1,
        gearLevel: "1340",
        currentHp: 28281,
        maxHp: 64013,
        skills: {
          "0": {
            id: 0,
            name: "Bleed",
            breakdown: [],
            stats: {
              hits: 54,
              crits: 19,
              backHits: 0,
              frontHits: 0,
              counters: 0,
              damageDealt: 1307316,
              topDamage: 38698,
            },
          },
          "18050": {
            id: 18050,
            name: "Heavy Crush",
            breakdown: [],
            stats: {
              hits: 23,
              crits: 8,
              backHits: 0,
              frontHits: 15,
              counters: 0,
              damageDealt: 827044,
              topDamage: 93111,
            },
          },
          "18070": {
            id: 18070,
            name: "Full Swing",
            breakdown: [],
            stats: {
              hits: 8,
              crits: 4,
              backHits: 0,
              frontHits: 8,
              counters: 0,
              damageDealt: 1634310,
              topDamage: 938416,
            },
          },
          "18110": {
            id: 18110,
            name: "Dreadnaught",
            breakdown: [],
            stats: {
              hits: 23,
              crits: 9,
              backHits: 0,
              frontHits: 14,
              counters: 0,
              damageDealt: 902097,
              topDamage: 88186,
            },
          },
          "18130": {
            id: 18130,
            name: "Seismic Hammer",
            breakdown: [],
            stats: {
              hits: 13,
              crits: 6,
              backHits: 2,
              frontHits: 9,
              counters: 0,
              damageDealt: 5651975,
              topDamage: 1402112,
            },
          },
          "18140": {
            id: 18140,
            name: "Endure Pain",
            breakdown: [],
            stats: {
              hits: 5,
              crits: 2,
              backHits: 1,
              frontHits: 3,
              counters: 0,
              damageDealt: 558410,
              topDamage: 176325,
            },
          },
          "18150": {
            id: 18150,
            name: "Earth Eater",
            breakdown: [],
            stats: {
              hits: 12,
              crits: 8,
              backHits: 0,
              frontHits: 10,
              counters: 0,
              damageDealt: 5865982,
              topDamage: 1025886,
            },
          },
          "18160": {
            id: 18160,
            name: "Jumping Smash",
            breakdown: [],
            stats: {
              hits: 52,
              crits: 23,
              backHits: 0,
              frontHits: 37,
              counters: 0,
              damageDealt: 1259570,
              topDamage: 103465,
            },
          },
          "18170": {
            id: 18170,
            name: "Perfect Swing",
            breakdown: [],
            stats: {
              hits: 10,
              crits: 3,
              backHits: 0,
              frontHits: 10,
              counters: 0,
              damageDealt: 8533896,
              topDamage: 2764292,
            },
          },
          "18230": {
            id: 18230,
            name: "Big Bang",
            breakdown: [],
            stats: {
              hits: 1,
              crits: 1,
              backHits: 0,
              frontHits: 0,
              counters: 0,
              damageDealt: 4489220,
              topDamage: 4489220,
            },
          },
        },
        stats: {
          hits: 201,
          crits: 83,
          backHits: 3,
          frontHits: 106,
          counters: 0,
          damageDealt: 31029820,
          healing: 29113,
          damageTaken: 140909,
          deaths: 1,
        },
      },
      {
        lastUpdate: 0,
        id: "3",
        name: "Scrapper",
        type: 3,
        class: "Scrapper",
        classId: 303,
        level: 55,
        gearLevel: "1340,83",
        currentHp: 59950,
        maxHp: 69022,
        skills: {
          "0": {
            id: 0,
            name: "Bleed",
            breakdown: [],
            stats: {
              hits: 119,
              crits: 71,
              backHits: 0,
              frontHits: 0,
              counters: 0,
              damageDealt: 3525859,
              topDamage: 51325,
            },
          },
          "23000": {
            id: 23000,
            name: "평타",
            breakdown: [],
            stats: {
              hits: 2,
              crits: 2,
              backHits: 2,
              frontHits: 0,
              counters: 0,
              damageDealt: 11500,
              topDamage: 11388,
            },
          },
          "23020": {
            id: 23020,
            name: "Charging Blow",
            breakdown: [],
            stats: {
              hits: 102,
              crits: 77,
              backHits: 61,
              frontHits: 0,
              counters: 0,
              damageDealt: 4645825,
              topDamage: 90331,
            },
          },
          "23050": {
            id: 23050,
            name: "Dragon Advent",
            breakdown: [],
            stats: {
              hits: 59,
              crits: 40,
              backHits: 9,
              frontHits: 0,
              counters: 0,
              damageDealt: 7147736,
              topDamage: 888468,
            },
          },
          "23070": {
            id: 23070,
            name: "Earthquake Chain",
            breakdown: [],
            stats: {
              hits: 4,
              crits: 3,
              backHits: 4,
              frontHits: 0,
              counters: 0,
              damageDealt: 1084196,
              topDamage: 574831,
            },
          },
          "23090": {
            id: 23090,
            name: "Crushing Smite",
            breakdown: [],
            stats: {
              hits: 20,
              crits: 15,
              backHits: 13,
              frontHits: 0,
              counters: 0,
              damageDealt: 1040420,
              topDamage: 116307,
            },
          },
          "23110": {
            id: 23110,
            name: "Death Rattle",
            breakdown: [],
            stats: {
              hits: 6,
              crits: 2,
              backHits: 3,
              frontHits: 0,
              counters: 0,
              damageDealt: 2983972,
              topDamage: 938400,
            },
          },
          "23160": {
            id: 23160,
            name: "Roundup Sweep",
            breakdown: [],
            stats: {
              hits: 75,
              crits: 53,
              backHits: 50,
              frontHits: 0,
              counters: 0,
              damageDealt: 4363436,
              topDamage: 136783,
            },
          },
          "23220": {
            id: 23220,
            name: "Battering Fists",
            breakdown: [],
            stats: {
              hits: 73,
              crits: 50,
              backHits: 45,
              frontHits: 0,
              counters: 0,
              damageDealt: 8020441,
              topDamage: 348177,
            },
          },
          "23230": {
            id: 23230,
            name: "Iron Cannon Blow",
            breakdown: [],
            stats: {
              hits: 36,
              crits: 24,
              backHits: 25,
              frontHits: 0,
              counters: 0,
              damageDealt: 6866366,
              topDamage: 611899,
            },
          },
        },
        stats: {
          hits: 496,
          crits: 337,
          backHits: 212,
          frontHits: 0,
          counters: 0,
          damageDealt: 39689751,
          healing: 62912,
          damageTaken: 67896,
          deaths: 0,
        },
      },
      {
        lastUpdate: 0,
        id: "1",
        name: "Gunslinger",
        type: 3,
        class: "Gunslinger",
        classId: 512,
        level: 56,
        gearLevel: "1340",
        currentHp: 58299,
        maxHp: 72997,
        skills: {
          "0": {
            id: 0,
            name: "Bleed",
            breakdown: [],
            stats: {
              hits: 140,
              crits: 68,
              backHits: 0,
              frontHits: 0,
              counters: 0,
              damageDealt: 3542576,
              topDamage: 57055,
            },
          },
          "38020": {
            id: 38020,
            name: "Quick Step",
            breakdown: [],
            stats: {
              hits: 12,
              crits: 5,
              backHits: 5,
              frontHits: 0,
              counters: 0,
              damageDealt: 324972,
              topDamage: 78526,
            },
          },
          "38040": {
            id: 38040,
            name: "Dual Buckshot",
            breakdown: [],
            stats: {
              hits: 25,
              crits: 15,
              backHits: 0,
              frontHits: 0,
              counters: 0,
              damageDealt: 5736782,
              topDamage: 863629,
            },
          },
          "38070": {
            id: 38070,
            name: "Target Down",
            breakdown: [],
            stats: {
              hits: 18,
              crits: 8,
              backHits: 0,
              frontHits: 0,
              counters: 0,
              damageDealt: 8581832,
              topDamage: 1241654,
            },
          },
          "38080": {
            id: 38080,
            name: "Catastrophe",
            breakdown: [],
            stats: {
              hits: 2,
              crits: 1,
              backHits: 0,
              frontHits: 0,
              counters: 0,
              damageDealt: 545775,
              topDamage: 543544,
            },
          },
          "38110": {
            id: 38110,
            name: "Sharpshooter",
            breakdown: [],
            stats: {
              hits: 38,
              crits: 31,
              backHits: 0,
              frontHits: 0,
              counters: 0,
              damageDealt: 7703794,
              topDamage: 940197,
            },
          },
          "38170": {
            id: 38170,
            name: "Shotgun Rapid Fire",
            breakdown: [],
            stats: {
              hits: 12,
              crits: 10,
              backHits: 0,
              frontHits: 0,
              counters: 0,
              damageDealt: 3871795,
              topDamage: 599570,
            },
          },
          "38180": {
            id: 38180,
            name: "Spiral Tracker",
            breakdown: [],
            stats: {
              hits: 78,
              crits: 39,
              backHits: 0,
              frontHits: 0,
              counters: 0,
              damageDealt: 1055480,
              topDamage: 29469,
            },
          },
          "38190": {
            id: 38190,
            name: "Bullet Rain",
            breakdown: [],
            stats: {
              hits: 15,
              crits: 8,
              backHits: 0,
              frontHits: 0,
              counters: 0,
              damageDealt: 649408,
              topDamage: 66068,
            },
          },
          "38200": {
            id: 38200,
            name: "Dexterous Shot",
            breakdown: [],
            stats: {
              hits: 42,
              crits: 13,
              backHits: 8,
              frontHits: 0,
              counters: 0,
              damageDealt: 447795,
              topDamage: 19652,
            },
          },
          "38220": {
            id: 38220,
            name: "Equilibrium",
            breakdown: [],
            stats: {
              hits: 4,
              crits: 3,
              backHits: 0,
              frontHits: 0,
              counters: 0,
              damageDealt: 1802,
              topDamage: 541,
            },
          },
          "38230": {
            id: 38230,
            name: "Last Request",
            breakdown: [],
            stats: {
              hits: 3,
              crits: 2,
              backHits: 1,
              frontHits: 1,
              counters: 0,
              damageDealt: 899231,
              topDamage: 357048,
            },
          },
          "38240": {
            id: 38240,
            name: "Focused Shot",
            breakdown: [],
            stats: {
              hits: 24,
              crits: 11,
              backHits: 0,
              frontHits: 0,
              counters: 0,
              damageDealt: 13132851,
              topDamage: 2425474,
            },
          },
          "38270": {
            id: 38270,
            name: "Perfect Shot",
            breakdown: [],
            stats: {
              hits: 4,
              crits: 1,
              backHits: 0,
              frontHits: 0,
              counters: 0,
              damageDealt: 2981025,
              topDamage: 1138941,
            },
          },
          "38280": {
            id: 38280,
            name: "High-Caliber HE Bullet",
            breakdown: [],
            stats: {
              hits: 1,
              crits: 1,
              backHits: 0,
              frontHits: 0,
              counters: 0,
              damageDealt: 37661,
              topDamage: 37661,
            },
          },
        },
        stats: {
          hits: 418,
          crits: 216,
          backHits: 14,
          frontHits: 1,
          counters: 0,
          damageDealt: 49512779,
          healing: 114819,
          damageTaken: 124982,
          deaths: 0,
        },
      },
      {
        lastUpdate: 0,
        id: "2",
        name: "Soulfist",
        type: 3,
        class: "Soulfist",
        classId: 304,
        level: 56,
        gearLevel: "1340",
        currentHp: 35923,
        maxHp: 77307,
        skills: {
          "0": {
            id: 0,
            name: "Bleed",
            breakdown: [],
            stats: {
              hits: 67,
              crits: 27,
              backHits: 0,
              frontHits: 0,
              counters: 0,
              damageDealt: 2899608,
              topDamage: 92720,
            },
          },
          "24000": {
            id: 24000,
            name: "평타",
            breakdown: [],
            stats: {
              hits: 31,
              crits: 15,
              backHits: 31,
              frontHits: 0,
              counters: 0,
              damageDealt: 195336,
              topDamage: 15556,
            },
          },
          "24050": {
            id: 24050,
            name: "World Decimation",
            breakdown: [],
            stats: {
              hits: 1,
              crits: 0,
              backHits: 0,
              frontHits: 0,
              counters: 0,
              damageDealt: 2322829,
              topDamage: 2322829,
            },
          },
          "24120": {
            id: 24120,
            name: "Heavenly Squash",
            breakdown: [],
            stats: {
              hits: 50,
              crits: 18,
              backHits: 0,
              frontHits: 0,
              counters: 0,
              damageDealt: 7446792,
              topDamage: 335885,
            },
          },
          "24190": {
            id: 24190,
            name: "Tempest Blast",
            breakdown: [],
            stats: {
              hits: 9,
              crits: 5,
              backHits: 0,
              frontHits: 0,
              counters: 0,
              damageDealt: 7337992,
              topDamage: 1663019,
            },
          },
          "24200": {
            id: 24200,
            name: "Shadowbreaker",
            breakdown: [],
            stats: {
              hits: 45,
              crits: 18,
              backHits: 29,
              frontHits: 0,
              counters: 0,
              damageDealt: 8615852,
              topDamage: 788133,
            },
          },
          "24210": {
            id: 24210,
            name: "Merciless Pummel",
            breakdown: [],
            stats: {
              hits: 103,
              crits: 53,
              backHits: 70,
              frontHits: 0,
              counters: 0,
              damageDealt: 12192625,
              topDamage: 290946,
            },
          },
          "24220": {
            id: 24220,
            name: "Bolting Crash",
            breakdown: [],
            stats: {
              hits: 26,
              crits: 15,
              backHits: 22,
              frontHits: 0,
              counters: 0,
              damageDealt: 1329073,
              topDamage: 116980,
            },
          },
          "24230": {
            id: 24230,
            name: "Force Orb",
            breakdown: [],
            stats: {
              hits: 46,
              crits: 21,
              backHits: 0,
              frontHits: 0,
              counters: 0,
              damageDealt: 7333930,
              topDamage: 311792,
            },
          },
          "24240": {
            id: 24240,
            name: "Flash Step",
            breakdown: [],
            stats: {
              hits: 13,
              crits: 5,
              backHits: 0,
              frontHits: 0,
              counters: 0,
              damageDealt: 195713,
              topDamage: 35209,
            },
          },
          "24241": {
            id: 24241,
            name: "Flash Step",
            breakdown: [],
            stats: {
              hits: 14,
              crits: 7,
              backHits: 0,
              frontHits: 0,
              counters: 0,
              damageDealt: 295306,
              topDamage: 40215,
            },
          },
          "24242": {
            id: 24242,
            name: "Flash Step",
            breakdown: [],
            stats: {
              hits: 13,
              crits: 3,
              backHits: 0,
              frontHits: 0,
              counters: 0,
              damageDealt: 226271,
              topDamage: 40515,
            },
          },
          "24280": {
            id: 24280,
            name: "운기조식 평타",
            breakdown: [],
            stats: {
              hits: 14,
              crits: 8,
              backHits: 14,
              frontHits: 0,
              counters: 0,
              damageDealt: 18515,
              topDamage: 9332,
            },
          },
        },
        stats: {
          hits: 432,
          crits: 195,
          backHits: 166,
          frontHits: 0,
          counters: 0,
          damageDealt: 50409842,
          healing: 35257,
          damageTaken: 76641,
          deaths: 0,
        },
      },
    ]);

    return {
      opacity,
      compact,
      hpBarColor,
      modifyHpBar,
      fakeEntities,
    };
  },
});
</script>
