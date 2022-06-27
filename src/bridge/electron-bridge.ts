import AppStore from "@/persistance/store";
import { Connection, ConnectionBuilder } from "electron-cgi";
import log from "electron-log";
import { EventEmitter } from "events";
import path from "path";

const isDevelopment = process.env.NODE_ENV !== "production";

export class ElectronBridge extends EventEmitter {
  private connection: Connection | undefined;
  private connectionTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor(appStore: AppStore) {
    // Extend
    super();

    log.info("Starting logger connection");

    this.connectionTimeout = setTimeout(() => {
      this.emit("disconnected");
    }, 10000);

    // Start connection
    try {
      const params = [];
      if (appStore.get("useWinpcap")) params.push("useWinpcap");

      if (isDevelopment) {
        this.connection = new ConnectionBuilder()
          .connectTo(
            path.resolve(
              __dirname,
              "../binary/0372baa9-34b6-4b44-a8a6-c9e06233cf2b.exe"
            ),
            ...params
          )
          .build();
      } else {
        this.connection = new ConnectionBuilder()
          .connectTo("0372baa9-34b6-4b44-a8a6-c9e06233cf2b.exe", ...params)
          .build();
      }
    } catch {
      this.connection = undefined;
      this.emit("failed-to-connect");
    }

    this.connection?.on("ready", (msg) => {
      log.info(msg);

      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = undefined;

      this.emit("ready");

      (this.connection as Connection).onDisconnect = () => {
        this.emit("disconnected");
      };

      this.connection?.on("message", (message) => {
        log.info("Logger -> Main:", message);
      });

      this.connection?.on("packet", (packet) => {
        const data = this.fromBase64(packet);
        this.emit("packet", data);
      });
    });
  }

  private fromBase64(str: string): string {
    return Buffer.from(str, "base64").toString();
  }

  closeConnection() {
    if (this.connection) {
      this.connection.close();
    }
  }
}
