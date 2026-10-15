// Zero-dependency static server for the mockup: `node server.js [port]`
const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const root = __dirname;
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".mp3": "audio/mpeg" };
let port = Number(process.argv[2] || process.env.PORT || 4173);
const noOpen = process.argv.includes("--no-open");

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  const file = path.normalize(path.join(root, urlPath === "/" ? "index.html" : urlPath));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end("Forbidden"); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    const headers = { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store", "Content-Length": data.length };
    let start = 0, end = data.length - 1, status = 200;
    if (path.extname(file) === ".mp3") {
      headers["Accept-Ranges"] = "bytes";
      if (req.headers.range) {
        const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        if (range && (range[1] || range[2])) {
          start = range[1] ? Number(range[1]) : Math.max(0, data.length - Number(range[2]));
          end = range[1] && range[2] ? Math.min(Number(range[2]), end) : end;
        }
        if (!range || !(range[1] || range[2]) || start > end || start >= data.length || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) {
          res.writeHead(416, { "Content-Range": `bytes */${data.length}`, "Content-Length": 0 });
          return res.end();
        }
        status = 206;
        headers["Content-Range"] = `bytes ${start}-${end}/${data.length}`;
        headers["Content-Length"] = end - start + 1;
      }
    }
    res.writeHead(status, headers);
    res.end(req.method === "HEAD" ? undefined : data.subarray(start, end + 1));
  });
});

server.on("error", (e) => {
  if (e.code === "EADDRINUSE" && port < 4190) { port++; server.listen(port, "127.0.0.1"); }
  else { console.error(e.message); process.exit(1); }
});

server.listen(port, "127.0.0.1", () => {
  const url = `http://localhost:${server.address().port}`;
  console.log(`\n  Globe AI Studio mockup running at ${url}\n  Press Ctrl+C to stop.\n`);
  if (noOpen) return;
  const cmd = process.platform === "win32" ? `start "" "${url}"` : process.platform === "darwin" ? `open "${url}"` : `xdg-open "${url}"`;
  exec(cmd, () => {});
});
