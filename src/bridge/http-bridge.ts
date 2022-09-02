import AppStore from "@/persistance/store";
import { createServer, Server } from "http";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { logger } from "@/util/logging";
import { EventEmitter } from "events";
import path from "path";
import { app } from "electron";
import { AddressInfo } from "net";

const isDevelopment = process.env.NODE_ENV !== "production";

export class HttpBridge extends EventEmitter {
  private port = 34536;
  public httpServer: Server | undefined = undefined;
  public lostArkLogger: ChildProcessWithoutNullStreams | undefined = undefined;
  public validHosts: string[] = [];

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

          res.writeHead(200, { "Content-Type": "text/html" });
          res.end();
        });
      }
    });

    this.httpServer.listen(this.port, "localhost", () => {
      const addr = this.httpServer?.address() as AddressInfo;

      logger.info("Server Listening", addr);
      this.validHosts.push(`localhost:${addr.port}`, `127.0.0.1:${addr.port}`);
      this.emit("listen");
      this.spawnPacketCapturer(appStore);
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

  public stop() {
    try {
      this.httpServer?.close();
    } catch (e) {
      logger.error("Error while trying to stop http bridge", e);
    }
  }
}
