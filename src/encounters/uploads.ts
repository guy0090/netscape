import log from "electron-log";
import { ENTITY_TYPE, Session } from "@/encounters/objects";
import AppStore from "@/persistance/store";
// import AppStore from "@/persistance/store";
import axios from "axios";
import { shell } from "electron";
export const UPLOAD_URL = process.env.VUE_APP_UPLOAD_URL;
export const SITE_URL = process.env.VUE_APP_LOGS_URL;

export const UPLOAD_ENDPOINT = "/logs/upload";
export const RECENT_ENDPOINT = "/logs/recents";

export const uploadSession = async (session: Session) => {
  try {
    const uploadKey = await AppStore.getPassword();

    // If multiple bosses are logged, only keep the most recent one
    const bosses = session.entities.filter(
      (e) => e.type === ENTITY_TYPE.BOSS || e.type === ENTITY_TYPE.GUARDIAN
    );

    if (bosses.length > 1) {
      const filtered = bosses
        .sort((a, b) => b.lastUpdate - a.lastUpdate)
        .slice(1)
        .map((e) => e.id);

      session.entities = session.entities.filter(
        (e) => !filtered.includes(e.id)
      );
    }

    const upload = { key: uploadKey, data: session };

    const response = await axios.post(
      `${UPLOAD_URL}${UPLOAD_ENDPOINT}`,
      upload
    );
    return response.data;
  } catch (err) {
    log.error((err as Error).message);
    throw err;
  }
};

export const validateUpload = (session: Session) => {
  if (session.firstPacket <= 0 || session.lastPacket <= 0) {
    log.info("Validating upload failed: session duration is invalid");
    return false;
  }

  const entities = session.entities;
  const bossEntities = entities.filter(
    (entity) =>
      entity.type === ENTITY_TYPE.BOSS || entity.type === ENTITY_TYPE.GUARDIAN
  );
  const playerEntities = entities.filter(
    (entity) => entity.type === ENTITY_TYPE.PLAYER
  );

  const hasBoss = bossEntities.length > 0;
  if (!hasBoss) {
    log.info("Validating upload failed: no boss found");
    return false;
  }

  const hasPlayers = playerEntities.length > 0;
  if (!hasPlayers) {
    log.info("Validating upload failed: no players found");
    return false;
  }

  const allPlayersHaveSkills = playerEntities.every((e) => e.skills);

  if (!allPlayersHaveSkills) {
    log.info("Validating upload failed: one or more players have no skills");
    return false;
  }

  const mostRecentDamaged = bossEntities.sort(
    (a, b) => b.lastUpdate - a.lastUpdate
  )[0];

  if (mostRecentDamaged.lastUpdate + 1000 * 60 * 10 < +new Date()) {
    log.info(
      "Validating upload failed: boss was not damaged in last 10 minutes"
    );
    return false;
  }

  if (mostRecentDamaged.currentHp > 0) {
    log.info(
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
