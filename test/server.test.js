import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/server.js";

async function withServer(fn) {
  const server = createServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}/api/orbit-sweep`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test("health responds", async () => {
  await withServer(async baseURL => {
    const response = await fetch(`${baseURL}/health`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).ok, true);
  });
});

test("fresh anonymous player gets empty decodable board", async () => {
  await withServer(async baseURL => {
    const response = await fetch(`${baseURL}/leaderboard?playerId=fresh`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.playerId, "fresh");
    assert.deepEqual(body.entries, []);
    assert.equal(body.playerBest, null);
  });
});

test("score submission returns current player best", async () => {
  await withServer(async baseURL => {
    const response = await fetch(`${baseURL}/scores`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        playerId: "player-1",
        playerName: "Nova",
        score: 880,
        streak: 21,
        bursts: 4,
        secondsSurvived: 73
      })
    });
    const body = await response.json();
    assert.equal(response.status, 201);
    assert.equal(body.entries[0].score, 880);
    assert.equal(body.entries[0].bursts, 4);
    assert.equal(body.playerBest.playerId, "player-1");
  });
});
