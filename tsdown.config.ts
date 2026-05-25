import { defineConfig } from "tsdown";

export default defineConfig({
	dts: true,
	exports: true,
	format: "esm",
	platform: "neutral",
	minify: true,
});
