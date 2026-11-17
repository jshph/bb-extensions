import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const collection = JSON.parse(readFileSync(new URL(".bb/plugins.json", root), "utf8"));
const [task, ...names] = process.argv.slice(2);
const tasks = ["install", "check", "test", "build", "verify"];
if (!tasks.includes(task) || names.some(name => !collection.plugins.some(plugin => plugin.name === name))) {
  throw new Error(`Usage: node scripts/plugins.mjs ${tasks.join("|")} [${collection.plugins.map(plugin => plugin.name).join(" ")}]`);
}
function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
for (const plugin of collection.plugins.filter(plugin => names.length === 0 || names.includes(plugin.name))) {
  const cwd = fileURLToPath(new URL(plugin.source + "/", root));
  const manifest = JSON.parse(readFileSync(new URL(plugin.source + "/package.json", root), "utf8"));
  console.log(`\n${plugin.name}: ${task}`);
  if (task === "install") run("npm", ["ci", "--include=dev"], cwd);
  if (task === "check" || task === "verify") {
    run("npm", ["run", manifest.scripts.typecheck ? "typecheck" : "check"], cwd);
    if (manifest.scripts.lint) run("npm", ["run", "lint"], cwd);
  }
  if (task === "test" || task === "verify") run("npm", ["test"], cwd);
  if (task === "build" || task === "verify") run("bb", ["plugin", "build", "."], cwd);
}
