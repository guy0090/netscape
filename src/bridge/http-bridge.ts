import AppStore from "@/persistance/store";
import { createServer, Server } from "http";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { logger } from "@/util/logging";
import { EventEmitter } from "events";
import path from "path";
import { app } from "electron";
import { AddressInfo } from "net";
import { LogMessage } from "./log-lines";

const isDevelopment = process.env.NODE_ENV !== "production";

export class HttpBridge extends EventEmitter {
  private port = 1338;
  public httpServer: Server | undefined = undefined;
  public lostArkLogger: ChildProcessWithoutNullStreams | undefined = undefined;
  public validHosts: string[] = [];

  public connected = false;
  public lastPacket = -1;

  constructor(appStore: AppStore) {
    // Extend
    super();

    // Start listening for packets
    this.startBridge(appStore);
  }

  public checkHost(host: string | undefined): boolean {
    if (!host) return false;
    return this.validHosts.includes(host);
  }

  private fromBase64(str: string): string {
    return Buffer.from(str, "base64").toString();
  }

  public startBridge(appStore: AppStore) {
    this.httpServer = createServer((req, res) => {
      const isHostValid = this.checkHost(req.headers.host);

      if (!isHostValid) {
        logger.error("Request Invalid Host", { host: req.headers.host });

        res.writeHead(403, { "Content-Type": "text/html" });
        return res.end("Forbidden");
      }

      if (req.method === "POST") {
        const body: Uint8Array[] = [];

        req.on("data", (chunk) => {
          body.push(chunk);
        });

        req.on("end", () => {
          const parsedBody = Buffer.concat(body).toString();
          // const data = this.fromBase64(parsedBody);
          this.emit("packet", parsedBody);
          this.connected = true;
          this.lastPacket = Date.now();

          if (parsedBody.split("|")[0] === "255") {
            const sys = new LogMessage(parsedBody.split("|"));
            if (sys.message === "Exiting") {
              this.connected = false;
              this.emit("rcap_disconnected");
              logger.debug("Lost connection to packet capturer");
            } else if (sys.message === "Connected") {
              this.connected = true;
              this.emit("rcap_connected");
              logger.debug("Connected to packet capturer");
            }
          }

          res.writeHead(200, { "Content-Type": "text/html" });
          res.end();
        });
      }
    });

    this.httpServer.listen(this.port, "localhost", () => {
      const addr = this.httpServer?.address() as AddressInfo;

      logger.info(
        `Server Listening ${addr.address}:${addr.port}`,
        `${addr}:${addr.port}`
      );

      this.validHosts.push(
        `localhost:${addr.port}`,
        `127.0.0.1:${addr.port}`,
        `host.docker.internal:${addr.port}`
      );
      this.emit("listen");
      // this.spawnPacketCapturer(appStore);
      this.lastPacket = Date.now();
    });

    this.httpServer.on("close", () => {
      this.emit("close");
    });
  }

  public spawnPacketCapturer(appSettings: AppStore) {
    const args = ["--Port", `${this.port}`];

    if (appSettings.get("useWinpcap")) args.push("--UseNpcap");

    try {
      let binaryFile;
      if (isDevelopment) {
        binaryFile = path.resolve(
          __dirname,
          "../binary/49ee656f-9dfa-452f-be9b-ec6c698a20e7.exe"
        );
      } else {
        binaryFile = "49ee656f-9dfa-452f-be9b-ec6c698a20e7.exe";
      }

      this.lostArkLogger = spawn(binaryFile, args);
    } catch (e) {
      logger.error("Error while trying to open packet capturer", e);
      logger.error("Exiting app...");
      app.exit();
    }

    this.lostArkLogger?.on("exit", function (code, signal) {
      logger.error(
        `The connection to the Lost Ark Packet Capture was lost for some reason:\n
        Code: ${code} and Signal: ${signal}`
      );
      logger.error("Exiting app...");
      app.exit();
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.httpServer) {
        this.httpServer.close((err) => {
          if (err) {
            logger.error("Error while closing http server", err);
            reject(err);
          } else {
            logger.info("Http server closed");
            resolve();
          }
        });
      }
    });
  }
}
