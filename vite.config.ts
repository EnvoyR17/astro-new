import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

/** Dev/preview proxy → Nominatim (EN). Client filters + formats results. */
function placesProxy(): Plugin {
  const handler = async (req: import("http").IncomingMessage, res: import("http").ServerResponse) => {
    try {
      const host = req.headers.host ?? "localhost";
      const url = new URL(req.url ?? "/", `http://${host}`);
      const q = (url.searchParams.get("q") ?? "").trim();
      if (q.length < 2) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ items: [] }));
        return;
      }

      const upstream =
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}` +
        `&format=json&addressdetails=1&namedetails=1&limit=8`;
      const r = await fetch(upstream, {
        headers: {
          Accept: "application/json",
          "Accept-Language": "en",
          "User-Agent": "theastrologist-quiz-clone/1.0 (local quiz copy)",
        },
      });
      const items = await r.json();
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ items: Array.isArray(items) ? items : [] }));
    } catch (e) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: String(e), items: [] }));
    }
  };

  return {
    name: "birth-place-search-proxy",
    configureServer(server) {
      server.middlewares.use("/api/birth-profile/search-places", handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/birth-profile/search-places", handler);
    },
  };
}

export default defineConfig({
  plugins: [react(), placesProxy()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: false,
    allowedHosts: [".tuna.am"],
  },
});
