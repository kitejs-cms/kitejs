import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  rmSync,
} from "fs";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import inquirer from "inquirer";
import chalk from "chalk";
import path from "path";

// Define __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to enforce conditions
function invariant(condition, message) {
  if (!condition) {
    console.error(chalk.bold.red(message));
    process.exit(1);
  }
}

async function runPublishScript() {
  // Define the directory where packages are located in the monorepo
  const packagesDir = path.join(__dirname, "..", "packages");

  // Retrieve directories that contain a package.json file
  const packageNames = readdirSync(packagesDir).filter((folder) => {
    return existsSync(path.join(packagesDir, folder, "package.json"));
  });

  invariant(
    packageNames.length > 0,
    'No packages found in the "packages" directory.'
  );

  // Prompt the user to select the package, enter the base version, and choose the release tag
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
      validate: (input) => {
        const validVersion = /^\d+\.\d+\.\d+$/;
        return validVersion.test(input)
          ? true
          : "Invalid version format. Expected format: x.x.x (without pre-release)";
      },
    },
    {
      type: "list",
      name: "tag",
      message: "Select the release type:",
      choices: ["latest", "alpha", "beta", "rc"],
    },
  ]);

  // Define the package.json path and read its contents (available for any tag)
  const packageJsonPath = path.join(packagesDir, name, "package.json");
  let pkgJson = {};
  try {
    pkgJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  } catch (error) {
    console.error(chalk.bold.red("Unable to read package.json."));
    process.exit(1);
  }

  // Compose the final version based on the tag
  let finalVersion = version;
  if (tag !== "latest") {
    // For pre-release versions, check if there are already published versions
    let publishedVersions = [];

    const pkgName = pkgJson.name; // e.g., "@kitejs-cms/core"
    try {
      // Use npm view to fetch published versions from the GitHub Packages registry
      const npmViewCommand = `npm view ${pkgName} versions --json --registry=https://npm.pkg.github.com/tascaenzo`;
      const output = execSync(npmViewCommand, { encoding: "utf-8" });
      publishedVersions = JSON.parse(output);
    } catch (e) {
      // If the npm view command fails (likely no versions have been published), assume no published versions exist.
      publishedVersions = [];
    }

    // Filter the versions that match the base version for the selected tag
    let maxPreRelease = -1;
    const versionPattern = new RegExp(`^${version}-${tag}\\.(\\d+)$`);
    publishedVersions.forEach((v) => {
      const match = v.match(versionPattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxPreRelease) {
          maxPreRelease = num;
        }
      }
    });
    const defaultPreRelease = maxPreRelease + 1; // Defaults to 0 if no match is found

    // Prompt the user to input the progressive number for the pre-release version
    const { preReleaseNumber } = await inquirer.prompt([
      {
        type: "input",
        name: "preReleaseNumber",
        message: `Enter the progressive number for the ${tag} release (default: ${defaultPreRelease}):`,
        default: `${defaultPreRelease}`,
        validate: (input) => {
          const valid = /^\d+$/.test(input);
          return valid ? true : "Please enter a valid number.";
        },
      },
    ]);

    finalVersion = `${version}-${tag}.${preReleaseNumber}`;
  }
  console.log(chalk.green(`Final version will be: ${finalVersion}`));

  // Get the absolute path of the selected package
  const packagePath = path.join(packagesDir, name);

  // Remove the dist directory if it exists to ensure a clean build
  const distDir = path.join(packagePath, "dist");
  if (existsSync(distDir)) {
    console.log(
      chalk.blue(`Removing existing dist directory at ${distDir}...`)
    );
    rmSync(distDir, { recursive: true, force: true });
  }

  // Execute the build command for the package
  try {
    console.log(chalk.blue(`Building package ${name}...`));
    execSync(`npm run build`, { cwd: packagePath, stdio: "inherit" });
  } catch (error) {
    console.error(chalk.bold.red(`Error building package ${name}.`));
    process.exit(1);
  }

  // Update the version in the package.json file
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

  // Publish the package
  try {
    console.log(chalk.blue(`Publishing package ${name} with tag "${tag}"...`));
    execSync(
      `npm publish --registry=https://npm.pkg.github.com/tascaenzo --tag ${tag}`,
      {
        cwd: packagePath,
        stdio: "inherit",
      }
    );
    console.log(chalk.green(`Package ${name} published successfully.`));
  } catch (error) {
    console.error(chalk.bold.red(`Error publishing package ${name}.`));
    process.exit(1);
  }
}

runPublishScript();
