module.exports = {
  "roots": [
    "<rootDir>"
  ],
  "testMatch": [
    "**/__specs__/specs/**/*.+(spec).+(ts|tsx)",
    "**/__specs__/?(*.)+(spec).+(ts|tsx)"
  ],
  "transform": {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  "setupFiles": ["./__specs__/setup/envVars.js"],
  "setupFilesAfterEnv": ["./__specs__/setup/envVars.js"],
  "testPathIgnorePatterns": ["/node_modules/"],
  // "collectCoverage": true
}