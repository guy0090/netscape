import { logger } from "@/util/logging";
import ms from "ms";
import { Entity, Session, SkillBreakdown } from "@/encounters/objects";
import AppStore from "@/persistance/store";
// import AppStore from "@/persistance/store";
import axios from "axios";
import { shell } from "electron";
import { cloneDeep } from "lodash";
import { EntityType } from "@/bridge/log-lines";
export const UPLOAD_URL = process.env.VUE_APP_UPLOAD_URL;
export const SITE_URL = process.env.VUE_APP_LOGS_URL;

export const DATA_INTERVAL = ms("5s");
export const UPLOAD_ENDPOINT = "/logs/upload";
export const RECENT_ENDPOINT = "/logs/recents";

export const uploadSession = async (appStore: AppStore, session: Session) => {
  session = cloneDeep(session);
  try {
    const uploadKey = await appStore.getPassword();

    const bosses = session.entities.filter(
      (e) => e.type === EntityType.BOSS || e.type === EntityType.GUARDIAN
    );
    // If multiple bosses are logged, only keep the most recent one
    if (bosses.length > 1) {
      const filtered = bosses
        .sort((a, b) => b.lastUpdate - a.lastUpdate)
        .slice(1)
        .map((e) => e.id);

      session.entities = session.entities.filter(
        (e) => !filtered.includes(e.id)
      );
    }

    // Generate data intervals
    const intervals = generateIntervals(
      session.firstPacket,
      session.lastPacket
    );
    session.damageStatistics.dpsIntervals = intervals;

    // Create DPS over time data for ECharts for each player entity
    for (const e of session.entities) {
      if (e.type === EntityType.PLAYER) {
        e.stats.dpsOverTime = getEntityData(intervals, e, session.firstPacket);
      }
    }

    // Remove breakdowns; Not needed anymore
    session.entities.forEach((e) => {
      Object.values(e.skills).forEach((s) => {
        delete s.breakdown;
      });
    });

    // TODO: Temporary, add option soon
    session.unlisted = true;
    const upload = { key: uploadKey, data: session };

    const response = await axios.post(
      `${UPLOAD_URL}${UPLOAD_ENDPOINT}`,
      upload
    );
    return response.data;
  } catch (err) {
    logger.error("Error during log upload", err);
    throw err;
  }
};

export const validateUpload = (session: Session) => {
  session = cloneDeep(session);

  if (session.firstPacket <= 0 || session.lastPacket <= 0) {
    logger.debug("Validating upload failed: session duration is invalid");
    return false;
  }

  const entities = session.entities;
  const bossEntities = entities.filter(
    (entity) =>
      entity.type === EntityType.BOSS || entity.type === EntityType.GUARDIAN
  );
  const playerEntities = entities.filter(
    (entity) => entity.type === EntityType.PLAYER
  );

  const hasBoss = bossEntities.length > 0;
  if (!hasBoss) {
    logger.debug("Validating upload failed: no boss found");
    return false;
  }

  const hasPlayers = playerEntities.length > 0;
  if (!hasPlayers) {
    logger.debug("Validating upload failed: no players found");
    return false;
  }

  const allPlayersHaveSkills = playerEntities.every((e) => e.skills);

  if (!allPlayersHaveSkills) {
    logger.debug(
      "Validating upload failed: one or more players have no skills"
    );
    return false;
  }

  const mostRecentDamaged = bossEntities.sort(
    (a, b) => b.lastUpdate - a.lastUpdate
  )[0];

  if (mostRecentDamaged.lastUpdate + 1000 * 60 * 10 < +new Date()) {
    logger.debug(
      "Validating upload failed: boss was not damaged in last 10 minutes"
    );
    return false;
  }

  if (mostRecentDamaged.currentHp > 0) {
    logger.debug(
      "Validating upload failed: boss is still alive (possibly a wipe?)"
    );
    return false;
  }

  return true;
};

export const openInBrowser = (id: string) => {
  const url = `${SITE_URL}/logs/${id}`;
  shell.openExternal(url);
};

export const getEntityDamageInRange = (
  begin: number,
  end: number,
  entity: Entity
) => {
  const skills = Object.values(entity.skills);
  const damageDealtInRange = skills.reduce((acc, skill) => {
    const skillEntries = (skill.breakdown as SkillBreakdown[]).filter(
      (d) => d.timestamp >= begin && d.timestamp <= end
    );
    return acc + skillEntries.reduce((acc, d) => acc + d.damage, 0);
  }, 0);

  if (!damageDealtInRange || isNaN(damageDealtInRange)) return 0;
  return damageDealtInRange;
};

export const getEntityDPS = (duration: number, damage: number) => {
  return damage > 0 ? (damage / duration).toFixed(2) : "0";
};

export const generateIntervals = (started: number, ended: number) => {
  const duration = ended - started;
  const intervals = [];

  const parts = duration / DATA_INTERVAL;
  for (let i = 0; i <= Math.floor(parts); i++) {
    if (i === Math.floor(parts)) intervals.push(parts * DATA_INTERVAL);
    else intervals.push(i * DATA_INTERVAL);
  }
  return intervals;
};

export const getEntityData = (
  intervals: number[],
  player: Entity,
  started: number
) => {
  const data: number[] = [];

  intervals.forEach((i) => {
    const damage = getEntityDamageInRange(started, started + i, player);
    const dps = parseFloat(getEntityDPS(i / 1000, damage));
    data.push(dps);
  });

  return data;
};
