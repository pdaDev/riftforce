import type { Config } from "@jest/types"

const config: Config.InitialOptions = {
    verbose: true,
    testPathIgnorePatterns: ["src"],
    transform: {
        "^.+\\.tsx?$": "ts-jest",
    },
    moduleNameMapper: {
        "\\.(css|scss)$": "identity-obj-proxy",
    },
}

export default config
