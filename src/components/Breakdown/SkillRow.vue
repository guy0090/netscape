<template>
  <v-card v-if="!compact" :rounded="0" @contextmenu="handleCardClick">
    <v-card-content style="user-select: none">
      <v-row align="center" class="pb-1 pt-1">
        <v-col cols="auto" class="py-0 ps-0 pe-2"
          ><v-img class="skill-icon" :src="getSkillIcon()"
        /></v-col>
        <v-col cols="7" class="py-0 ps-3 pe-0">
          <v-row style="padding-bottom: 7px">
            <h4 class="d-inline-block text-truncate">
              {{ getSkillName(skill) }}
            </h4>
          </v-row>
          <v-row style="padding-bottom: 7px">
            <small class="me-2">Casts: {{ skill?.stats.casts }}</small>
            <small class="me-2">Hits: {{ skill?.stats.hits }}</small>
            <small>Crits: {{ skill?.stats.crits }}</small>
            <small style="font-size: 8pt" class="align-self-end"
              >&nbsp;({{ getSkillCritRate() }}%)</small
            >
          </v-row>
          <v-row>
            <small>B. Hits: {{ skill?.stats.backHits }}</small>
            <small style="font-size: 8pt" class="align-self-end me-2"
              >&nbsp;({{ getSkillBackHitRate() }}%)</small
            >
            <small>F. Hits: {{ skill?.stats.frontHits }}</small>
            <small style="font-size: 8pt" class="align-self-end"
              >&nbsp;({{ getSkillFrontHitRate() }}%)</small
            >
          </v-row>
        </v-col>
        <v-col class="py-0">
          <v-row class="pb-1" justify="end" style="padding-bottom: 7px">
            <strong>{{ getSkillDps() }}/s</strong>
          </v-row>
          <v-row justify="end" style="padding-bottom: 7px">
            <small>
              {{ abbrNum(skill?.stats.damageDealt, 2) }}
              <span style="font-size: 8pt">
                ({{ getSkillDamagePercent() }}%)
              </span>
            </small>
          </v-row>
          <v-row justify="end">
            <small>Max: {{ abbrNum(skill?.stats.topDamage, 2) }} </small>
          </v-row>
        </v-col>
      </v-row>
    </v-card-content>
    <v-progress-linear
      :model-value="getSkillDamagePercent()"
      striped
      height="5"
      :color="getClassColor()"
    ></v-progress-linear>
  </v-card>
  <v-card
    v-else
    :class="`bg-${classId} border-b-md`"
    :style="`background-size: ${getSkillDamagePercent()}%;`"
    :rounded="0"
    @contextmenu="handleCardClick"
  >
    <v-card-content style="user-select: none">
      <v-row align="center" class="pb-0 pt-0">
        <v-col cols="auto" class="py-0 ps-0 pe-2"
          ><v-img class="skill-icon-compact" :src="getSkillIcon()"
        /></v-col>
        <v-col cols="8" class="py-0 ps-3 pe-0">
          <v-row class="pb-1">
            <h4 class="d-inline-block text-truncate">{{ skill?.name }}</h4>
          </v-row>
          <v-row>
            <small class="me-2">H: {{ skill?.stats.hits }}</small>
            <small class="me-2">CR: {{ getSkillCritRate() }}%</small>
            <small class="me-2">BH: {{ getSkillBackHitRate() }}%</small>
            <small>FH: {{ getSkillFrontHitRate() }}%</small>
          </v-row>
        </v-col>
        <v-col class="py-0">
          <v-row class="pb-1" justify="end"
            ><strong>{{ getSkillDps() }}/s</strong></v-row
          >
          <v-row justify="end"
            ><small>{{ abbrNum(skill?.stats?.damageDealt, 2) }}</small></v-row
          >
        </v-col>
      </v-row>
    </v-card-content>
  </v-card>
</template>

<script lang="ts">
import { Skill } from "@/encounters/objects";
import { defineComponent } from "vue";

export default defineComponent({
  name: "SkillRow",

  props: {
    classId: Number,
    skill: Object,
    sessionDuration: Number,
    compact: Boolean,
    pausedFor: Number,
    isPaused: Boolean,
    damageDealt: Number,
  },

  methods: {
    handleCardClick(e: MouseEvent) {
      if (e.button === 2) this.$router.go(-1);
    },
    getClassColor() {
      let colors = this.classColors;

      if (this.classId) {
        let id = this.classId;
        return colors[id as keyof typeof colors];
      } else {
        return colors[0];
      }
    },
    getSkillIcon() {
      try {
        return require(`@/assets/sprites/skills/${this.skill?.id}.avif`);
      } catch {
        return require("@/assets/sprites/emojis/42.avif");
      }
    },
    getSkillDps() {
      const skill = this.skill as Skill;
      const damageDealt = skill.stats.damageDealt;

      let duration = this.sessionDuration || 0;
      if (this.pausedFor && this.pausedFor > 0) duration -= this.pausedFor;

      if (damageDealt && duration) {
        const dps = damageDealt / duration;
        return this.abbrNum(dps, 2);
      } else {
        return "0";
      }
    },
    getSkillDamagePercent() {
      const skill = this.skill as Skill;
      const damageDealt = skill.stats.damageDealt;
      const totalDamage = this.damageDealt;

      if (damageDealt && totalDamage) {
        const damagePercent = (damageDealt / totalDamage) * 100;
        return damagePercent.toFixed(2);
      } else {
        return 0;
      }
    },
    getSkillCritRate() {
      const skill = this.skill as Skill;
      const crits = skill.stats.crits;
      const hits = skill.stats.hits;

      if (crits && hits) {
        const critRate = (crits / hits) * 100;
        return critRate.toFixed(1);
      } else {
        return "0";
      }
    },
    getSkillFrontHitRate() {
      const skill = this.skill as Skill;
      const frontHits = skill.stats.frontHits;
      const hits = skill.stats.hits;

      if (frontHits && hits) {
        const frontHitRate = (frontHits / hits) * 100;
        return frontHitRate.toFixed(1);
      } else {
        return "0";
      }
    },
    getSkillBackHitRate() {
      const skill = this.skill as Skill;
      const backHits = skill.stats.backHits;
      const hits = skill.stats.hits;

      if (backHits && hits) {
        const backHitRate = (backHits / hits) * 100;
        return backHitRate.toFixed(1);
      } else {
        return "0";
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
    getSkillName(skill: any) {
      const localized = this.$t(`skills.${skill?.id}`);

      if (!/[.]/.test(localized)) return localized;
      else return skill.name;
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

    let krRegex = /[\u3131-\uD79D]/iu;
    return {
      classColors,
      krRegex,
    };
  },
});
</script>

<style scoped>
.skill-icon,
.skill-icon > img {
  width: 38px;
  height: 38px;
  border-radius: 10%;
}

.skill-icon-compact,
.skill-icon-compact > img {
  width: 32px;
  height: 32px;
  border-radius: 5%;
}

.bg-102 {
  background-image: url("@/assets/sprites/class-colors/102.avif");
  background-repeat: repeat-y;
}
.bg-103 {
  background-image: url("@/assets/sprites/class-colors/103.avif");
  background-repeat: repeat-y;
}
.bg-104 {
  background-image: url("@/assets/sprites/class-colors/104.avif");
  background-repeat: repeat-y;
}
.bg-105 {
  background-image: url("@/assets/sprites/class-colors/105.avif");
  background-repeat: repeat-y;
}
.bg-202 {
  background-image: url("@/assets/sprites/class-colors/202.avif");
  background-repeat: repeat-y;
}
.bg-203 {
  background-image: url("@/assets/sprites/class-colors/203.avif");
  background-repeat: repeat-y;
}
.bg-204 {
  background-image: url("@/assets/sprites/class-colors/204.avif");
  background-repeat: repeat-y;
}
.bg-205 {
  background-image: url("@/assets/sprites/class-colors/205.avif");
  background-repeat: repeat-y;
}
.bg-302 {
  background-image: url("@/assets/sprites/class-colors/302.avif");
  background-repeat: repeat-y;
}
.bg-303 {
  background-image: url("@/assets/sprites/class-colors/303.avif");
  background-repeat: repeat-y;
}
.bg-304 {
  background-image: url("@/assets/sprites/class-colors/304.avif");
  background-repeat: repeat-y;
}
.bg-305 {
  background-image: url("@/assets/sprites/class-colors/305.avif");
  background-repeat: repeat-y;
}
.bg-312 {
  background-image: url("@/assets/sprites/class-colors/312.avif");
  background-repeat: repeat-y;
}
.bg-402 {
  background-image: url("@/assets/sprites/class-colors/402.avif");
  background-repeat: repeat-y;
}
.bg-403 {
  background-image: url("@/assets/sprites/class-colors/403.avif");
  background-repeat: repeat-y;
}
.bg-404 {
  background-image: url("@/assets/sprites/class-colors/404.avif");
  background-repeat: repeat-y;
}
.bg-502 {
  background-image: url("@/assets/sprites/class-colors/502.avif");
  background-repeat: repeat-y;
}
.bg-503 {
  background-image: url("@/assets/sprites/class-colors/503.avif");
  background-repeat: repeat-y;
}
.bg-504 {
  background-image: url("@/assets/sprites/class-colors/504.avif");
  background-repeat: repeat-y;
}
.bg-505 {
  background-image: url("@/assets/sprites/class-colors/505.avif");
  background-repeat: repeat-y;
}
.bg-512 {
  background-image: url("@/assets/sprites/class-colors/512.avif");
  background-repeat: repeat-y;
}
</style>
