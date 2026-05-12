export default {
	"**/*.ts?(x)": [
		() => "tsc -p tsconfig.json --noEmit",
		"eslint --max-warnings 0 --no-warn-ignored",
		"vitest related --run",
	],
	"*": "prettier --ignore-unknown --write",
};
