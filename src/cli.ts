import { cli } from "./cli-lib";

const args = process.argv.slice(2);
cli(...args).then((success) => process.exit(success ? 0 : 1));
