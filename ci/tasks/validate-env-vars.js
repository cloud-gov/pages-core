const { getMissingEnvVarsCi } = require('../../config/envVarValidator');

function main() {
  const missing = getMissingEnvVarsCi();

  if (missing.length > 0) {
    // eslint-disable-next-line
    console.error('Env variables are not initialized:\n');
    // eslint-disable-next-line
    console.error(missing);
    process.exit(1);
  }

  process.exit(0);
}

main();
