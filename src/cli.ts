import { cli } from "./cli-lib";

const args = process.argv.slice(2);
cli(args[0], args[1]).then((success) => process.exit(success ? 0 : 1));
