export function injectWebSocketCode() {
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
