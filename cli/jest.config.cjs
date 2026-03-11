/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'esnext',
          target: 'es2020',
          moduleResolution: 'node',
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@cli-shared/(.*)$': '<rootDir>/../server/src/cli-shared/$1',
    '^@shared/(.*)$': '<rootDir>/../server/src/shared/$1',
    '^@engine/(.*)$': '<rootDir>/../server/src/engine/$1',
    '^@modules/(.*)$': '<rootDir>/../server/src/modules/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  moduleFileExtensions: ['ts', 'js', 'mjs'],
  testTimeout: 15000,
  verbose: true,
};
