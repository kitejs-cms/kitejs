const path = require("path");

module.exports = {
  root: "src/theme", // Punto di partenza per i file
  build: {
    outDir: path.resolve(
      __dirname,
      "../../dist/examples/demo-blog/theme/assets"
    ), // Directory di output
    emptyOutDir: true,
    rollupOptions: {
      input: {
        app: path.resolve(__dirname, "src/theme/client.tsx"), // Entry point
      },
      emptyOutDir: false,
      output: {
        dir: path.resolve(
          __dirname,
          "../../dist/examples/demo-blog/theme/assets"
        ), // Directory di output
        entryFileNames: "bundle.js", // Nome del file generato
        format: "iife", // Formato immediatamente eseguibile
        name: "MyApp", // Nome del modulo
      },
    },
  },
};
