import { cli } from "./cli-lib.ts";

const args = process.argv.slice(2);
cli(...args)
	.then((success) => process.exit(success ? 0 : 1))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
