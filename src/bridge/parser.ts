import { logger } from "@/util/logging";
import { getClassId, getClassName } from "@/util/game-classes";
import { cloneDeep } from "lodash";
import { EventEmitter } from "events";
import {
  LINE_SPLIT_CHAR,
  LogHeal,
  LogDeath,
  LogNewPc,
  LogInitPc,
  LogDamage,
  LogNewNpc,
  LogInitEnv,
  LogMessage,
  LogCounterAttack,
  LogPhaseTransition,
  RAID_RESULT,
} from "./log-lines";
import {
  Entity,
  ENTITY_TYPE,
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
import { abyssRaids, guardians, raidBosses } from "@/util/supported-bosses";
import AppStore from "@/persistance/store";

const isDevelopment = process.env.NODE_ENV !== "production";

// TODO: Time player out if they havent been updated in 25min
export const PLAYER_ENTITY_TIMEOUT = 60 * 1000 * 25;
// TODO: Time bosses out if they havent been updated in 25min
export const BOSS_ENTITY_TIMEOUT = 60 * 1000 * 25;
// TODO: Time everything else out if they havent been updated in 30min
export const DEFAULT_ENTITY_TIMEOUT = 60 * 1000 * 30;
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
}

export class PacketParser extends EventEmitter {
  private session: Session;
  private resetTimer: ReturnType<typeof setTimeout> | undefined;
  private broadcast: ReturnType<typeof setInterval> | undefined;
  private resetOnZoneChange: boolean;
  private removeOverkillDamage: boolean;
  private pauseOnPhaseTransition: boolean;
  private uploadLogs: boolean;
  private openUploadInBrowser: boolean;
  private hasBossEntity: boolean;
  private previousSession: Session | undefined;
  private activeUser: ActiveUser;
  private appStore: AppStore;

  constructor(appStore: AppStore, config: PacketParserConfig = {}) {
    // Extend
    super();

    // Config
    this.resetOnZoneChange = config.resetOnZoneChange || true;
    this.removeOverkillDamage = config.removeOverkillDamage || true;
    this.pauseOnPhaseTransition = config.pauseOnPhaseTransition || true;
    this.uploadLogs = config.uploadLogs || false;
    this.openUploadInBrowser = config.openUploadInBrowser || false;
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
    this.session = new Session();

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

  setPauseOnPhaseTransition(pauseOnPhaseTransition: boolean) {
    this.pauseOnPhaseTransition = pauseOnPhaseTransition;
  }

  setResetOnZoneChange(resetOnZoneChange: boolean) {
    this.resetOnZoneChange = resetOnZoneChange;
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

  resetEntities(entities: Entity[]): Entity[] {
    const reset: Entity[] = [];
    for (const entity of entities) {
      const timeout = DEFAULT_ENTITY_TIMEOUT;

      if (+new Date() - entity.lastUpdate > timeout) {
        logger.parser("Expiring timed out entity", {
          id: entity.id,
          name: entity.name,
        });
        continue;
      }

      if (entity.type !== ENTITY_TYPE.PLAYER && entity.currentHp <= 0) {
        logger.parser("Expiring dead boss/monster entity", {
          id: entity.id,
          name: entity.name,
        });
        continue;
      }

      if (
        entity.type === ENTITY_TYPE.MONSTER ||
        entity.type === ENTITY_TYPE.UNKNOWN
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
      this.session = new Session({ entities: resetEntities });

      this.hasBossEntity = this.hasBoss(this.session.entities);
      this.resetTimer = undefined;

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
        (entity.type === ENTITY_TYPE.BOSS ||
          entity.type === ENTITY_TYPE.GUARDIAN) &&
        (mustBeAlive ? entity.currentHp > 0 : true)
    );
  }

  getBoss() {
    const bosses = this.session.entities.filter(
      (entity) =>
        entity.type === ENTITY_TYPE.BOSS || entity.type === ENTITY_TYPE.GUARDIAN
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
        case -1:
          this.onMessage(new LogMessage(lineSplit));
          break;
        case 0:
          this.onInitPc(new LogInitPc(lineSplit));
          break;
        case 1:
          this.onInitEnv(new LogInitEnv(lineSplit));
          this.emit("zone-change");
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
        /* case 6:
        this.onSkillStart(lineSplit);
        break;
        case 7:
        this.onSkillStage(lineSplit);
        break; */
        case 8:
          this.onDamage(new LogDamage(lineSplit));
          break;
        case 9:
          this.onHeal(new LogHeal(lineSplit));
          break;
        /* case 10:
        this.onBuff(lineSplit);
        break; */
        case 11:
          this.onCounter(new LogCounterAttack(lineSplit));
          break;
      }

      if (!this.session.paused) this.session.lastPacket = timestamp;
      // this.broadcastSessionChange();
    } catch (err) {
      logger.error(`Failed to parse log line: ${(err as Error).message}`);
    }
  }

  // logId = -1
  onMessage(packet: LogMessage): void {
    logger.info("onMessage", packet);
  }

  // logId = 0
  onInitPc(packet: LogInitPc): void {
    logger.parser("onInitPc", packet);

    this.activeUser.id = packet.id;
    this.activeUser.classId = packet.classId;
    this.activeUser.level =
      packet.level > 60 || packet.level < 0 ? 0 : packet.level;
    this.activeUser.realName = packet.name;
    this.activeUser.gearLevel = packet.gearLevel;
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
  }

  // logId = 2 | On: Any encounter (with a boss?) ending, wiping or transitioning phases
  // Also weirdly enough is sent when ALT+Q menu is opened
  onPhaseTransition(packet: LogPhaseTransition) {
    // Inconsistent, will need to improve once logger is more stable
    logger.parser("Phase transition", packet);
    if (packet.raidResultType === RAID_RESULT.RAID_RESULT) {
      logger.parser("Phase transition ignoring raid result packet");
      return;
    }

    const isPaused = this.session.paused;
    if (this.session.firstPacket === 0 || isPaused) {
      logger.parser("Encounter hasn't started; Skipping reset");
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
    }, 50);
  }

  // logId = 3 | On: A new player character is found (can be the user if the meter was started after a loading screen)
  onNewPc(packet: LogNewPc) {
    if (packet.id === packet.name) {
      logger.parser(
        `New PC identifier (${packet.id}) and name (${packet.name}) are equal, skipping`,
        packet
      );
      return;
    }

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
        user.level = this.activeUser.level;
        user.gearLevel = this.activeUser.gearLevel;
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
      user.type = ENTITY_TYPE.PLAYER;

      if (packet.id === this.activeUser.id) {
        user.name = this.activeUser.name;
        user.level = this.activeUser.level;
        user.gearLevel = this.activeUser.gearLevel;
        logger.parser("onNewPc: Updated active user details", user);
      }

      user.lastUpdate = +new Date();
    }
  }

  // logId = 4 | On: A new non-player character is found
  onNewNpc(packet: LogNewNpc) {
    const isBoss = this.isBossEntity(packet.npcId);
    const isGuardian = this.isGuardianEntity(packet.npcId);

    if (isBoss) packet.type = ENTITY_TYPE.BOSS;
    else if (isGuardian) packet.type = ENTITY_TYPE.GUARDIAN;
    else packet.type = ENTITY_TYPE.MONSTER;

    let npc = this.getEntity(packet.id) || this.getEntity(packet.name, true);
    if (npc) {
      npc.currentHp = packet.currentHp;
      npc.maxHp = packet.maxHp;
      npc.name = packet.name;
      npc.id = packet.id;
      npc.lastUpdate = +new Date();
      logger.parser("Updating NPC", npc);
    } else {
      npc = new Entity(packet);
      logger.parser("New NPC", npc);
      // Only persist Boss-type NPCs
      if (isBoss || isGuardian) {
        logger.parser("Persisted boss NPC");
        this.session.entities.push(npc);
      }
    }

    this.hasBossEntity = this.hasBoss(this.session.entities);
  }

  // logId = 5 | On: Death of any NPC or PC
  onDeath(packet: LogDeath) {
    const target = this.getEntity(packet.id);
    const skipFilter = [ENTITY_TYPE.GUARDIAN, ENTITY_TYPE.BOSS];

    if (target && !skipFilter.includes(target.type)) {
      if (target.type === ENTITY_TYPE.PLAYER) {
        target.stats.deaths += 1;
        target.lastUpdate = +new Date();
      } else {
        const entityIndex = this.getEntityIndex(packet.id);
        this.session.entities.splice(entityIndex, 1);
      }
    }
  }

  /* // logId = 6
  onSkillStart(lineSplit) {
    // TODO:
  }

  // logId = 7
  onSkillStage(lineSplit) {
    // TODO:
  } */

  // logId = 8 | On: Any damage event
  onDamage(packet: LogDamage) {
    if (Object.keys(packet).length < 16) {
      logger.warn(`onDamage is too short: ${JSON.stringify(packet)}`);
      return;
    }

    let source = this.getEntity(packet.sourceId);
    let sourceMissing = false;
    if (!source) {
      source = new Entity({ id: packet.sourceId, name: packet.sourceName });
      sourceMissing = true;
    }

    const target = this.getEntity(packet.targetId);
    logger.debug("onDamage", { source, target, packet });
    if (!target) return;

    // Only process damage events if the target is a boss or player
    // Only process damage events if a boss is present in session
    // Don't count damage if session is paused
    if (
      target.type === ENTITY_TYPE.MONSTER ||
      target.type === ENTITY_TYPE.UNKNOWN ||
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
      target.type !== ENTITY_TYPE.PLAYER &&
      this.removeOverkillDamage &&
      packet.currentHp < 0
    ) {
      this.hasBossEntity = this.hasBoss(this.session.entities);
      packet.damage += packet.currentHp;
    }

    if (!(packet.skillId in source.skills)) {
      source.addSkill(
        packet.skillId,
        new Skill({ id: packet.skillId, name: packet.skillName })
      );
    }
    const activeSkill: Skill = source.skills[packet.skillId];

    if (source.type === ENTITY_TYPE.PLAYER && source.classId === 0) {
      trySetClassFromSkills(source);
    }

    // Try to add a missing player
    if (
      sourceMissing &&
      source.classId === 0 &&
      source.type === ENTITY_TYPE.UNKNOWN
    ) {
      trySetClassFromSkills(source);
      if (source.classId !== 0) {
        if (/\d/.test(source.name) || source.name === "Unknown Entity") {
          source.name = source.class;
        }
        this.session.entities.push(source);
      }
    }

    if (target.type === ENTITY_TYPE.PLAYER && target.classId === 0) {
      trySetClassFromSkills(target);
    }

    /*
    if (
      source.type === ENTITY_TYPE.PLAYER &&
      packet.skillId === 0 &&
      packet.skillEffectId !== 0
    ) {
      logger.parser(
        `onDamage: ${source.id}:${source.name} => Unknown skill with effect: ${packet.skillEffectId}:${packet.skillEffect}`
      );
    }
    */

    // Test removing broken damage from Valtan Gate 1 fight
    if (
      (packet.skillName === "Bleed" || packet.skillId === 0) &&
      [480005, 480006, 480009, 480010, 480011, 480026, 480031, 480032].includes(
        target.npcId
      )
    )
      return;

    const critCount = packet.isCrit ? 1 : 0;
    const backAttackCount = packet.isBackAttack ? 1 : 0;
    const frontAttackCount = packet.isFrontAttack ? 1 : 0;

    activeSkill.stats.damageDealt += packet.damage;
    if (packet.damage > activeSkill.stats.topDamage)
      activeSkill.stats.topDamage = packet.damage;

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

    if (source.type === ENTITY_TYPE.PLAYER) {
      activeSkill.breakdown?.push(
        new SkillBreakdown({
          timestamp: +new Date(),
          damage: packet.damage,
          isCrit: packet.isCrit,
          isBackHit: packet.isBackAttack,
          isFrontHit: packet.isFrontAttack,
          targetEntity: target.id,
        })
      );

      this.session.damageStatistics.totalDamageDealt += packet.damage;
      this.session.damageStatistics.topDamageDealt = Math.max(
        this.session.damageStatistics.topDamageDealt,
        source.stats.damageDealt
      );
    }

    if (target.type === ENTITY_TYPE.PLAYER) {
      this.session.damageStatistics.totalDamageTaken += packet.damage;
      this.session.damageStatistics.topDamageTaken = Math.max(
        this.session.damageStatistics.topDamageTaken,
        target.stats.damageTaken
      );
    }

    const boss = this.getBoss();
    if (this.session.firstPacket === 0) {
      logger.parser(`Starting session with boss: ${boss?.name}`, { boss });
      this.session.firstPacket = packet.timestamp;
      this.previousSession = undefined;

      if (boss && boss.type === ENTITY_TYPE.GUARDIAN) {
        logger.parser(`Showing HP bar for boss: ${boss.name}`, { boss });
        this.emit("show-hp", {
          bars: 1,
          currentHp: boss.currentHp,
          maxHp: boss.maxHp,
          bossName: boss.name,
        });
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

  // logId = 11
  onCounter(packet: LogCounterAttack) {
    const source =
      this.getEntity(packet.id) || this.getEntity(packet.name, true);

    if (source) {
      source.lastUpdate = +new Date();
      source.stats.counters += 1;
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
