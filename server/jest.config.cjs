/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '<rootDir>/tests/**/*.test.ts'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'], // Re-enabled with working ES module support
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'esnext',
        target: 'es2020',
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true
      }
    }]
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/tests/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  // Coverage ratchet: floor thresholds to prevent regression.
  // Baseline measured 2026-02-24: stmts 37.8%, branches 31.5%, funcs 42.0%, lines 38.3%
  // Target: 80% (see plans/techincal_debt/test-modernization-roadmap.md)
  coverageThreshold: {
    global: {
      statements: 35,
      branches: 29,
      functions: 40,
      lines: 36
    }
  },
  testTimeout: 30000,
  verbose: true,
  maxWorkers: 1,
  // Essential for ES modules with Jest
  moduleFileExtensions: ['ts', 'js', 'mjs'],
  // Handle ES module imports properly - map .js imports to TypeScript files and preserve ES modules
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@infra/(.*)$': '<rootDir>/src/infra/$1',
    '^@engine/(.*)$': '<rootDir>/src/engine/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@mcp/(.*)$': '<rootDir>/src/mcp/$1',
    '^(?:\\.{1,2}/)+dist/(.*)\\.js$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // node:sqlite is a native Node.js built-in (>=22); shim for Jest's module resolver
    '^node:sqlite$': '<rootDir>/tests/helpers/node-sqlite-shim.cjs'
  },
  // Transform ES modules from node_modules if needed
  transformIgnorePatterns: [
    'node_modules/(?!(@modelcontextprotocol)/)'
  ],
  // Support for dynamic imports and ES modules
  testPathIgnorePatterns: [
    '/node_modules/'
  ]
};
