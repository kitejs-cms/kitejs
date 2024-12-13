const path = require("path");
const fs = require("fs");
const {
  injectWebSocketCode,
  cleanOldBundles,
} = require("../../packages/core/src");

module.exports = {
  root: "src/theme",
  css: {
    postcss: path.resolve(__dirname, "postcss.config.js"),
  },
  build: {
    minify: true,
    outDir: path.resolve(
      __dirname,
      "../../dist/examples/demo-blog/theme/assets"
    ),
    emptyOutDir: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "src/theme/client.tsx"),
        styles: path.resolve(__dirname, "src/theme/index.css"),
      },
      output: {
        dir: path.resolve(
          __dirname,
          "../../dist/examples/demo-blog/theme/assets"
        ),
        entryFileNames: "[name].[hash].js",
        chunkFileNames: "[name].[hash].js",
        assetFileNames: "[name].[ext]",
        format: "esm",
      },
    },
  },
  plugins: [
    injectWebSocketCode(),
    cleanOldBundles(
      path.resolve(__dirname, "../../dist/examples/demo-blog/theme/assets")
    ),
  ],
};
