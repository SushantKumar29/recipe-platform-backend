import type { Config } from "jest";

const config: Config = {
	preset: "ts-jest",
	testEnvironment: "node",

	moduleFileExtensions: ["ts", "js", "json"],

	transform: {
		"^.+\\.tsx?$": [
			"ts-jest",
			{
				tsconfig: "tsconfig.jest.json",
			},
		],
	},

	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1",
	},

	setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],

	testMatch: ["**/tests/**/*.test.ts"],

	testPathIgnorePatterns: ["/node_modules/", "/dist/"],

	clearMocks: true,
	silent: true,
	verbose: true,
	testTimeout: 30000,
};

export default config;
