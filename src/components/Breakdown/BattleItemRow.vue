<template>
  <v-card :rounded="0" class="border-b-md">
    <v-card-content style="user-select: none">
      <v-row align="center" class="pb-1 pt-1">
        <v-col cols="auto" class="py-0 ps-0 pe-2">
          <v-img class="icon" :src="getIcon()" />
        </v-col>
        <v-col class="py-0 ps-3 pe-0">
          <v-row class="pb-1">
            <h4 class="d-inline-block text-truncate">
              {{ $t(`effects.${item?.id}`) }}
            </h4>
          </v-row>
          <v-row>
            <small class="me-2">Uses: {{ item?.stats.uses }}</small>
            <small class="me-2"
              >Damage: {{ abbrNum(item?.stats.damage, 2) }}</small
            >
          </v-row>
        </v-col>
      </v-row>
    </v-card-content>
  </v-card>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "BattleItemRow",
  props: {
    item: Object,
  },

  methods: {
    getIcon() {
      try {
        return require(`@/assets/sprites/skills/${this.item?.id}.avif`);
      } catch {
        return require("@/assets/sprites/emojis/42.avif");
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
});
</script>

<style scoped>
.icon,
.icon > img {
  width: 38px;
  height: 38px;
  border-radius: 10%;
}
</style>
