import { fileURLToPath } from "url";
import { execSync } from "child_process";
import inquirer from "inquirer";
import chalk from "chalk";
import path from "path";
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  rmSync,
  renameSync,
  mkdirSync,
  statSync,
} from "fs";

// If true => DO NOT publish, only create a tarball under assets/
// You can also force this from CLI with: SKIP_PUBLISH=1 node scripts/publish.mjs
const SKIP_PUBLISH = false;

// Repo paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, "..");
const archivesRoot = path.join(repoRoot, "assets");

// =====================
// Helpers
// =====================

function invariant(condition, message) {
  if (!condition) {
    console.error(chalk.bold.red(message));
    process.exit(1);
  }
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function deepClone(o) {
  return JSON.parse(JSON.stringify(o));
}

/**
 * Recursively scans the repo for all package.json files
 * and builds a map name -> version with local workspace versions.
 */
function getWorkspaceVersions() {
  const exclude = new Set([
    "node_modules",
    "dist",
    "build",
    ".next",
    ".turbo",
    ".idea",
    ".git",
    "coverage",
    ".cache",
  ]);
  const map = new Map();

  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (exclude.has(e.name)) continue;
        walk(path.join(dir, e.name));
      } else if (e.isFile() && e.name === "package.json") {
        const pkgPath = path.join(dir, e.name);
        try {
          const json = JSON.parse(readFileSync(pkgPath, "utf8"));
          if (json?.name && json?.version) {
            map.set(json.name, json.version);
          }
        } catch {
          // ignore malformed package.json
        }
      }
    }
  }

  walk(repoRoot);
  return map;
}

/** Returns true if the version spec is a workspace:* / workspace:^ / workspace:~ ... */
function isWorkspaceSpec(spec) {
  return typeof spec === "string" && spec.startsWith("workspace:");
}

/**
 * Patch a dependency block using local workspace versions:
 * - only affects packages under the @kitejs-cms/* scope
 * - only when the spec starts with "workspace:"
 * - replaces the spec with the exact local version found
 */
function patchBlockDeps(block, wsVersions) {
  if (!block) return undefined;
  const out = {};

  for (const [name, spec] of Object.entries(block)) {
    let nextSpec = spec;

    if (name.startsWith("@kitejs-cms/") && isWorkspaceSpec(spec)) {
      const localVer = wsVersions.get(name);
      if (localVer) {
        // Use the exact local version from the workspace
        nextSpec = `${localVer}`;
      } else {
        // If no local version is found, keep the original spec as a safe fallback
        nextSpec = spec;
      }
    }

    out[name] = nextSpec;
  }

  return Object.keys(out).length ? out : undefined;
}

/**
 * Patches ONLY production-relevant dependencies by replacing any @kitejs-cms/*
 * workspace:* specs with the exact local versions.
 *
 * ⚠️ NOTE: devDependencies are intentionally left UNCHANGED.
 * We also leave peerDependencies untouched (they guide consumers' installs).
 */
function patchPackageJsonDeps(pkgJson, wsVersions) {
  const next = deepClone(pkgJson);

  // Production deps
  next.dependencies = patchBlockDeps(pkgJson.dependencies, wsVersions);
  next.optionalDependencies = patchBlockDeps(
    pkgJson.optionalDependencies,
    wsVersions
  );

  // Do NOT touch dev/peer deps
  next.devDependencies = pkgJson.devDependencies;
  next.peerDependencies = pkgJson.peerDependencies;

  return next;
}

/** Creates a "clean" folder name for scoped packages: @scope/pkg -> scope__pkg */
function sanitizeForFs(name) {
  return name.replace(/^@/, "").replace(/\//g, "__");
}

async function runPublishScript() {
  // Choose package from packages/ folder (common fallback)
  const packagesDir = path.join(repoRoot, "packages");
  invariant(
    existsSync(packagesDir),
    `Missing "packages" directory at ${packagesDir}`
  );

  const packageNames = readdirSync(packagesDir).filter((folder) => {
    const pj = path.join(packagesDir, folder, "package.json");
    return (
      existsSync(pj) && statSync(path.join(packagesDir, folder)).isDirectory()
    );
  });
  invariant(
    packageNames.length > 0,
    'No packages found in the "packages" directory.'
  );

  // Prompt
  const { name, version, tag } = await inquirer.prompt([
    {
      type: "list",
      name: "name",
      message: "Select the project/library to publish:",
      choices: packageNames,
    },
    {
      type: "input",
      name: "version",
      message: "Enter the base version (e.g., 1.0.0):",
      validate: (input) =>
        /^\d+\.\d+\.\d+$/.test(input)
          ? true
          : "Invalid version format. Expected x.y.z",
    },
    {
      type: "list",
      name: "tag",
      message: "Select the release type:",
      choices: ["latest", "alpha", "beta", "rc"],
    },
  ]);

  const packagePath = path.join(packagesDir, name);
  const packageJsonPath = path.join(packagePath, "package.json");

  let pkgJson = {};
  try {
    pkgJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  } catch {
    console.error(chalk.bold.red("Unable to read package.json."));
    process.exit(1);
  }

  // Compute final version (autoincrement prerelease if needed)
  let finalVersion = version;
  if (tag !== "latest") {
    let publishedVersions = [];
    const pkgName = pkgJson.name;
    try {
      const cmd = `npm view ${pkgName} versions --json --registry=https://npm.pkg.github.com/tascaenzo`;
      const out = execSync(cmd, { encoding: "utf-8" });
      publishedVersions = JSON.parse(out);
    } catch {
      publishedVersions = [];
    }

    let maxPre = -1;
    const re = new RegExp(`^${version}-${tag}\\.(\\d+)$`);
    for (const v of publishedVersions) {
      const m = String(v).match(re);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > maxPre) maxPre = n;
      }
    }
    const defaultPre = maxPre + 1;

    const { preReleaseNumber } = await inquirer.prompt([
      {
        type: "input",
        name: "preReleaseNumber",
        message: `Enter the progressive number for the ${tag} release (default: ${defaultPre}):`,
        default: `${defaultPre}`,
        validate: (input) =>
          /^\d+$/.test(input) ? true : "Please enter a valid number.",
      },
    ]);

    finalVersion = `${version}-${tag}.${preReleaseNumber}`;
  }
  console.log(chalk.green(`Final version will be: ${finalVersion}`));

  // Clean dist
  const distDir = path.join(packagePath, "dist");
  if (existsSync(distDir)) {
    console.log(
      chalk.blue(`Removing existing dist directory at ${distDir}...`)
    );
    rmSync(distDir, { recursive: true, force: true });
  }

  // Build
  try {
    console.log(chalk.blue(`Building package ${name}...`));
    execSync(`npm run build`, { cwd: packagePath, stdio: "inherit" });
  } catch {
    console.error(chalk.bold.red(`Error building package ${name}.`));
    process.exit(1);
  }

  // Update version in package.json (dev copy kept in repo)
  try {
    pkgJson.version = finalVersion;
    writeFileSync(packageJsonPath, JSON.stringify(pkgJson, null, 2));
    console.log(chalk.green(`Version updated to ${finalVersion}.`));
  } catch (error) {
    console.error(
      chalk.bold.red("Error updating package.json: " + error.message)
    );
    process.exit(1);
  }

  // Patch ONLY production deps with local versions for @kitejs-cms/* workspace:*
  // Create a temporary package.json for publish, keep project's package.json with workspace:*.
  const backupPath = path.join(packagePath, "package.publish.backup.json");
  try {
    // Backup the (version-bumped) developer package.json (still contains workspace:* specs)
    renameSync(packageJsonPath, backupPath);

    const devPkg = JSON.parse(readFileSync(backupPath, "utf8"));
    const wsVersions = getWorkspaceVersions();
    const patched = patchPackageJsonDeps(devPkg, wsVersions);

    writeFileSync(packageJsonPath, JSON.stringify(patched, null, 2));
    console.log(
      chalk.cyan(
        `[publish] Patched package.json (temporary):\n- replaced workspace:* specs for @kitejs-cms/* only in dependencies & optionalDependencies\n- left devDependencies and peerDependencies untouched\n- no dependency movement between dependency blocks\n`
      )
    );
  } catch (error) {
    console.error(
      chalk.bold.red(`Error patching package.json: ${error.message}`)
    );
    if (existsSync(backupPath)) {
      try {
        if (existsSync(packageJsonPath)) rmSync(packageJsonPath);
        renameSync(backupPath, packageJsonPath);
      } catch {}
    }
    process.exit(1);
  }

  // Pack + archive tarball (and produce per-package ZIP under the library's assets/)
  try {
    ensureDir(archivesRoot);
    const pkgFolder = sanitizeForFs(pkgJson.name || name);
    const pkgArchiveDir = path.join(archivesRoot, pkgFolder);
    ensureDir(pkgArchiveDir);

    const out = execSync(`npm pack --json`, {
      cwd: packagePath,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const arr = JSON.parse(out);
    const filename =
      arr?.[0]?.filename ||
      arr?.[0]?.file ||
      `${pkgFolder}-${finalVersion}.tgz`;
    const srcTgz = path.join(packagePath, filename);

    const destName = `${pkgFolder}-${finalVersion}.tgz`;
    const destTgz = path.join(pkgArchiveDir, destName);

    if (existsSync(destTgz)) rmSync(destTgz);
    renameSync(srcTgz, destTgz);

    console.log(chalk.green(`[publish] Tarball archived at: ${destTgz}`));

    // --- New: also produce a ZIP inside the library's own assets/ directory ---
    try {
      const libAssetsDir = path.join(packagePath, "assets");
      ensureDir(libAssetsDir);
      const zipName = `${pkgFolder}-${finalVersion}.zip`;
      const destZip = path.join(libAssetsDir, zipName);

      // Extract the tgz to a temp dir and then zip its contents
      const tmpDir = path.join(packagePath, ".publish_tmp_extract");
      if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
      mkdirSync(tmpDir, { recursive: true });

      // Extract into tmp dir
      try {
        execSync(`tar -xzf "${destTgz}" -C "${tmpDir}"`, { stdio: "inherit" });
      } catch (e) {
        throw new Error(
          `Failed to extract tgz for zipping: ${e?.message ?? e}`
        );
      }

      // The package contents are inside a top-level folder named "package". Zip that folder.
      try {
        // If zip is not available, this will throw.
        execSync(`cd "${tmpDir}" && zip -r "${destZip}" package`, {
          stdio: "inherit",
        });
        console.log(chalk.green(`[publish] ZIP written at: ${destZip}`));
      } catch (e) {
        console.warn(
          chalk.yellow(
            `[publish] Warning: couldn't create ZIP (is 'zip' installed?). Keeping only TGZ. Error: ${e?.message ?? e}`
          )
        );
      } finally {
        // Cleanup temp dir
        rmSync(tmpDir, { recursive: true, force: true });
      }
    } catch (zipErr) {
      console.warn(
        chalk.yellow(
          `[publish] Warning while creating per-library ZIP: ${zipErr?.message ?? zipErr}`
        )
      );
    }
    // --- End new ZIP logic ---
  } catch (e) {
    console.warn(
      chalk.yellow(
        `[publish] Warning: couldn't pack/archive tarball: ${e?.message ?? e}`
      )
    );
  }

  // If we should not publish → restore and exit
  if (SKIP_PUBLISH) {
    try {
      if (existsSync(packageJsonPath)) rmSync(packageJsonPath);
      if (existsSync(backupPath)) renameSync(backupPath, packageJsonPath);
      console.log(
        chalk.gray(`[publish] Restored original package.json (SKIP_PUBLISH).`)
      );
    } catch (error) {
      console.error(
        chalk.bold.red(
          `Warning: could not restore original package.json: ${error.message}`
        )
      );
    }
    console.log(chalk.magenta(`SKIP_PUBLISH=true → publish skipped.`));
    process.exit(0);
  }

  // Publish
  try {
    console.log(chalk.blue(`Publishing package ${name} with tag "${tag}"...`));
    execSync(
      `npm publish --registry=https://npm.pkg.github.com/tascaenzo --tag ${tag}`,
      { cwd: packagePath, stdio: "inherit" }
    );
    console.log(chalk.green(`Package ${name} published successfully.`));
  } catch (error) {
    console.error(chalk.bold.red(`Error publishing package ${name}.`));
    try {
      if (existsSync(packageJsonPath)) rmSync(packageJsonPath);
      if (existsSync(backupPath)) renameSync(backupPath, packageJsonPath);
    } catch {}
    process.exit(1);
  }

  // Restore dev package.json (with workspace:* retained)
  try {
    if (existsSync(packageJsonPath)) rmSync(packageJsonPath);
    if (existsSync(backupPath)) renameSync(backupPath, packageJsonPath);
    console.log(
      chalk.gray(`[publish] Restored original package.json after publish.`)
    );
  } catch (error) {
    console.error(
      chalk.bold.red(
        `Warning: could not restore original package.json: ${error.message}`
      )
    );
  }
}

runPublishScript();
