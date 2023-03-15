<template>
  <v-container fluid class="random-emoji">
    <v-row class="random-emoji" align="center" justify="center">
      <v-col class="emoji-frame" cols="auto">
        <v-img
          class="emoji"
          :src="
            require(`@/assets/sprites/emojis/${Math.floor(
              Math.random() * 42
            )}.avif`)
          "
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "RandomEmoji",
});
</script>

<style scoped>
.emoji,
.emoji > img {
  /*
  width: 128px;
  height: 128px;
  */
  width: 96px;
  height: 96px;
}

.random-emoji {
  height: 100%;
}

.emoji-frame {
  border: 1px solid transparent;
  border-radius: 100%;
}

@media only screen and (max-height: 191px) {
  .emoji,
  .emoji > img {
    width: 64px;
    height: 64px;
  }
}
</style>
