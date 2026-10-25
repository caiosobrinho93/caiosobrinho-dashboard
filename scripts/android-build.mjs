import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { join, resolve } from "node:path";

const androidDir = resolve("android");
const wrapper = join(androidDir, process.platform === "win32" ? "gradlew.bat" : "gradlew");

if (!existsSync(wrapper)) {
  console.error("Projeto Android não encontrado. Rode: npx cap add android");
  process.exit(1);
}

const args = process.argv.slice(2);
const task = args[0] ?? "assembleDebug";

const child = spawn(wrapper, [task, ...args.slice(1)], {
  cwd: androidDir,
  env: process.env,
  shell: process.platform === "win32",
  stdio: "inherit",
});

child.on("exit", (code) => {
  if (code === 0) {
    const apk = join(
      androidDir,
      "app",
      "build",
      "outputs",
      "apk",
      task.startsWith("assembleRelease") ? "release" : "debug",
      task.startsWith("assembleRelease") ? "app-release-unsigned.apk" : "app-debug.apk",
    );
    if (existsSync(apk)) console.log(`APK gerado em ${apk}`);
  }
  process.exit(code ?? 1);
});
