import path from "path";
import fs from "fs";

export function cleanOldBundles(assetsDir: string) {
  return {
    name: "clean-old-bundles",
    generateBundle() {
      fs.readdirSync(assetsDir).forEach((file: string) => {
        if (file.startsWith("bundle.") && file.endsWith(".js")) {
          fs.unlinkSync(path.join(assetsDir, file));
          console.log(`🗑️ Removed old bundle: ${file}`);
        }
      });
    },
  };
}
