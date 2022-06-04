import { getClassId, getClassName } from "../util/game-classes";
import { cloneDeep } from "lodash";
import { EventEmitter } from "events";
import {
  LogMessage,
  LogDamage,
  LogInitEnv,
  LogNewNpc,
  LogNewPc,
  LINE_SPLIT_CHAR,
  LogHeal,
  LogDeath,
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
} from "./objects";
import { getClassIdFromSkillId } from "@/util/skills";

// TODO: Time player out if they havent been updated in 10min
export const PLAYER_ENTITY_TIMEOUT = 60 * 1000 * 10;
// TODO: Time bosses out if they havent been updated in 5in
export const BOSS_ENTITY_TIMEOUT = 60 * 1000 * 5;
// TODO: Time everything else out if they havent been updated in 1min
export const DEFAULT_ENTITY_TIMEOUT = 60 * 1000 * 1;

export const tryParseInt = (intString: string, defaultValue = 0) => {
  if (typeof intString === "number") {
    if (isNaN(intString)) return defaultValue;
    return intString;
  }

  let intNum;

  try {
    intNum = parseInt(intString);
    if (isNaN(intNum)) intNum = defaultValue;
  } catch {
    intNum = defaultValue;
  }

  return intNum;
};

export class PacketParser extends EventEmitter {
  private session: Session;
  private resetTimer: ReturnType<typeof setTimeout> | undefined;
  private broadcast: ReturnType<typeof setInterval> | undefined;
  private resetOnZoneChange: boolean;
  private removeOverkillDamage: boolean;
  private pauseOnPhaseTransition: boolean;
  private hasBossEntity: boolean;
  private numberRgx = /[0-9]/g;

  // Bosses to show HP bars in meter for
  static guardians =
    /^(Argos|Ur'nil|Lumerus|Icy Legoros|Vertus|Chromanium|Nacrasena|Flame Fox Yoho|Tytalos|Dark Legoros|Helgaia|Calventus|Achates|Frost Helgaia|Lava Chromanium|Levanos|Alberhastic|Armored Nacrasena|Igrexion|Night Fox Yoho|Velganos|Deskaluda)[+]?$/g;

  // Raid bosses
  static bosses =
    /(Frenzied Cicerra|Seto|Angry Moguro Captain|Albion|Demon Beast of Destruction|Demon Beast Commander Valtan|Leader Lugaru|Destroyer Lucas|Ravaged Tyrant of Beasts|Vykas)/gi;
  // | AIRAS OCULUS        | OREHA PREVAZA             | VALTAN LEGION RAID                                                                                           | VYKAS LEGION RAID
  constructor(
    resetOnZoneChange = true,
    removeOverkillDamage = true,
    pauseOnPhaseTransition = true,
    startSending = false
  ) {
    // Extend
    super();

    // Config
    this.resetOnZoneChange = resetOnZoneChange;
    this.removeOverkillDamage = removeOverkillDamage;
    this.pauseOnPhaseTransition = pauseOnPhaseTransition;
    this.resetTimer = undefined;
    this.hasBossEntity = false;

    // Init
    this.session = new Session();

    // Start sending session information
    if (startSending) this.startBroacasting(250);
    else this.broadcast = undefined;
  }

  startBroacasting(tickRate = 100) {
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

  isBossEntity(entityName: string) {
    return PacketParser.bosses.test(entityName);
  }

  isGuardianEntity(entityName: string) {
    return PacketParser.guardians.test(entityName);
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

  resetEntities(entities: Entity[]): Entity[] {
    const reset: Entity[] = [];
    entities.forEach((entity) => {
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
        console.log(`Expiring timed out entity: ${entity.id}:${entity.name}`);
        return;
      }

      //const isDead =
      //  entity.currentHp <= 0 && entity.type !== ENTITY_TYPE.PLAYER;

      //if (isDead) {
      //  entity.currentHp = -1;
      //  entity.maxHp = -1;
      //}

      // const isUndamaged = entity.currentHp === entity.maxHp;
      // if (!isUndamaged) entity.currentHp = 0;

      entity.lastUpdate = +new Date();
      entity.stats = new Stats();
      entity.skills = {};

      reset.push(entity);
    });

    this.hasBossEntity = this.hasBoss(reset);
    return reset;
  }

  resetSession(keepEntities = true, timeout = 2000): void {
    // console.log(`Trying to reset session | keepEntities: ${keepEntities}`);
    if (this.resetTimer) {
      // console.log("Skipping reset due to timer");
      return;
    }

    this.resetTimer = setTimeout(() => {
      if (keepEntities) {
        console.log("Resetting session; Keeping valid entities");
        const resetEntities = this.resetEntities(
          cloneDeep(this.session.entities)
        );
        this.session = new Session({ entities: resetEntities });
      } else {
        console.log("Resetting session; Clearing entities");
        this.session = new Session();
      }

      this.hasBossEntity = this.hasBoss(this.session.entities);
      this.resetTimer = undefined;

      this.emit("reset-session", this.session);
    }, timeout);
  }

  pauseSession() {
    console.log("Pausing session");
    this.session.paused = true;
    this.emit("pause-session", this.session);
  }

  resumeSession() {
    console.log("Resuming session");
    this.session.paused = false;
    this.emit("resume-session", this.session);
  }

  removeSkillHistory() {
    const clone = cloneDeep(this.session);
    clone.entities.forEach((entity) => {
      const skills = entity.skills;
      Object.keys(skills).forEach((skillId) => {
        entity.skills[skillId].breakdown = [];
      });
    });

    return clone;
  }

  hasBoss(entities: Entity[]) {
    return entities.some(
      (entity) =>
        (entity.type === ENTITY_TYPE.BOSS ||
          entity.type === ENTITY_TYPE.GUARDIAN) &&
        entity.currentHp > 0
    );
  }

  broadcastSessionChange() {
    const smaller = this.removeSkillHistory(); // Omit skill history for a smaller session object
    this.emit("session-change", smaller);
  }

  parse(line: string) {
    if (!line) {
      console.log("Empty line");
      return;
    }

    const lineSplit = line.trim().split(LINE_SPLIT_CHAR);
    if (lineSplit.length < 1 || !lineSplit[0]) {
      console.log(`Invalid line: ${lineSplit}`);
      return;
    }
    try {
      const logType = tryParseInt(lineSplit[0]);
      const timestamp = +new Date(lineSplit[1]);

      switch (logType) {
        case 0:
          this.onMessage(new LogMessage(lineSplit));
          break;
        case 1:
          this.onInitEnv(new LogInitEnv(lineSplit));
          break;
        case 2:
          // this.onPhaseTransition(new LogPhaseTransition(lineSplit));
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
      console.error(`Failed to parse log line: ${(err as Error).message}`);
    }
  }

  // logId = 0
  onMessage(packet: LogMessage): void {
    console.log(`Received message: ${packet.message}`);
  }

  // logId = 1 | On: Most loading screens
  onInitEnv(packet: LogInitEnv) {
    console.log(
      `onInitEnv: ${JSON.stringify(packet)} | ${this.resetOnZoneChange}`
    );
    if (this.resetOnZoneChange && !this.resetTimer) {
      console.log("Starting session reset on zone change");
      this.resetSession(false);
    }
  }

  // logId = 2 | On: Any encounter (with a boss?) ending, wiping or transitioning phases
  onPhaseTransition(packet: LogPhaseTransition) {
    // Inconsistent, will need to improve once logger is more stable

    const isPaused = this.session.paused;

    switch (packet.raidResultType) {
      case RAID_RESULT.WIPE:
        // End and reset on wipes
        setTimeout(() => {
          this.session.paused = true;
          this.emit("raid-end", this.session);
        }, 200);

        this.resetSession(true, 2000);
        break;
      case RAID_RESULT.END:
      case RAID_RESULT.DEAD:
        // Pause on end or reset if configured
        if (this.pauseOnPhaseTransition && !isPaused) {
          if (this.session.firstPacket === 0) {
            console.log("Encounter hasn't started; Skipping pause");
            return;
          }

          // Delay firing of event to allow for last damage packet to be processed
          setTimeout(() => {
            this.session.paused = true;
            this.emit("raid-end", this.session);
          }, 200);
        } else {
          this.resetSession(true, 4000);
        }
        break;
      default:
        // foo wtf reset anyway
        this.resetSession(true, 4000);
        break;
    }
  }

  // logId = 3 | On: A new player character is found (can be the user if the meter was started after a loading screen)
  onNewPc(packet: LogNewPc) {
    // console.log(`onNewPc`);

    if (packet.id === packet.name) {
      console.log(
        `New PC identifier (${packet.id}) and name (${packet.name}) are equal, skipping`
      );
      return;
    }

    // Fall back to name if ID isn't found as a special case check
    // Sometimes player ID will change randomly during run, this is the fallback
    let user = this.getEntity(packet.id) || this.getEntity(packet.name, true);
    if (!user) {
      console.log(`Adding new user: ${packet.id}:${packet.name}`);
      user = new Entity(packet);
      if (user.classId === 0 && user.class !== "Unknown Class") {
        user.classId = getClassId(user.class);
        user.class = getClassName(user.classId);
      }

      this.session.entities.push(user);
    } else {
      console.log(`Updating existing user ${packet.id}:${packet.name}`);
      user.currentHp = packet.currentHp;
      user.maxHp = packet.maxHp;
      user.id = packet.id;
      user.lastUpdate = +new Date();
    }

    this.emit("new-pc", user);
  }

  // logId = 4 | On: A new non-player character is found
  onNewNpc(packet: LogNewNpc) {
    // console.log(`onNewNpc`);

    const isBoss = this.isBossEntity(packet.name);
    const isGuardian = this.isGuardianEntity(packet.name);

    if (isBoss) packet.type = ENTITY_TYPE.BOSS;
    else if (isGuardian) packet.type = ENTITY_TYPE.GUARDIAN;
    else packet.type = ENTITY_TYPE.MONSTER;

    // NPC IDs don't seem to change like player IDs, keeping this for now
    let npc = this.getEntity(packet.id);
    if (npc) {
      // console.log(`Updating existing npc: ${packet.id}:${packet.name}`);
      npc.id = packet.id;
      npc.currentHp = packet.currentHp;
      npc.maxHp = packet.maxHp;
    } else {
      // console.log(`Adding new npc: ${packet.id}:${packet.name}`);
      npc = new Entity(packet);
      this.session.entities.push(npc);
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
        // console.log(`Entity ${packet.id}:${packet.name} died; Removing`);
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
      console.log(`onDamage is too short: ${JSON.stringify(packet)}`);
      return;
    }

    // Fallback to name if ID isn't found as a special case check
    let source =
      this.getEntity(packet.sourceId) ||
      this.getEntity(packet.sourceName, true);
    if (!source) {
      console.log("Source unknown", packet.sourceName, packet.sourceId);

      const isGuardian = this.isGuardianEntity(packet.sourceName);
      const isBoss = this.isBossEntity(packet.sourceName);

      let sourceType = ENTITY_TYPE.UNKNOWN;
      if (isGuardian) sourceType = ENTITY_TYPE.GUARDIAN;
      else if (isBoss) sourceType = ENTITY_TYPE.BOSS;

      source = new Entity({
        id: packet.sourceId,
        name: packet.sourceName,
        type: sourceType,
        classId: 0,
      });

      if (packet.sourceId !== packet.sourceName) {
        this.session.entities.push(source);
      }
    } else {
      // console.log("Source known", source.name, source.id, source.type);
      const entitySkills = Object.values(source.skills);
      if (source.classId === 0 && entitySkills.length > 0) {
        entitySkills.every((skill) => {
          const classId = getClassIdFromSkillId(skill.id);
          if (classId !== 0) {
            (source as Entity).classId = classId;
            (source as Entity).class = getClassName(classId);
            (source as Entity).type = ENTITY_TYPE.PLAYER;
            console.log(
              `Unknown entity ${(source as Entity).id} was detected as class: ${
                (source as Entity).class
              }`
            );
            return false;
          }
          return true;
        });
      }

      if (source.type === ENTITY_TYPE.UNKNOWN) {
        const isGuardian = this.isGuardianEntity(packet.sourceName);
        const isBoss = this.isBossEntity(packet.sourceName);

        if (isGuardian) source.type = ENTITY_TYPE.GUARDIAN;
        else if (isBoss) source.type = ENTITY_TYPE.BOSS;
      }

      source.lastUpdate = +new Date();
    }

    let target =
      this.getEntity(packet.targetId) ||
      this.getEntity(packet.targetName, true);
    if (!target) {
      console.log("Target unknown", packet.targetName, packet.targetId);

      const isGuardian = this.isGuardianEntity(packet.targetName);
      const isBoss = this.isBossEntity(packet.targetName);

      let sourceType = ENTITY_TYPE.UNKNOWN;
      if (isGuardian) sourceType = ENTITY_TYPE.GUARDIAN;
      else if (isBoss) sourceType = ENTITY_TYPE.BOSS;

      target = new Entity({
        id: packet.targetId,
        name: packet.targetName,
        type: sourceType,
        classId: 0,
        currentHp: packet.currentHp,
        maxHp: packet.maxHp,
      });

      if (packet.targetId !== packet.targetName) {
        this.session.entities.push(target);
        this.hasBossEntity = this.hasBoss(this.session.entities);
      }
    } else {
      // console.log("Target known", target.name, target.id, target.type);
      target.id = packet.targetId;
      target.currentHp = packet.currentHp;
      target.maxHp = packet.maxHp;
      target.lastUpdate = +new Date();
    }

    // Only process damage events if a boss is present in session
    if (!this.hasBossEntity) {
      console.log("No boss entity found, skipping damage event");
      return;
    }

    // Don't count damage if session is paused
    if (this.session.paused) {
      console.log("Session is paused, skipping damage event");
      return;
    }

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

    // TODO: **should** remove insanely high bleed ticks or broken damage from grenades
    if (
      (packet.skillName === "Bleed" || packet.skillId === 0) &&
      packet.damage > 1000000
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

    activeSkill.breakdown.push(
      new SkillBreakdown({
        timestamp: +new Date(),
        damage: packet.damage,
        isCrit: packet.isCrit,
        isBackHit: packet.isBackAttack,
        isFrontHit: packet.isFrontAttack,
        targetEntity: target.id,
      })
    );

    if (source.type === ENTITY_TYPE.PLAYER) {
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

    if (this.session.firstPacket === 0)
      this.session.firstPacket = packet.timestamp;
  }

  // logId = 9
  onHeal(packet: LogHeal) {
    // console.log(`onHeal: ${JSON.stringify(packet)}`);
    const target = this.getEntity(packet.name, true);

    if (target) {
      target.lastUpdate = +new Date();
      target.stats.healing += packet.healAmount;
    }
  }

  // logId = 11
  onCounter(packet: LogCounterAttack) {
    // console.log(`onCounter: ${JSON.stringify(packet)}`);
    const target = this.getEntity(packet.name, true);

    if (target) {
      target.lastUpdate = +new Date();
      target.stats.counters += 1;
    }
  }
}
