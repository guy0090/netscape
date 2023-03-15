import ms from "ms";

import { logger } from "@/util/logging";
import { EventEmitter } from "events";
import { getRecentEncountersFromDisk } from "./helpers";
import { SimpleSession } from "./objects";

export class RecentEncountersService extends EventEmitter {
  maxRecents = 10;
  currentLive?: SimpleSession;
  recentEncounters: SimpleSession[];

  timerInterval: number = ms("5s"); // 5 seconds default
  static intervalTimer: NodeJS.Timeout | undefined;

  constructor(maxRecents?: number, timerInterval?: number) {
    super();

    if (maxRecents && maxRecents > 0 && maxRecents < 100) {
      this.maxRecents = maxRecents;
    }
    if (timerInterval && timerInterval > ms("1s")) {
      this.timerInterval = timerInterval;
    }

    this.currentLive = undefined;
    this.recentEncounters = [];
  }

  start() {
    if (RecentEncountersService.intervalTimer) return;

    RecentEncountersService.intervalTimer = setInterval(() => {
      this.loadRecentEncounters();
    }, this.timerInterval);
    logger.info("Started recent encounter service");
  }

  stop() {
    if (!RecentEncountersService.intervalTimer) return;

    clearInterval(RecentEncountersService.intervalTimer);
    RecentEncountersService.intervalTimer = undefined;
    logger.info("Stopped recent encounter service");
  }

  setCurrentLive(currentLive: SimpleSession | undefined) {
    this.currentLive = currentLive;
  }

  async loadRecentEncounters() {
    try {
      const recents = await getRecentEncountersFromDisk(this.maxRecents);
      if (recents) this.recentEncounters = recents;

      for (const recent of this.recentEncounters) {
        recent.fromHistory = true;
        recent.live = false;
      }

      this.emit("loaded-recents", {
        currentLive: this.currentLive,
        recentEncounters: this.recentEncounters,
      });
    } catch (err) {
      this.emit("error", err);
      logger.error("Error loading recent encounters", err);
    }
  }

  getRecentEncounters() {
    return this.recentEncounters;
  }
}

export interface RecentEncountersService {
  on(
    event: "loaded-recents",
    listener: (recents: RecentEncounters) => void
  ): this;

  on(event: "error", listener: (err: Error) => void): this;
}

export interface RecentEncounters {
  currentLive: SimpleSession | undefined;
  recentEncounters: SimpleSession[];
}
