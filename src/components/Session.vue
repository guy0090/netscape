<template style="height: 100%">
  <boss-status
    v-if="isGuardianFight()"
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
              )}.webp`)
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
import { Entity, ENTITY_TYPE } from "@/encounters/objects";
import { defineComponent } from "vue";
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
    session: Object || {},
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
        console.error(err);
      });
  },

  methods: {
    ...mapActions(["getSetting", "updateSetting"]),
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
            (e: Entity) => e.type === ENTITY_TYPE.GUARDIAN && e.maxHp > 0
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
              entity.type === ENTITY_TYPE.GUARDIAN && entity.maxHp > 0
          )
          .sort((a: Entity, b: Entity) => b.lastUpdate - a.lastUpdate)[0];

        if (guardian) {
          return {
            name: guardian.name,
            currentHp: guardian.currentHp,
            maxHp: guardian.maxHp,
          };
        } else {
          return guardian;
        }
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
