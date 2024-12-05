#!/usr/bin/env node
const { spawn, exec } = require("child_process");
const chokidar = require("chokidar");
const WebSocket = require("ws");

// Configurazione
const coreDistPath = "dist/packages/core";
const themePath = "examples/demo-blog/src/theme";
const demoPort = 5000;
const reloadPort = 3001;

let backendReady = false; // Flag per tracciare lo stato del backend

function startProcess(name, command, args = [], options = {}) {
  const process = spawn(command, args, {
    stdio: ["inherit", "pipe", "pipe"],
    shell: true,
    ...options,
  });

  process.stdout.on("data", (data) => {
    processLog(name, data.toString());

    // Controlla se il backend è pronto (usa un log specifico del tuo backend come indicatore)
    if (
      name === "Demo" &&
      data.toString().includes("Nest application successfully started")
    ) {
      backendReady = true;
      console.log("✅ Backend is ready. Sending reload signal to clients...");
      notifyClients(globalWebSocketServer, "reload"); // Notifica i client solo quando il backend è pronto
    }
  });

  process.stderr.on("data", (data) => {
    processLog(name, data.toString(), true);
  });

  process.on("close", (code) => {
    if (code !== 0) {
      console.error(`❌ [${name}] Process exited with code ${code}`);
    }
  });

  return process;
}

function processLog(name, message, isError = false) {
  const color = isError ? "\x1b[31m" : "\x1b[32m";
  const reset = "\x1b[0m";
  console.log(`${color}[${name}]${reset} ${message.trim()}`);
}

function startWebSocketServer() {
  const wss = new WebSocket.Server({ port: reloadPort });

  wss.on("connection", (ws) => {
    console.log("🔌 Client connected to WebSocket for live reload");
  });

  return wss;
}

function notifyClients(wss, message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

let demoProcess = null;

function killPort(port, callback) {
  const command =
    process.platform === "win32"
      ? `netstat -ano | findstr :${port} | findstr LISTENING && for /F "tokens=5" %A in ('netstat -ano ^| findstr :${port} ^| findstr LISTENING') do taskkill /PID %A /F`
      : `lsof -ti tcp:${port} | xargs kill -9`;

  exec(command, (err) => {
    if (err) {
      console.error(`❌ Failed to kill process on port ${port}:`, err.message);
    } else {
      console.log(`✅ Successfully killed process on port ${port}`);
    }
    if (callback) callback();
  });
}

function restartDemoApp() {
  if (demoProcess) {
    console.log("🔄 Restarting Demo App...");
    demoProcess.kill();
    backendReady = false; // Resetta il flag
  }

  killPort(demoPort, () => {
    demoProcess = startProcess("Demo", "pnpm", ["run", "dev:demo-blog"]);
  });
}

function startCoreWatch() {
  console.log("🚀 Starting Core Watch...");
  return startProcess("Core", "pnpm", ["run", "dev:core"]);
}

function watchFiles(wss) {
  console.log(`👀 Watching changes in ${coreDistPath} and ${themePath}...`);
  const watcher = chokidar.watch([coreDistPath, themePath], {
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on("change", (path) => {
    console.log(`🔧 File changed: ${path}`);
    if (path.startsWith(themePath)) {
      if (backendReady) {
        notifyClients(wss, "reload");
      } else {
        console.log("⏳ Waiting for backend to restart...");
      }
    } else {
      restartDemoApp();
    }
  });

  watcher.on("error", (error) => {
    console.error("❌ Error watching files:", error);
  });
}

function start() {
  console.log("🎯 Starting development environment...");
  global.globalWebSocketServer = startWebSocketServer();
  const coreProcess = startCoreWatch();
  restartDemoApp();
  watchFiles(global.globalWebSocketServer);

  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping processes...");
    coreProcess.kill();
    if (demoProcess) demoProcess.kill();
    global.globalWebSocketServer.close();
    process.exit(0);
  });
}

start();
