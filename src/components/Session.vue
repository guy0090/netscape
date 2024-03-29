<template style="height: 100%">
  <boss-status
    v-if="isGuardianFight() && !session?.live"
    :boss="getGuardianEntity()"
  ></boss-status>
  <div class="entities" v-if="getUserEntities().length > 0">
    <entity-card
      v-for="entity of getUserEntities()"
      :key="entity.id"
      :entity="entity"
      :anon="anon"
      :sessionDuration="sessionDuration"
      :totalDamage="session?.damageStatistics.totalDamageDealt"
      :compact="compact"
      :isPaused="isPaused"
      :pausedFor="pausedFor"
      @click="
        $router.push({ name: 'breakdown', params: { entityId: entity.id } })
      "
    ></entity-card>
  </div>
  <div v-else class="random-emoji">
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
      <!--
        <v-row justify="center">
          <v-col cols="auto">
            <span>NO DATA</span>
          </v-col>
        </v-row>
        -->
    </v-container>
  </div>
</template>

<script lang="ts">
import { EntityType } from "@/bridge/log-lines";
import { Entity, Session } from "@/encounters/objects";
import { defineComponent, PropType } from "vue";
import { useStore, mapActions } from "vuex";
import BossStatus from "./Session/BossStatus.vue";
import EntityCard from "./Session/EntityCard.vue";

export default defineComponent({
  name: "SessionPage",
  components: {
    BossStatus,
    EntityCard,
  },

  props: {
    compact: Boolean || false,
    session: (Object as PropType<Session>) || {},
    sessionDuration: Number,
    isPaused: Boolean || false,
    pausedFor: Number || 0,
  },

  setup() {
    const store = useStore();

    return {
      store,
    };
  },

  mounted() {
    this.getSetting("anonymizeMeter")
      .then((d: { message: { value: boolean } }) => {
        this.anon = d.message.value;
      })
      .catch((err: Error) => {
        this.error(err);
      });
  },

  methods: {
    ...mapActions(["getSetting", "updateSetting", "debug", "error"]),
    getUserEntities() {
      let users: Entity[] = [];
      if (this.session && this.session.entities) {
        users = this.session.entities
          .filter(
            (entity: Entity) =>
              entity.type === 3 && entity.stats.damageDealt > 0
          )
          .sort(
            (a: Entity, b: Entity) => b.stats.damageDealt - a.stats.damageDealt
          );
      }
      return users;
    },
    isGuardianFight() {
      if (this.session && this.session.entities) {
        return (
          this.session.entities.find(
            (e: Entity) => e.type === EntityType.GUARDIAN && e.maxHp > 0
          ) !== undefined
        );
      } else {
        return false;
      }
    },
    getGuardianEntity() {
      let guardian: Entity | undefined = undefined;
      if (this.session && this.session.entities.length > 0) {
        guardian = this.session.entities
          .filter(
            (entity: Entity) =>
              entity.type === EntityType.GUARDIAN && entity.maxHp > 0
          )
          .sort((a: Entity, b: Entity) => b.lastUpdate - a.lastUpdate)[0];
      }
      return guardian;
    },
  },

  data() {
    let anon = false;
    return {
      anon,
    };
  },
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
