<template>
  <v-card style="user-select: none" hover :rounded="0" v-if="!compact">
    <v-card-content>
      <v-row>
        <v-col cols="auto" class="py-1 px-1">
          <v-img
            class="class-icon"
            :src="
              require(`@/assets/sprites/classes/${
                entity?.classId !== 0 ? entity?.classId : 102
              }.png`)
            "
          />
        </v-col>
        <v-col class="py-1 px-3 align-self-center">
          <v-row class="pb-1">
            <v-col cols="auto" class="py-0 px-0">
              <strong v-if="anon">{{ entity?.class }}</strong>
              <strong v-else>{{ entity?.name }}</strong>
            </v-col>
            <v-col cols="auto" class="py-0 px-1">
              <small
                class="bg-red-darken-2"
                style="
                  padding-left: 4px !important;
                  padding-right: 7px !important;
                "
                v-if="entity?.gearLevel != 0"
              >
                {{ entity?.gearLevel }}
              </small>
              <small v-else>&nbsp;</small>
            </v-col>
            <v-spacer></v-spacer>
            <v-col cols="auto" class="py-0 px-0">
              <strong>{{ getEntityDPS() }}/s</strong>
            </v-col>
          </v-row>
          <v-row class="pb-1">
            <v-col cols="auto" class="py-0 px-0">
              <small
                >Crits: {{ entity?.stats?.crits }}
                <span style="font-size: 8pt"
                  >({{ getEntityCritRate() }}%)</span
                ></small
              >
            </v-col>
            <v-col
              v-if="entity?.stats?.counters > 0"
              cols="auto"
              class="py-0 px-2"
            >
              <small>Counters: {{ entity?.stats?.counters }}</small>
            </v-col>
            <v-spacer></v-spacer>
            <v-col cols="auto" class="py-0 px-0">
              <small>{{ getPercentDamageDealt() }}%</small>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="auto" class="py-0 px-0">
              <small>
                B. Hits: {{ entity?.stats?.backHits }}
                <span class="percent-detail" style="font-size: 8pt"
                  >({{ getEntityBackAttackRate() }}%)</span
                >
              </small>
            </v-col>
            <v-col cols="auto" class="py-0 px-2">
              <small>
                F. Hits: {{ entity?.stats?.frontHits }}
                <span class="percent-detail" style="font-size: 8pt"
                  >({{ getEntityFrontAttackRate() }}%)</span
                >
              </small>
            </v-col>
            <v-spacer></v-spacer>
            <v-col cols="auto" class="py-0 px-0">
              <small class="text-green">{{ getEntityHealing() }} &nbsp;</small>
              <small class="text-red">{{ getEntityDamageTaken() }}</small>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-card-content>
    <v-progress-linear
      :model-value="getPercentDamageDealt()"
      striped
      height="5"
      :color="getClassColor(entity?.classId)"
    ></v-progress-linear>
  </v-card>
  <v-card
    hover
    :rounded="0"
    :class="`bg-${entity?.classId}`"
    :style="`background-size: ${getPercentDamageDealt()}%; user-select: none`"
    v-else
  >
    <v-card-content>
      <v-row>
        <v-col cols="auto" class="py-1 px-1">
          <v-img
            class="class-icon-compact"
            :src="require(`@/assets/sprites/classes/${entity?.classId}.png`)"
          />
        </v-col>
        <v-col class="py-1 ps-3 pe-4 align-self-center">
          <v-row class="pb-1">
            <v-col cols="auto" class="py-0 pe-1 ps-0">
              <strong class="text-truncate" style="font-size: 11pt" v-if="anon">
                {{ entity?.class }}
              </strong>
              <strong class="text-truncate" style="font-size: 11pt" v-else>{{
                entity?.name
              }}</strong>
            </v-col>
            <v-col cols="auto" class="py-0 px-0">
              <small v-if="entity?.gearLevel != 0">{{
                entity?.gearLevel
              }}</small>
              <small v-else>&nbsp;</small>
            </v-col>
            <v-spacer></v-spacer>
            <v-col cols="auto" class="py-0 px-0">
              <strong style="font-size: 11pt">{{ getEntityDPS() }}/s</strong>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="auto" class="py-0 px-0">
              <small>C: {{ getEntityCounters() }}&nbsp;</small>
              <small>CR: {{ getEntityCritRate() }}%&nbsp;</small>
              <small>BH: {{ getEntityBackAttackRate() }}%&nbsp;</small>
              <small>FH: {{ getEntityFrontAttackRate() }}%&nbsp;</small>
            </v-col>
            <v-spacer></v-spacer>
            <v-col cols="auto" class="py-0 px-0">
              <small>{{ abbrNum(entity?.stats?.damageDealt, 1) }} </small>
              <small style="padding-left: 2px; font-size: 8pt"
                >({{ getPercentDamageDealt() }}%)</small
              >
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-card-content>
  </v-card>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useStore } from "vuex";

export default defineComponent({
  name: "EntityCard",

  props: {
    entity: Object,
    anon: Boolean || false,
    sessionDuration: Number,
    totalDamage: Number,
    compact: Boolean || false,
    paused: Boolean || false,
    pausedFor: Number || 0,
  },

  methods: {
    getEntityDPS() {
      const damageDealt = this.entity?.stats?.damageDealt;

      let duration = this.sessionDuration || 0;
      if (this.pausedFor && this.pausedFor > 0) duration -= this.pausedFor;

      if (damageDealt && duration) {
        const dps = damageDealt / duration;
        return this.abbrNum(dps, 2);
      } else {
        return "0";
      }
    },
    getEntityCritRate() {
      const hits = this.entity?.stats?.hits;
      const crits = this.entity?.stats?.crits;

      if (hits && crits) {
        const critRate = (crits / hits) * 100;
        return critRate.toFixed(1);
      } else {
        return 0;
      }
    },
    getEntityBackAttackRate() {
      const hits = this.entity?.stats?.hits;
      const backHits = this.entity?.stats?.backHits;

      if (hits && backHits) {
        const backAttackRate = (backHits / hits) * 100;
        return backAttackRate.toFixed(1);
      } else {
        return 0;
      }
    },
    getEntityFrontAttackRate() {
      const hits = this.entity?.stats?.hits;
      const frontHits = this.entity?.stats?.frontHits;

      if (hits && frontHits) {
        const frontAttackRate = (frontHits / hits) * 100;
        return frontAttackRate.toFixed(1);
      } else {
        return 0;
      }
    },
    getEntityHealing() {
      const healing = this.entity?.stats?.healing;

      if (healing) {
        return this.abbrNum(healing, 1);
      } else {
        return 0;
      }
    },
    getEntityDamageTaken() {
      const damageTaken = this.entity?.stats?.damageTaken;

      if (damageTaken) {
        return this.abbrNum(damageTaken, 1);
      } else {
        return 0;
      }
    },
    getEntityCounters() {
      return this.entity?.stats?.counters;
    },
    getPercentDamageDealt() {
      const damageDealt = this.entity?.stats?.damageDealt;
      const sessionDamage = this.totalDamage;

      if (damageDealt && sessionDamage) {
        const portionOfDamageDealt = (damageDealt / sessionDamage) * 100;
        return portionOfDamageDealt.toFixed(1);
      } else {
        return 0;
      }
    },
    getClassBackground() {
      const damagePercent = this.getPercentDamageDealt();
      const classId = this.entity?.classId;

      return `
        background-image: require('@/assets/sprites/classes/${classId}.png');
        background-repeat: repeat-y;
        background-size: ${damagePercent}% auto;
      `;
    },
    getClassColor(id: number | undefined) {
      if (id) {
        let type = this.classColors;
        return this.classColors[id as keyof typeof type];
      } else {
        return this.classColors[0];
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
  },

  data() {
    let classColors = {
      0: "#541165",
      101: "#6633cc",
      102: "#ee2e48",
      103: "#7b9aa2",
      104: "#E1907E",
      105: "#ff9900",
      201: "#df2871",
      202: "#b38915",
      203: "#22aa99",
      204: "#674598",
      205: "#66aa00",
      301: "#dc3912",
      302: "#aaaa11",
      303: "#990099",
      304: "#316395",
      305: "#f6da6a",
      311: "#3366cc",
      312: "#994499",
      401: "#3752d8",
      402: "#a91a16",
      403: "#0099c6",
      404: "#109618",
      501: "#184B4D",
      502: "#dd4477",
      503: "#4442a8",
      504: "#33670b",
      505: "#3b4292",
      511: "#541165",
      512: "#6bcec2",
    };

    return {
      classColors,
    };
  },

  setup() {
    let dps = "0";
    let dpsTimer: ReturnType<typeof setInterval> | undefined;
    let store = useStore();

    return {
      dps,
      dpsTimer,
      store,
    };
  },
});
</script>

<style scoped>
.class-icon {
  width: 45px;
  height: 45px;
}

.class-icon-compact {
  width: 23px;
  height: 23px;
}

@media only screen and (max-width: 360px) {
  .percent-detail {
    display: none;
  }
}

.bg-102 {
  background-image: url("@/assets/sprites/class-colors/102.png");
  background-repeat: repeat-y;
}
.bg-103 {
  background-image: url("@/assets/sprites/class-colors/103.png");
  background-repeat: repeat-y;
}
.bg-104 {
  background-image: url("@/assets/sprites/class-colors/104.png");
  background-repeat: repeat-y;
}
.bg-105 {
  background-image: url("@/assets/sprites/class-colors/105.png");
  background-repeat: repeat-y;
}
.bg-202 {
  background-image: url("@/assets/sprites/class-colors/202.png");
  background-repeat: repeat-y;
}
.bg-203 {
  background-image: url("@/assets/sprites/class-colors/203.png");
  background-repeat: repeat-y;
}
.bg-204 {
  background-image: url("@/assets/sprites/class-colors/204.png");
  background-repeat: repeat-y;
}
.bg-205 {
  background-image: url("@/assets/sprites/class-colors/205.png");
  background-repeat: repeat-y;
}
.bg-302 {
  background-image: url("@/assets/sprites/class-colors/302.png");
  background-repeat: repeat-y;
}
.bg-303 {
  background-image: url("@/assets/sprites/class-colors/303.png");
  background-repeat: repeat-y;
}
.bg-304 {
  background-image: url("@/assets/sprites/class-colors/304.png");
  background-repeat: repeat-y;
}
.bg-305 {
  background-image: url("@/assets/sprites/class-colors/305.png");
  background-repeat: repeat-y;
}
.bg-312 {
  background-image: url("@/assets/sprites/class-colors/312.png");
  background-repeat: repeat-y;
}
.bg-402 {
  background-image: url("@/assets/sprites/class-colors/402.png");
  background-repeat: repeat-y;
}
.bg-403 {
  background-image: url("@/assets/sprites/class-colors/403.png");
  background-repeat: repeat-y;
}
.bg-404 {
  background-image: url("@/assets/sprites/class-colors/404.png");
  background-repeat: repeat-y;
}
.bg-502 {
  background-image: url("@/assets/sprites/class-colors/502.png");
  background-repeat: repeat-y;
}
.bg-503 {
  background-image: url("@/assets/sprites/class-colors/503.png");
  background-repeat: repeat-y;
}
.bg-504 {
  background-image: url("@/assets/sprites/class-colors/504.png");
  background-repeat: repeat-y;
}
.bg-505 {
  background-image: url("@/assets/sprites/class-colors/505.png");
  background-repeat: repeat-y;
}
.bg-512 {
  background-image: url("@/assets/sprites/class-colors/512.png");
  background-repeat: repeat-y;
}
</style>
