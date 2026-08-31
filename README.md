# Orbit Sweep API

Anonymous-first leaderboard API for Orbit Sweep.

Public route:

```text
https://abel-duarte.com/api/orbit-sweep
```

VPS route target:

```caddy
handle_path /api/orbit-sweep* {
  reverse_proxy 127.0.0.1:42383
}
```

Run locally:

```bash
npm test
docker compose up -d --build
curl http://127.0.0.1:42383/api/orbit-sweep/health
```


<!-- Security scan triggered at 2026-08-31 16:31:40 -->

<!-- Security scan triggered at 2026-08-31 16:30:40 -->

<!-- Security scan triggered at 2026-08-31 17:44:51 -->

<!-- Security scan triggered at 2026-08-31 17:46:47 -->

<!-- Security scan triggered at 2026-08-31 18:15:20 -->