import { homepage as base } from "./package.json";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	base,
	optimizeDeps: {
		exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
	},
});
