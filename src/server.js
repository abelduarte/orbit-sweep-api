import http from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.PORT || 8080);
const BASE_PATH = "/api/orbit-sweep";
const entries = [];

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type"
  });
  res.end(payload);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 16_384) {
        reject(new Error("body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function cleanString(value, fallback, maxLength) {
  const cleaned = typeof value === "string" ? value.trim().slice(0, maxLength) : "";
  return cleaned || fallback;
}

function leaderboardFor(playerId) {
  const sorted = [...entries]
    .sort((a, b) => b.score - a.score || b.streak - a.streak || b.bursts - a.bursts || a.submittedAt.localeCompare(b.submittedAt))
    .slice(0, 25);

  return {
    playerId,
    entries: sorted,
    playerBest: sorted.find(entry => entry.playerId === playerId) || null
  };
}

export function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://localhost");
    const path = url.pathname.startsWith(BASE_PATH) ? url.pathname.slice(BASE_PATH.length) || "/" : url.pathname;

    if (req.method === "OPTIONS") {
      json(res, 204, {});
      return;
    }

    if (req.method === "GET" && path === "/health") {
      json(res, 200, { ok: true, service: "orbit-sweep-api" });
      return;
    }

    if (req.method === "GET" && path === "/leaderboard") {
      const playerId = cleanString(url.searchParams.get("playerId"), "anonymous", 80);
      json(res, 200, leaderboardFor(playerId));
      return;
    }

    if (req.method === "POST" && path === "/scores") {
      try {
        const body = await parseBody(req);
        const playerId = cleanString(body.playerId, "anonymous", 80);
        const score = Math.max(0, Math.min(999999, Number.parseInt(body.score, 10) || 0));
        const streak = Math.max(0, Math.min(9999, Number.parseInt(body.streak, 10) || 0));
        const bursts = Math.max(0, Math.min(999, Number.parseInt(body.bursts, 10) || 0));
        const secondsSurvived = Math.max(0, Math.min(90, Number.parseInt(body.secondsSurvived, 10) || 0));

        entries.push({
          id: randomUUID(),
          playerId,
          playerName: cleanString(body.playerName, "Orbit Pilot", 32),
          score,
          streak,
          bursts,
          secondsSurvived,
          submittedAt: new Date().toISOString()
        });

        entries.sort((a, b) => b.score - a.score || b.streak - a.streak || b.bursts - a.bursts);
        entries.splice(100);
        json(res, 201, leaderboardFor(playerId));
      } catch {
        json(res, 400, { message: "Invalid score payload" });
      }
      return;
    }

    json(res, 404, { message: "Route not found" });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createServer().listen(PORT, "0.0.0.0", () => {
    console.log(`orbit-sweep-api listening on ${PORT}`);
  });
}
