module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: { "^.+\\.[t|j]sx?$": "ts-jest" },
  testMatch: ["**/*.*-test.ts"],
  maxWorkers: 1
};
