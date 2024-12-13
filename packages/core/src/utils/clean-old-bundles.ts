import path from "path";
import fs from "fs";

export function cleanOldBundles() {
  return {
    name: "clean-old-bundles",
    generateBundle() {
      const assetsDir = path.resolve(
        __dirname,
        "../../dist/examples/demo-blog/theme/assets"
      );

      // Crea la directory se non esiste
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
        console.log(`✅ Created missing directory: ${assetsDir}`);
        return;
      }

      // Procedi a eliminare i vecchi bundle
      fs.readdirSync(assetsDir).forEach((file) => {
        if (file.startsWith("bundle.") && file.endsWith(".js")) {
          fs.unlinkSync(path.join(assetsDir, file));
          console.log(`🗑️ Removed old bundle: ${file}`);
        }
      });
    },
  };
}
