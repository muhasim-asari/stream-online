import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";
import https from "https";
import { URL } from "url";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Simple CORS Proxy for HLS Streams
  app.get("/api/proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    
    if (!targetUrl) {
      return res.status(400).send("URL parameter is required");
    }

    try {
      const parsedUrl = new URL(targetUrl);
      const protocol = parsedUrl.protocol === "https:" ? https : http;

      // Enable CORS for the client
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range");

      if (req.method === "OPTIONS") {
        return res.status(200).end();
      }

      const proxyHeaders = { ...req.headers, host: parsedUrl.host };
      delete proxyHeaders.origin;
      delete proxyHeaders.referer;

      const proxyReq = protocol.request(targetUrl, {
        method: req.method,
        headers: proxyHeaders,
      }, (proxyRes) => {
        // Forward headers from target to client
        Object.keys(proxyRes.headers).forEach((key) => {
          if (key !== "access-control-allow-origin") {
             const value = proxyRes.headers[key];
             if (value) {
                res.setHeader(key, value);
             }
          }
        });

        res.status(proxyRes.statusCode || 200);

        // If it's an M3U8 file, we need to rewrite URLs
        const contentType = proxyRes.headers["content-type"];
        if (contentType && (contentType.includes("application/vnd.apple.mpegurl") || contentType.includes("application/x-mpegURL") || targetUrl.includes(".m3u8"))) {
          let body = "";
          proxyRes.on("data", (chunk) => {
            body += chunk.toString();
          });
          proxyRes.on("end", () => {
            // Rewrite URLs inside the M3U8
            const lines = body.split("\n");
            const newLines = lines.map(line => {
              line = line.trim();
              if (line && !line.startsWith("#")) {
                // It's a URI
                let absoluteUri = line;
                if (!line.startsWith("http")) {
                  // Resolve relative URL
                   const base = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
                   if (line.startsWith("/")) {
                      absoluteUri = parsedUrl.origin + line;
                   } else {
                      absoluteUri = base + line;
                   }
                }
                return `/api/proxy?url=${encodeURIComponent(absoluteUri)}`;
              }
              // Handle #EXT-X-KEY URIs and other attributes that might have URLs
              if (line.startsWith("#EXT-X-KEY:") || line.startsWith("#EXT-X-MEDIA:")) {
                  return line.replace(/URI="([^"]+)"/, (match, p1) => {
                      let absoluteUri = p1;
                      if (!p1.startsWith("http")) {
                          const base = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
                          if (p1.startsWith("/")) {
                              absoluteUri = parsedUrl.origin + p1;
                          } else {
                              absoluteUri = base + p1;
                          }
                      }
                      return `URI="/api/proxy?url=${encodeURIComponent(absoluteUri)}"`;
                  });
              }
              return line;
            });
            res.send(newLines.join("\n"));
          });
        } else {
          // For TS chunks and other files, just pipe
          proxyRes.pipe(res);
        }
      });

      proxyReq.on("error", (err) => {
        console.error("Proxy error:", err);
        if (!res.headersSent) {
          res.status(500).send("Proxy error: " + err.message);
        }
      });

      // Handle aborts
      req.on('close', () => {
          proxyReq.destroy();
      });

      req.pipe(proxyReq);

    } catch (err: any) {
      console.error("Invalid proxy URL:", err);
      res.status(400).send("Invalid URL");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
