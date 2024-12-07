const path = require("path");
const fs = require("fs");

function injectWebSocketCode() {
  return {
    name: "inject-websocket-code",
    generateBundle(_: any, bundle: { [x: string]: any }) {
      Object.keys(bundle).forEach((fileName) => {
        const chunk = bundle[fileName];
        if (chunk.type === "chunk" && fileName.endsWith(".js")) {
          chunk.code += `
            const socket = new WebSocket("ws://localhost:3001/reload");
            socket.onmessage = (event) => {
              if (event.data === "reload") {
                console.log("🔄 Reloading page...");
                location.reload(true);
              }
            };
            socket.onclose = () => {
              console.log("🔌 WebSocket connection closed");
            };
          `;
        }
      });
    },
  };
}

module.exports = {
  root: "src/theme",
  build: {
    minify: true, // Minificazione per produzione
    outDir: path.resolve(
      __dirname,
      "../../dist/examples/demo-blog/theme/assets"
    ),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "src/theme/client.tsx"), // Unico entry point
      output: {
        dir: path.resolve(
          __dirname,
          "../../dist/examples/demo-blog/theme/assets"
        ),
        entryFileNames: "bundle.[hash].js", // Nome del bundle con hash
        format: "esm", // Formato immediatamente eseguibile
      },
    },
  },
  plugins: [injectWebSocketCode()],
};
