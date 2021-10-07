import { hello } from ".";

describe("Greeting", () => {
	it("greets properly", () => {
		expect(hello()).toBe("world");
	});
});
