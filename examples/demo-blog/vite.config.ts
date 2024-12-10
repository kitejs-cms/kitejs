const path = require("path");
const fs = require("fs");
const {
  injectWebSocketCode,
  cleanOldBundles,
} = require("../../packages/core/src");

module.exports = {
  root: "src/theme",
  build: {
    minify: true,
    outDir: path.resolve(
      __dirname,
      "../../dist/examples/demo-blog/theme/assets"
    ),
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, "src/theme/client.tsx"),
      output: {
        dir: path.resolve(
          __dirname,
          "../../dist/examples/demo-blog/theme/assets"
        ),
        entryFileNames: "bundle.[hash].js",
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
