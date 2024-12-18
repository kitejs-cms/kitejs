#!/usr/bin/env node
const { spawn, exec } = require("child_process");
const WebSocket = require("ws");
const chokidar = require("chokidar");
const fs = require("fs");
const path = require("path");

const coreDistPath = "dist/packages/core";
const themePath = "examples/demo-blog/src/theme";
const viteConfigPath = "examples/demo-blog/vite.config.ts";
const assetsDir = path.resolve(
  __dirname,
  "../../dist/examples/demo-blog/theme/assets"
);

const demoPort = 5000;
const reloadPort = 3001;
let backendReady = false;

// Utilities
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(stderr || err.message);
      } else {
        resolve(stdout);
      }
    });
  });
}

function log(name, message, isError = false) {
  const color = isError ? "\x1b[31m" : "\x1b[32m";
  const reset = "\x1b[0m";
  console.log(`${color}[${name}]${reset} ${message.trim()}`);
}

// Start a process with cleaner logging
function startProcess(name, command, args = []) {
  const proc = spawn(command, args, { stdio: "inherit", shell: true });
  proc.on("error", (err) => log(name, `Error: ${err.message}`, true));
  return proc;
}

// Kill port
async function killPort(port) {
  const killCommand =
    process.platform === "win32"
      ? `for /F "tokens=5" %A in ('netstat -ano ^| findstr :${port} ^| findstr LISTENING') do taskkill /PID %A /F`
      : `lsof -ti tcp:${port} | xargs kill -9`;

  try {
    await executeCommand(killCommand);
    log("Port", `Successfully killed process on port ${port}`);
  } catch (error) {
    log("Port", `No process found on port ${port}`, true);
  }
}

// Ensure assets directory exists
function ensureAssetsDirExists() {
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
    log("Assets", `Created missing directory: ${assetsDir}`);
  }
}

// Build theme
async function buildTheme() {
  log("Theme", "Building theme with Vite...");
  ensureAssetsDirExists();
  try {
    await executeCommand(`pnpm vite build --config ${viteConfigPath}`);
    log("Theme", "Build completed successfully.");
  } catch (err) {
    log("Theme", "Build failed", true);
    process.exit(1);
  }
}

// Restart Demo App
async function restartDemoApp(wss) {
  await killPort(demoPort);
  log("Demo", "Restarting demo application...");
  const demoProc = startProcess("Demo", "pnpm", ["run", "dev:demo-blog"]);

  demoProc.stdout?.on("data", (data) => {
    if (data.includes("Nest application successfully started")) {
      backendReady = true;
      notifyClients(wss, "reload");
      log("Demo", "Backend ready. Clients reloaded.");
    }
  });
}

// Watch Core Changes
function watchCoreChanges(wss) {
  const watcher = chokidar.watch(coreDistPath, { persistent: true });
  let timeout = null;

  watcher.on("change", (filePath) => {
    log("Core", `File changed: ${filePath}`);
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      restartDemoApp(wss);
    }, 500); // Debounce
  });
}

// Start WebSocket Server
function startWebSocketServer() {
  const wss = new WebSocket.Server({ port: reloadPort });
  wss.on("connection", () => log("WebSocket", "Client connected for reload"));
  return wss;
}

// Notify clients
function notifyClients(wss, message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  });
}

// Main flow
async function start() {
  log("Start", "Initializing development environment...");
  const wss = startWebSocketServer();
  log("WebSocket", "WebSocket server started.");

  await killPort(demoPort);
  const coreProc = startProcess("Core", "pnpm", ["run", "dev:core"]);

  await buildTheme(); // Initial theme build
  watchCoreChanges(wss);
  restartDemoApp(wss);

  chokidar.watch(themePath, { persistent: true }).on("change", async () => {
    log("Theme", "Theme file changed, rebuilding...");
    await buildTheme();
    restartDemoApp(wss);
  });

  process.on("SIGINT", () => {
    log("Exit", "Cleaning up processes...");
    coreProc.kill();
    wss.close();
    process.exit(0);
  });
}

start();
