import type { Config } from "tailwindcss";

// Mirrors the host project's Tailwind setup (same brand colours and
// animations) so components look the same once migrated.
const config: Config = {
	content: ["./src/app/**/*.{ts,tsx}", "./src/ui/**/*.{ts,tsx}"],
	theme: {
		extend: {
			transitionProperty: {
				"transform-opacity": "transform, opacity",
			},
			animation: {
				"fly-in": "flyIn 0.8s cubic-bezier(0.77, 0, 0.175, 1) forwards",
			},
			keyframes: {
				flyIn: {
					"0%": { transform: "translateY(50px)", opacity: "0" },
					"100%": { transform: "translateY(0)", opacity: "1" },
				},
			},
			colors: {
				"rbm-blue": "#2563EB",
				"rbm-green": "#7DD865",
			},
		},
	},
	plugins: [],
};

export default config;
