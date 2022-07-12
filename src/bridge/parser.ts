import log from "electron-log";
import { getClassId, getClassName } from "@/util/game-classes";
import { cloneDeep } from "lodash";
import { EventEmitter } from "events";
import {
  RAID_RESULT,
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

const isDevelopment = process.env.NODE_ENV !== "production";

// TODO: Time player out if they havent been updated in 5min
export const PLAYER_ENTITY_TIMEOUT = 60 * 1000 * 5;
// TODO: Time bosses out if they havent been updated in 5min
export const BOSS_ENTITY_TIMEOUT = 60 * 1000 * 5;
// TODO: Time everything else out if they havent been updated in 1min
export const DEFAULT_ENTITY_TIMEOUT = 60 * 1000 * 1;
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

  constructor(config: PacketParserConfig = {}) {
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
      let timeout = DEFAULT_ENTITY_TIMEOUT;
      switch (entity.type) {
        case ENTITY_TYPE.PLAYER:
          timeout = PLAYER_ENTITY_TIMEOUT;
          break;
        case ENTITY_TYPE.BOSS:
        case ENTITY_TYPE.GUARDIAN:
          timeout = BOSS_ENTITY_TIMEOUT;
          break;
      }

      if (+new Date() - entity.lastUpdate > timeout) {
        log.debug(`Expiring timed out entity: ${entity.id}:${entity.name}`);
        continue;
      }

      if (entity.currentHp <= 0) {
        log.debug(`Expiring dead entity: ${entity.id}:${entity.name}`);
        continue;
      }

      if (
        entity.type === ENTITY_TYPE.MONSTER ||
        entity.type === ENTITY_TYPE.UNKNOWN
      ) {
        log.debug(
          `Expiring unknown/monster entity: ${entity.id}:${entity.name}`
        );
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

  resetSession(keepEntities = true, timeout = 2000, upload = true): void {
    log.info(`Resetting session | keepEntities: ${keepEntities}`);
    if (this.resetTimer) return;

    if (this.hasBoss(this.session.entities, false)) {
      const clone = cloneDeep(this.session);
      clone.cleanEntities();

      clone.damageStatistics.dps = getTotalDps(clone);
      clone.entities.forEach((e) => {
        e.stats.dps = getEntityDps(e, clone.firstPacket, clone.lastPacket);
      });

      log.info("Boss is present; Saving encounter");
      saveEncounter(clone, true, "gzip", isDevelopment).catch((err) => {
        log.error("Failed to save encounter", err);
      });

      const isSessionValid = validateUpload(clone);
      if (upload && isSessionValid) {
        log.info("Uploading encounter");
        uploadSession(clone)
          .then((d) => {
            const uploadedId = d.id;
            log.info("Uploaded encounter", uploadedId);
            if (this.openUploadInBrowser) openInBrowser(uploadedId);
          })
          .catch((err) => {
            log.error("Failed to upload session", err.message);
          });
      }
    }

    this.resetTimer = setTimeout(() => {
      if (keepEntities) {
        const resetEntities = this.resetEntities(
          cloneDeep(this.session.entities)
        );
        this.session = new Session({ entities: resetEntities });
      } else {
        this.session = new Session();
      }

      this.hasBossEntity = this.hasBoss(this.session.entities);
      this.resetTimer = undefined;

      log.debug("Reset session");
      this.emit("reset-session", this.session.toSimpleObject());
    }, timeout);
  }

  resetPrevious() {
    this.previousSession = undefined;
  }

  pauseSession() {
    log.debug("Pausing session");
    this.session.paused = true;
    this.emit("pause-session", this.session.toSimpleObject());
  }

  resumeSession() {
    log.debug("Resuming session");
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
      log.warn("Empty line");
      return;
    }

    const lineSplit = line.trim().split(LINE_SPLIT_CHAR);
    if (lineSplit.length < 1 || !lineSplit[0]) {
      log.warn(`Invalid line: ${lineSplit}`);
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
      log.error(`Failed to parse log line: ${(err as Error).message}`);
    }
  }

  // logId = -1
  onMessage(packet: LogMessage): void {
    log.info(`Received message: ${packet.message}`);
  }

  // logId = 0
  onInitPc(packet: LogInitPc): void {
    this.activeUser.id = packet.id;
    this.activeUser.classId = packet.classId;
    this.activeUser.level =
      packet.level > 60 || packet.level < 0 ? 0 : packet.level;
    this.activeUser.realName = packet.name;
    this.activeUser.gearLevel = packet.gearLevel;
    log.info("InitPC: Updated current user information", this.activeUser);
  }

  // logId = 1 | On: Most loading screens
  onInitEnv(packet: LogInitEnv) {
    log.debug(`onInitEnv: Updating active user ID: ${packet.playerId}`);
    this.activeUser.id = packet.playerId;

    if (this.resetOnZoneChange) {
      if (this.resetTimer) {
        clearTimeout(this.resetTimer);
        this.resetTimer = undefined;
      }

      this.resetSession(true, 0, false);
    }
  }

  // logId = 2 | On: Any encounter (with a boss?) ending, wiping or transitioning phases
  // Also weirdly enough is sent when ALT+Q menu is opened
  onPhaseTransition(packet: LogPhaseTransition) {
    // Inconsistent, will need to improve once logger is more stable
    // log.info("Phase transition", JSON.stringify(packet));
    if (packet.raidResultType === RAID_RESULT.RAID_RESULT) {
      log.debug("onPhaseTransition: Ignoring raid result packet");
      return;
    }

    const isPaused = this.session.paused;
    if (this.session.firstPacket === 0 || isPaused) {
      log.debug("Encounter hasn't started; Skipping reset");
      return;
    }

    let keepEntities: boolean;
    switch (packet.raidResultType) {
      case RAID_RESULT.RAID_END: // TODO: Probably better to call this "RAID_RESULT" since it procs on raids ending unsuccessfully
        keepEntities = true;
        break;
      // case RAID_RESULT.RAID_RESULT:
      case RAID_RESULT.GUARDIAN_DEAD:
        keepEntities = false;
        break;
      default:
        keepEntities = false;
        break;
    }

    // Delay firing of event to allow for last damage packet to be processed
    // Phase packet is sent before/simulatenously with the last damage packet
    setTimeout(() => {
      this.session.paused = true;

      // Set the previous session to keep in window until a new one begins
      this.previousSession = cloneDeep(this.session);
      this.previousSession.live = false;

      this.resetSession(keepEntities, 0, this.uploadLogs);
      this.emit("raid-end", this.previousSession);
    }, 100);
  }

  // logId = 3 | On: A new player character is found (can be the user if the meter was started after a loading screen)
  onNewPc(packet: LogNewPc) {
    if (packet.id === packet.name) {
      log.debug(
        `New PC identifier (${packet.id}) and name (${packet.name}) are equal, skipping`
      );
      return;
    }

    let user = this.getEntity(packet.id) || this.getEntity(packet.name, true);
    if (!user) {
      user = new Entity(packet);
      if (user.classId === 0) {
        user.classId = getClassId(user.class);
        user.class = getClassName(user.classId);
      }

      if (user.id === this.activeUser.id) {
        log.debug("onNewPc: Setting active user details");
        user.name = this.activeUser.name; // this.activeUser.realName;
        user.level = this.activeUser.level;
        user.gearLevel = this.activeUser.gearLevel;
      }

      this.session.entities.push(user);
    } else {
      log.debug(`onNewPc: Updating existing PC ${packet.id}:${packet.name}`);
      user.id = packet.id;
      user.class = packet.class;
      user.classId = packet.classId;
      user.type = ENTITY_TYPE.PLAYER;

      if (user.id === this.activeUser.id) {
        log.debug("onNewPc: Updating active user details");
        user.name = this.activeUser.name;
        user.level = this.activeUser.level;
        user.gearLevel = this.activeUser.gearLevel;
      }

      user.lastUpdate = +new Date();
    }

    this.emit("new-pc", user);
  }

  // logId = 4 | On: A new non-player character is found
  onNewNpc(packet: LogNewNpc) {
    const isBoss = this.isBossEntity(packet.npcId);
    const isGuardian = this.isGuardianEntity(packet.npcId);

    if (isBoss) packet.type = ENTITY_TYPE.BOSS;
    else if (isGuardian) packet.type = ENTITY_TYPE.GUARDIAN;
    else packet.type = ENTITY_TYPE.MONSTER;

    let npc = this.getEntity(packet.id);
    if (npc) {
      npc.currentHp = packet.currentHp;
      npc.maxHp = packet.maxHp;
      npc.name = packet.name;
    } else {
      npc = new Entity(packet);
      // Only persist Boss-type NPCs
      if (npc.type === ENTITY_TYPE.BOSS || npc.type === ENTITY_TYPE.GUARDIAN) {
        this.session.entities.push(npc);
      }
    }

    this.hasBossEntity = this.hasBoss(this.session.entities);
    this.emit("new-npc", npc);
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
      log.warn(`onDamage is too short: ${JSON.stringify(packet)}`);
      return;
    }

    const source = this.getEntity(packet.sourceId);
    const target = this.getEntity(packet.targetId);

    if (!source || !target) {
      // log.debug(`onDamage: Source or Target entity not found: ${packet.sourceId}`);
      return;
    }

    if (source.type === ENTITY_TYPE.PLAYER && source.classId === 0) {
      trySetClassFromSkills(source);
    }

    if (target.type === ENTITY_TYPE.PLAYER && target.classId === 0) {
      trySetClassFromSkills(target);
    }

    // Only process damage events if the target is a boss
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

    if (this.session.firstPacket === 0) {
      this.session.firstPacket = packet.timestamp;
      this.previousSession = undefined;
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
        log.debug(
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
      log.error(`readEncounterFile failed: ${err}`);
    }
  }
}
