const REQUIRED_MAJOR = 24;
const current = process.versions.node;
const major = Number(current.split(".")[0]);

if (Number.isNaN(major) || major < REQUIRED_MAJOR) {
  // biome-ignore lint/suspicious/noConsole: needed to inform the user about the required node version
  console.error(
    `\n[bgg] Node ${REQUIRED_MAJOR}+ required (found ${current}).\n` +
      `Install the latest LTS from https://nodejs.org.\n`,
  );
  process.exit(1);
}
