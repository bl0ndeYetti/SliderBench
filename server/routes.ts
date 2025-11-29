import type { Express } from "express";
import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { createRunConfig, initializeRun, runToCompletion } from "./orchestrator";
import { createRunRequestSchema, type WebSocketMessage, type RunWithGame, type StatsResponse } from "@shared/schema";

const clients = new Set<WebSocket>();

function broadcast(message: WebSocketMessage) {
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function broadcastStats() {
  const stats = storage.getStats();
  broadcast({ type: "stats_updated", data: stats });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    clients.add(ws);

    ws.on("close", () => {
      clients.delete(ws);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      clients.delete(ws);
    });
  });

  app.get("/api/runs", (_req, res) => {
    const runs = storage.getAllRunsWithGames();
    res.json({ runs });
  });

  app.get("/api/runs/:runId", (req, res) => {
    const runWithGame = storage.getRunWithGame(req.params.runId);
    if (!runWithGame) {
      return res.status(404).json({ error: "Run not found" });
    }
    res.json(runWithGame);
  });

  app.get("/api/stats", (_req, res) => {
    const stats = storage.getStats();
    res.json(stats);
  });

  app.post("/api/runs", async (req, res) => {
    try {
      const parseResult = createRunRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.message });
      }

      const config = createRunConfig(parseResult.data);
      const runWithGame = initializeRun(config);

      broadcast({ type: "run_created", data: runWithGame });
      broadcastStats();

      res.json(runWithGame);

      runToCompletion(runWithGame.run.runId, (updated) => {
        broadcast({ type: "run_updated", data: updated });
      }, 800).then((finalData) => {
        if (finalData) {
          broadcast({ type: "run_completed", data: finalData });
          broadcastStats();
        }
      }).catch((error) => {
        console.error("Error running to completion:", error);
      });

    } catch (error) {
      console.error("Error creating run:", error);
      res.status(500).json({ error: "Failed to create run" });
    }
  });

  app.post("/api/runs/:runId/step", async (req, res) => {
    const runWithGame = storage.getRunWithGame(req.params.runId);
    if (!runWithGame) {
      return res.status(404).json({ error: "Run not found" });
    }

    if (runWithGame.run.status !== "in_progress") {
      return res.json(runWithGame);
    }

    const { runSingleStep } = await import("./orchestrator");
    const updated = await runSingleStep(req.params.runId);
    
    if (updated) {
      broadcast({ type: "run_updated", data: updated });
      if (updated.run.status !== "in_progress") {
        broadcast({ type: "run_completed", data: updated });
      }
      broadcastStats();
    }

    res.json(updated || runWithGame);
  });

  return httpServer;
}
