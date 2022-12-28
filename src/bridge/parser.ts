import { logger } from "@/util/logging";
import { getClassId, getClassName } from "@/util/game-classes";
import { cloneDeep, matchesProperty } from "lodash";
import { EventEmitter } from "events";
import {
  LINE_SPLIT_CHAR,
  LogHeal,
  LogDeath,
  LogNewPc,
  LogDamage,
  LogNewNpc,
  LogInitEnv,
  LogMessage,
  LogCounterAttack,
  LogSkillStart,
  LogBattleItem,
  HitFlag,
  HitOption,
  RaidResult,
  LogPhaseTransition,
  EntityType,
  LogBuff,
} from "./log-lines";
import {
  BattleItem,
  BattleItemStats,
  Entity,
  Session,
  Skill,
  SkillBreakdown,
  Stats,
  tryParseNum,
} from "@/encounters/objects";
import {
  getEntityDps,
  getTotalDps,
  readEncounter,
  saveEncounter,
  trySetClassFromSkills,
} from "@/encounters/helpers";
import {
  openInBrowser,
  uploadSession,
  validateUpload,
} from "@/encounters/uploads";
import {
  abyssRaids,
  raidBosses,
  guardians,
  extraHpBars,
} from "@/util/supported-bosses";
import { projectileItems, battleItems } from "@/util/skills";
import AppStore from "@/persistance/store";

const isDevelopment = process.env.NODE_ENV !== "production";

// * Time player out if they havent been updated in 10min
export const PLAYER_ENTITY_TIMEOUT = 60 * 1000 * 10;
// * Time bosses out if they havent been updated in 10min
export const BOSS_ENTITY_TIMEOUT = 60 * 1000 * 10;
// * Time everything else out if they havent been updated in 10min
export const DEFAULT_ENTITY_TIMEOUT = 60 * 1000 * 10;

export interface ActiveUser {
  id: string;
  name: string;
  realName: string;
  classId: number;
  level: number;
  gearLevel: number;
}

export interface PacketParserConfig {
  resetOnZoneChange?: boolean | undefined;
  removeOverkillDamage?: boolean | undefined;
  pauseOnPhaseTransition?: boolean | undefined;
  uploadLogs?: boolean | undefined;
  openUploadInBrowser?: boolean | undefined;
  startSending?: boolean | undefined;
  uploadUnlisted?: boolean | undefined;
}

export class PacketParser extends EventEmitter {
  private session: Session;
  private resetTimer: ReturnType<typeof setTimeout> | undefined;
  private broadcast: ReturnType<typeof setInterval> | undefined;
  private removeOverkillDamage: boolean;
  private uploadLogs: boolean;
  private openUploadInBrowser: boolean;
  private uploadUnlisted: boolean;
  private hasBossEntity: boolean;
  private previousSession: Session | undefined;
  private activeUser: ActiveUser;
  private appStore: AppStore;

  // ! Temp workaround for valtan ghost phase
  private valtanGhostId: string | undefined = undefined;

  constructor(appStore: AppStore, config: PacketParserConfig = {}) {
    // Extend
    super();

    // Config
    this.removeOverkillDamage = config.removeOverkillDamage ?? true;
    this.uploadLogs = config.uploadLogs ?? false;
    this.openUploadInBrowser = config.openUploadInBrowser ?? false;
    this.uploadUnlisted = config.uploadUnlisted ?? true;

    this.resetTimer = undefined;
    this.hasBossEntity = false;
    this.activeUser = {
      id: "0",
      name: "You",
      realName: "",
      classId: 0,
      level: 1,
      gearLevel: 0,
    };
    this.appStore = appStore;
    // Init
    this.session = new Session({ unlisted: this.uploadUnlisted });

    // Start sending session information
    if (config.startSending) this.startBroadcasting(200);
    else this.broadcast = undefined;
  }

  startBroadcasting(tickRate = 200) {
    if (!this.broadcast) {
      this.broadcast = setInterval(() => {
        this.broadcastSessionChange();
      }, tickRate);
    }
  }

  stopBroadcasting() {
    clearInterval(this.broadcast);
    this.broadcast = undefined;
  }

  getSession(): Session {
    return this.session;
  }

  getEntity(id: string, byName = false): Entity | undefined {
    if (byName)
      return this.session.entities.find((entity) => entity.name === id);
    return this.session.entities.find((entity) => entity.id === id);
  }

  getEntityIndex(id: string, byName = false): number {
    if (byName)
      return this.session.entities.findIndex((entity) => entity.name === id);
    return this.session.entities.findIndex((entity) => entity.id === id);
  }

  isBossEntity(entityNpcId: number) {
    return raidBosses.includes(entityNpcId);
  }

  isGuardianEntity(entityNpcId: number) {
    return abyssRaids.includes(entityNpcId) || guardians.includes(entityNpcId);
  }

  setRemoveOverkillDamage(removeOverkillDamage: boolean) {
    this.removeOverkillDamage = removeOverkillDamage;
  }

  setUploadLogs(uploadLogs: boolean) {
    this.uploadLogs = uploadLogs;
  }

  setOpenUploadInBrowser(openUploadInBrowser: boolean) {
    this.openUploadInBrowser = openUploadInBrowser;
  }

  setUploadUnlisted(uploadUnlisted: boolean) {
    this.uploadUnlisted = uploadUnlisted;
    this.session.unlisted = uploadUnlisted;
  }

  resetEntities(entities: Entity[]): Entity[] {
    const reset: Entity[] = [];
    const timeout = DEFAULT_ENTITY_TIMEOUT;
    for (const entity of entities) {
      // ! Special case for active user; never expire
      const isActiveUser = entity.id === this.activeUser.id;
      if (+new Date() - entity.lastUpdate > timeout && !isActiveUser) {
        logger.parser("Expiring timed out entity", {
          id: entity.id,
          name: entity.name,
        });
        continue;
      }

      if (entity.type !== EntityType.PLAYER && entity.currentHp <= 0) {
        logger.parser("Expiring dead boss/monster entity", {
          id: entity.id,
          name: entity.name,
        });
        continue;
      }

      if (
        entity.type === EntityType.MONSTER ||
        entity.type === EntityType.UNKNOWN
      ) {
        logger.parser("Expiring unknown/monster entity", {
          id: entity.id,
          name: entity.name,
        });
        continue;
      }

      entity.lastUpdate = +new Date();
      entity.stats = new Stats();
      entity.skills = {};
      entity.battleItems = {};

      reset.push(entity);
    }

    this.hasBossEntity = this.hasBoss(reset);
    return reset;
  }

  resetSession(timeout = 2000, upload = true, previous = false): void {
    logger.parser("Resetting session", { timeout, upload, previous });
    if (this.resetTimer) return;

    const clone = cloneDeep(this.session);
    if (!previous && this.hasBoss(clone.entities, false)) {
      clone.cleanEntities();

      clone.damageStatistics.dps = getTotalDps(clone);
      clone.entities.forEach((e) => {
        e.stats.dps = getEntityDps(e, clone.firstPacket, clone.lastPacket);
      });

      logger.parser("Boss is present; Saving encounter");
      saveEncounter(clone, true, "gzip", isDevelopment).catch((err) => {
        logger.error("Failed to save encounter", err);
      });

      const isSessionValid = validateUpload(clone);
      if (upload && isSessionValid) {
        logger.parser("Uploading encounter");
        uploadSession(this.appStore, clone)
          .then((d) => {
            const uploadedId = d.id;
            logger.parser("Uploaded encounter", { uploadedId });
            if (this.openUploadInBrowser) openInBrowser(uploadedId);
          })
          .catch((err) => {
            logger.error("Failed to upload session", err);
          });
      }
    }

    this.resetTimer = setTimeout(() => {
      const entities = cloneDeep(this.session).entities;
      const resetEntities = this.resetEntities(entities);
      this.session = new Session({
        entities: resetEntities,
        unlisted: this.uploadUnlisted,
      });

      this.hasBossEntity = this.hasBoss(this.session.entities);
      this.resetTimer = undefined;
      this.valtanGhostId = "";

      logger.parser("Reset session", this.session.entities);
      this.emit("reset-session", this.session.toSimpleObject());
      this.emit("hide-hp", []);
    }, timeout);
  }

  resetPrevious() {
    this.previousSession = undefined;
  }

  pauseSession() {
    logger.debug("Pausing session");
    this.session.paused = true;
    this.emit("pause-session", this.session.toSimpleObject());
  }

  resumeSession() {
    logger.debug("Resuming session");
    this.session.paused = false;
    this.emit("resume-session", this.session.toSimpleObject());
  }

  hasBoss(entities: Entity[], mustBeAlive = true) {
    return entities.some(
      (entity) =>
        (entity.type === EntityType.BOSS ||
          entity.type === EntityType.GUARDIAN) &&
        (mustBeAlive ? entity.currentHp > 0 : true)
    );
  }

  getBoss() {
    const bosses = this.session.entities.filter(
      (entity) =>
        entity.type === EntityType.BOSS || entity.type === EntityType.GUARDIAN
    );

    if (bosses.length > 0) {
      return bosses.sort((a, b) => {
        return b.lastUpdate - a.lastUpdate;
      })[0];
    } else {
      return undefined;
    }
  }

  broadcastSessionChange() {
    const smaller = this.session.toSimpleObject();
    if (this.previousSession) return; // Don't send a session if the previous is being shown

    this.emit("session-broadcast", smaller);
  }

  parse(line: string) {
    if (!line) {
      logger.warn("Empty line");
      return;
    }

    const lineSplit = line.trim().split(LINE_SPLIT_CHAR);
    if (lineSplit.length < 1 || !lineSplit[0]) {
      logger.warn(`Invalid line: ${lineSplit}`);
      return;
    }
    try {
      const logType = tryParseNum(lineSplit[0]);
      const timestamp = +new Date(lineSplit[1]);

      switch (logType) {
        case 0:
          this.onMessage(new LogMessage(lineSplit));
          break;
        case 1:
          this.onInitEnv(new LogInitEnv(lineSplit));
          break;
        case 2:
          this.onPhaseTransition(new LogPhaseTransition(lineSplit));
          break;
        case 3:
          this.onNewPc(new LogNewPc(lineSplit));
          break;
        case 4:
          this.onNewNpc(new LogNewNpc(lineSplit));
          break;
        case 5:
          this.onDeath(new LogDeath(lineSplit));
          break;

        case 6:
          this.onSkillStart(new LogSkillStart(lineSplit));
          break;
        /*
        case 7:
          this.onSkillStage(new LogSkillStage(lineSplit));
          break;
        */
        case 8:
          this.onDamage(new LogDamage(lineSplit));
          break;
        case 9:
          this.onHeal(new LogHeal(lineSplit));
          break;
        /* case 10:
        this.onBuff(lineSplit);
        break; */
        case 12:
          this.onCounter(new LogCounterAttack(lineSplit));
          break;
        case 15:
          this.onBattleItem(new LogBattleItem(lineSplit));
          break;
      }

      if (!this.session.paused) this.session.lastPacket = timestamp;
      // this.broadcastSessionChange();
    } catch (err) {
      logger.error(`Failed to parse log line: ${(err as Error).message}`);
    }
  }

  // logId = 0
  onMessage(packet: LogMessage): void {
    logger.info("onMessage", packet);
  }

  // logId = 1 | On: Most loading screens
  onInitEnv(packet: LogInitEnv) {
    logger.parser("Changing zone", packet);

    const player = this.getEntity(this.activeUser.id);
    if (player) player.id = packet.playerId;
    this.activeUser.id = packet.playerId;

    const boss = this.getBoss();
    if (boss && boss.currentHp >= 0) boss.currentHp = -1;

    this.resetSession(0, false, true);
    this.emit("zone-change");
  }

  // logId = 2 | On: Any encounter (with a boss?) ending, wiping or transitioning phases
  onPhaseTransition(packet: LogPhaseTransition) {
    if (packet.raidResultType === RaidResult.RAID_RESULT) return;

    const isPaused = this.session.paused;
    if (this.session.firstPacket === 0 || isPaused) {
      logger.parser("Encounter hasn't started; Skipping phase transition");
      return;
    }

    setTimeout(() => {
      logger.parser("Encounter ending", { ...this.getBoss(), skills: {} });
      this.session.paused = true;

      // Set the previous session to keep in window until a new one begins
      this.previousSession = cloneDeep(this.session);
      this.previousSession.live = false;

      this.resetSession(0, this.uploadLogs);
      this.emit("raid-end", this.previousSession);
    }, 200);
  }

  // logId = 3 | On: A new player character is found (can be the user if the meter was started after a loading screen)
  onNewPc(packet: LogNewPc) {
    let user = this.getEntity(packet.id) || this.getEntity(packet.name, true);
    if (!user) {
      logger.parser(`onNewPc: New user found`, packet);
      user = new Entity(packet);
      if (user.classId === 0) {
        user.classId = getClassId(user.class);
        user.class = getClassName(user.classId);
      }

      if (user.id === this.activeUser.id) {
        user.name = this.activeUser.name; // this.activeUser.realName;
        // this.activeUser.gearLevel = user.gearLevel;
        this.activeUser.classId = user.classId;
        this.activeUser.realName = user.name;
        logger.parser("onNewPc: Set active user details", user);
      }

      this.session.entities.push(user);
    } else {
      logger.parser("onNewPc: Updating existing PC", {
        id: user.id,
        name: user.name,
      });
      user.id = packet.id;
      user.class = packet.class;
      user.classId = packet.classId;
      user.type = EntityType.PLAYER;
      if (packet.gearLevel > 0) user.gearLevel = packet.gearLevel;

      if (packet.id === this.activeUser.id) {
        user.name = this.activeUser.name;
        // user.level = this.activeUser.level;
        // user.gearLevel = this.activeUser.gearLevel;
        logger.parser("onNewPc: Updated active user details", user);
      }

      user.lastUpdate = +new Date();
    }
  }

  // logId = 4 | On: A new non-player character is found
  onNewNpc(packet: LogNewNpc) {
    const isBoss = this.isBossEntity(packet.npcId);
    const isGuardian = this.isGuardianEntity(packet.npcId);

    if (isBoss) packet.type = EntityType.BOSS;
    else if (isGuardian) packet.type = EntityType.GUARDIAN;
    else packet.type = EntityType.MONSTER;

    // ! name is passed in korean
    if (packet.npcId === 42060070) {
      packet.name = "Ravaged Tyrant of Beasts";
      packet.id = this.valtanGhostId as string;

      this.emit("hide-hp", []);
      this.emit("show-hp", {
        bars: extraHpBars[packet.npcId].bars,
        currentHp: packet.currentHp,
        maxHp: packet.maxHp,
        bossName: packet.name,
      });
    }

    let npc = this.getEntity(packet.id) || this.getEntity(packet.name, true);
    if (npc) {
      npc.currentHp = packet.currentHp;
      npc.maxHp = packet.maxHp;
      npc.name = packet.name;
      npc.id = packet.id;

      // ? Reset misc. data if the NPC is already present (possibly wasn't expired)
      npc.skills = {};
      npc.battleItems = {};
      npc.stats = new Stats();

      npc.lastUpdate = +new Date();
      logger.parser("Updating NPC", npc);
    } else {
      npc = new Entity(packet);
      logger.parser("New NPC", npc);
      // Only persist Boss-type NPCs
      if (isBoss || isGuardian) {
        logger.parser("Persisted boss NPC", { name: npc.name, id: npc.id });
        this.session.entities.push(npc);
      }
    }

    this.hasBossEntity = this.hasBoss(this.session.entities);
  }

  // logId = 5 | On: Death of any NPC or PC
  onDeath(packet: LogDeath) {
    const target = this.getEntity(packet.id);
    const skipFilter = [EntityType.GUARDIAN, EntityType.BOSS];

    if (target && !skipFilter.includes(target.type)) {
      if (target.type === EntityType.PLAYER) {
        target.stats.deaths += 1;
        target.lastUpdate = +new Date();
      } else {
        const entityIndex = this.getEntityIndex(packet.id);
        this.session.entities.splice(entityIndex, 1);
      }
    }
  }

  // logId = 6
  onSkillStart(packet: LogSkillStart) {
    const source = this.getEntity(packet.id);
    if (source && source.type === EntityType.PLAYER) {
      source.stats.casts += 1;

      if (!(packet.skillId in source.skills)) {
        source.addSkill(
          new Skill({ id: packet.skillId, name: packet.skillName })
        );
      }
      const activeSkill = source.skills[packet.skillId];
      activeSkill.stats.casts += 1;
    }
  }

  /*
  // logId = 7
  onSkillStage(packet: LogSkillStage) {
    logger.debug("Skill Stage", { packet });
  }
  */

  // logId = 8 | On: Any damage event
  onDamage(packet: LogDamage) {
    if (Object.keys(packet).length < 13) {
      logger.warn(`onDamage is too short: ${JSON.stringify(packet)}`);
      return;
    }

    const { damageModifier } = packet;
    const hitFlag: HitFlag = damageModifier & 0xf;

    if (hitFlag === HitFlag.HIT_FLAG_INVINCIBLE) return;

    let source = this.getEntity(packet.sourceId);
    let sourceMissing = false;
    if (!source) {
      source = new Entity({ id: packet.sourceId, name: packet.sourceName });
      sourceMissing = true;
    }

    let target = this.getEntity(packet.targetId);
    if (!target) {
      target = this.getEntity(packet.targetName, true);
      if (target) {
        target.id = packet.targetId;
        target.currentHp = packet.currentHp;
        target.maxHp = packet.maxHp;
        logger.parser("onDamage: Updated target entity", {
          id: target.id,
          name: target.name,
        });
      } else return;
    }

    // Only process damage events if the target is a boss or player
    // Only process damage events if a boss is present in session
    // Don't count damage if session is paused
    if (
      target.type === EntityType.MONSTER ||
      target.type === EntityType.UNKNOWN ||
      !this.hasBossEntity ||
      this.session.paused
    ) {
      return;
    }

    target.currentHp = packet.currentHp;
    target.maxHp = packet.maxHp;

    target.lastUpdate = +new Date();
    source.lastUpdate = +new Date();

    if (
      target.type !== EntityType.PLAYER &&
      this.removeOverkillDamage &&
      packet.currentHp < 0
    ) {
      this.hasBossEntity = this.hasBoss(this.session.entities);
      packet.damage += packet.currentHp;
    }

    const isConsumable =
      projectileItems.includes(packet.skillEffectId) ||
      battleItems.includes(packet.skillEffectId);

    if (isConsumable) {
      const battleItem = source.battleItems[packet.skillEffectId];
      if (battleItem) {
        battleItem.stats.damage += packet.damage;
      } else {
        source.addBattleItem(
          new BattleItem({
            id: packet.skillEffectId,
            name: packet.skillEffect,
            stats: new BattleItemStats({ uses: 1, damage: packet.damage }),
          })
        );
      }
    } else {
      if (packet.skillId === 0 && packet.skillEffectId !== 0) {
        packet.skillId = packet.skillEffectId;
        packet.skillName = packet.skillEffect;
      }

      if (!(packet.skillId in source.skills)) {
        source.addSkill(
          new Skill({ id: packet.skillId, name: packet.skillName })
        );
      }

      const activeSkill = source.skills[packet.skillId];
      if (source.type === EntityType.PLAYER && source.classId === 0) {
        trySetClassFromSkills(source);
      }

      // Try to add a missing player
      if (
        sourceMissing &&
        source.classId === 0 &&
        source.type === EntityType.UNKNOWN
      ) {
        trySetClassFromSkills(source);
        if (source.classId !== 0) this.session.entities.push(source);
      }

      if (target.type === EntityType.PLAYER && target.classId === 0) {
        trySetClassFromSkills(target);
      }

      const hitOption: HitOption = ((damageModifier >> 4) & 0x7) - 1;

      const isCrit =
        hitFlag === HitFlag.HIT_FLAG_CRITICAL ||
        hitFlag === HitFlag.HIT_FLAG_DOT_CRITICAL;
      const isBackAttack = hitOption === HitOption.HIT_OPTION_BACK_ATTACK;
      const isFrontAttack = hitOption === HitOption.HIT_OPTION_FRONTAL_ATTACK;

      const critCount = isCrit ? 1 : 0;
      const backAttackCount = isBackAttack ? 1 : 0;
      const frontAttackCount = isFrontAttack ? 1 : 0;

      activeSkill.stats.damageDealt += packet.damage;
      if (packet.damage > activeSkill.stats.topDamage) {
        activeSkill.stats.topDamage = packet.damage;
      }

      source.stats.damageDealt += packet.damage;
      target.stats.damageTaken += packet.damage;

      source.stats.hits += 1;
      source.stats.crits += critCount;
      source.stats.backHits += backAttackCount;
      source.stats.frontHits += frontAttackCount;

      activeSkill.stats.hits += 1;
      activeSkill.stats.crits += critCount;
      activeSkill.stats.backHits += backAttackCount;
      activeSkill.stats.frontHits += frontAttackCount;

      if (source.type === EntityType.PLAYER) {
        activeSkill.breakdown?.push(
          new SkillBreakdown({
            timestamp: +new Date(),
            damage: packet.damage,
            isCrit: isCrit,
            isBackHit: isBackAttack,
            isFrontHit: isFrontAttack,
            targetEntity: target.id,
          })
        );

        this.session.damageStatistics.totalDamageDealt += packet.damage;
        this.session.damageStatistics.topDamageDealt = Math.max(
          this.session.damageStatistics.topDamageDealt,
          source.stats.damageDealt
        );
      }

      if (target.type === EntityType.PLAYER) {
        this.session.damageStatistics.totalDamageTaken += packet.damage;
        this.session.damageStatistics.topDamageTaken = Math.max(
          this.session.damageStatistics.topDamageTaken,
          target.stats.damageTaken
        );
      }
    }

    const boss = this.getBoss();
    if (this.session.firstPacket === 0) {
      logger.parser(`Starting session with possible boss: ${boss?.name}`);
      this.session.firstPacket = packet.timestamp;
      this.previousSession = undefined;

      if (boss) {
        logger.parser(`Showing HP bar for boss: ${boss.name}`, { boss });
        const isExtraBoss = boss.npcId in extraHpBars;
        if (boss.type === EntityType.GUARDIAN) {
          this.emit("show-hp", {
            bars: 1,
            currentHp: boss.currentHp,
            maxHp: boss.maxHp,
            bossName: boss.name,
          });
        } else if (isExtraBoss) {
          this.emit("show-hp", {
            bars: extraHpBars[boss.npcId].bars,
            currentHp: boss.currentHp,
            maxHp: boss.maxHp,
            bossName: boss.name,
          });
        }
      }
    }

    if (target.id === boss?.id) {
      this.emit("boss-damaged", {
        currentHp: boss.currentHp,
      });
    }
  }

  // logId = 9
  onHeal(packet: LogHeal) {
    const source = this.getEntity(packet.id);

    if (source) {
      source.lastUpdate = +new Date();
      source.stats.healing += packet.healAmount;
    }
  }

  onBuff(packet: LogBuff) {
    // ! Workaround for valtan ghost damage
    if (
      packet.buffName ===
      "하얗게 불사르고 망령화_마수군단장의 근성 감소 버프 제거 인보크 버프"
    ) {
      this.valtanGhostId = packet.sourceId;
    }
  }

  // logId = 11
  onCounter(packet: LogCounterAttack) {
    const source = this.getEntity(packet.id);

    if (source) {
      source.lastUpdate = +new Date();
      source.stats.counters += 1;
    }
  }

  // logId = 15
  onBattleItem(packet: LogBattleItem) {
    const source = this.getEntity(packet.ownerId);

    if (source && source.type === EntityType.PLAYER) {
      source.lastUpdate = +new Date();
      if (!(packet.itemId in source.battleItems)) {
        source.addBattleItem(
          new BattleItem({
            id: packet.itemId,
            name: packet.itemName,
          })
        );
      }
      const item = source.battleItems[packet.itemId];
      item.stats.uses += 1;
    }
  }

  async readEncounterFile(path: string) {
    try {
      if (this.session.firstPacket > 0) {
        logger.debug(
          `Skipping reading encounter from file: An active session is present`
        );
        return false;
      }

      const enc = await readEncounter(path);
      enc.live = false;
      enc.protocol = true;

      this.previousSession = enc;
      this.emit("raid-end", this.previousSession);
      return true;
    } catch (err) {
      logger.error(`readEncounterFile failed: ${err}`);
    }
  }
}
