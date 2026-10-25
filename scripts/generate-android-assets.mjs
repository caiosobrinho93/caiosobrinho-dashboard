import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import sharp from "sharp";

const source = "public/icon.svg";
const resourcesDir = "resources";
const resDir = "android/app/src/main/res";

const mipmapSizes = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

const foregroundSizes = {
  mdpi: 108,
  hdpi: 162,
  xhdpi: 216,
  xxhdpi: 324,
  xxxhdpi: 432,
};

const splashSizes = {
  "drawable-port-mdpi": [320, 480],
  "drawable-port-hdpi": [480, 800],
  "drawable-port-xhdpi": [720, 1280],
  "drawable-port-xxhdpi": [960, 1600],
  "drawable-port-xxxhdpi": [1280, 1920],
  "drawable-land-mdpi": [480, 320],
  "drawable-land-hdpi": [800, 480],
  "drawable-land-xhdpi": [1280, 720],
  "drawable-land-xxhdpi": [1600, 960],
  "drawable-land-xxxhdpi": [1920, 1280],
};

async function writePng(input, file) {
  await mkdir(dirname(file), { recursive: true });
  await sharp(input).png({ compressionLevel: 9 }).toFile(file);
  console.log(`generated ${file}`);
}

async function renderIcon(size) {
  return sharp(source).resize(size, size).png().toBuffer();
}

async function renderRoundIcon(size) {
  const icon = await renderIcon(size);
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#ffffff"/></svg>`,
  );
  return sharp(icon)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function renderRoundedIcon(size) {
  const icon = await renderIcon(size);
  const radius = Math.round(size * 0.22);
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" rx="${radius}" fill="#ffffff"/></svg>`,
  );
  return sharp(icon)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function renderAdaptiveForeground(size) {
  const inner = Math.round(size * 0.7);
  const icon = await renderRoundedIcon(inner);
  const left = Math.round((size - inner) / 2);
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: icon, left, top: left }])
    .png()
    .toBuffer();
}

async function renderSplash(width, height) {
  const min = Math.min(width, height);
  const logoSize = Math.round(min * 0.18);
  const logoLeft = Math.round((width - logoSize) / 2);
  const logoTop = Math.round(height * 0.5 - logoSize * 0.72);
  const titleSize = Math.max(16, Math.round(min * 0.04));
  const subtitleSize = Math.max(9, Math.round(min * 0.018));
  const titleY = Math.round(height * 0.5 + logoSize * 0.48);
  const subtitleY = titleY + Math.round(titleSize * 1.55);

  const background = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#181818"/>
      <circle cx="${width * 0.78}" cy="${height * 0.18}" r="${min * 0.36}" fill="#0e639c" opacity="0.09"/>
      <circle cx="${width * 0.16}" cy="${height * 0.88}" r="${min * 0.28}" fill="#3794ff" opacity="0.06"/>
      <text x="${width / 2}" y="${titleY}" text-anchor="middle" fill="#f0f0f0"
        font-family="Segoe UI, Arial, sans-serif" font-size="${titleSize}" font-weight="600"
        letter-spacing="-0.5">Dashboard <tspan fill="#3794ff">pessoal</tspan></text>
      <text x="${width / 2}" y="${subtitleY}" text-anchor="middle" fill="#858585"
        font-family="Consolas, monospace" font-size="${subtitleSize}" letter-spacing="1.2">WORKSPACE LOCAL</text>
      <rect x="${width / 2 - min * 0.04}" y="${subtitleY + subtitleSize * 1.8}" width="${min * 0.08}" height="2" rx="1" fill="#3794ff" opacity="0.7"/>
    </svg>`,
  );

  const logo = await renderRoundedIcon(logoSize);
  return sharp(background)
    .composite([{ input: logo, left: logoLeft, top: logoTop }])
    .png()
    .toBuffer();
}

async function main() {
  await mkdir(resourcesDir, { recursive: true });

  await writePng(await renderIcon(1024), join(resourcesDir, "icon.png"));
  await writePng(await renderSplash(2732, 2732), join(resourcesDir, "splash.png"));

  if (!existsSync(resDir)) {
    console.warn("Android não encontrado. Rode `npx cap add android` e execute novamente.");
    return;
  }

  for (const [density, size] of Object.entries(mipmapSizes)) {
    const dir = join(resDir, `mipmap-${density}`);
    await writePng(await renderIcon(size), join(dir, "ic_launcher.png"));
    await writePng(await renderRoundIcon(size), join(dir, "ic_launcher_round.png"));
  }

  for (const [density, size] of Object.entries(foregroundSizes)) {
    const dir = join(resDir, `mipmap-${density}`);
    await writePng(
      await renderAdaptiveForeground(size),
      join(dir, "ic_launcher_foreground.png"),
    );
  }

  for (const [dirName, [width, height]] of Object.entries(splashSizes)) {
    await writePng(
      await renderSplash(width, height),
      join(resDir, dirName, "splash.png"),
    );
  }

  await writePng(await renderSplash(480, 320), join(resDir, "drawable", "splash.png"));

  const colors = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="appBackground">#181818</color>
    <color name="colorPrimary">#0E639C</color>
    <color name="colorPrimaryDark">#181818</color>
    <color name="colorAccent">#3794FF</color>
</resources>
`;
  await writeFile(join(resDir, "values", "colors.xml"), colors);

  const launcherBackground = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0B4F7D</color>
</resources>
`;
  await writeFile(
    join(resDir, "values", "ic_launcher_background.xml"),
    launcherBackground,
  );
  console.log("generated Android colors.xml and adaptive icon background");
}

await main();
