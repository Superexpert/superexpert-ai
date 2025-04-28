// jest.config.ts  –  loads the ESM-only framework package
import type { Config } from 'jest';
import nextJest from 'next/jest';

/** Packages in node_modules whose ESM we want SWC to transpile */
const esModules = ['@superexpert-ai/framework'].join('|');

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  /* core */
  testEnvironment: 'node',
  coverageProvider: 'v8',
  clearMocks: true,

  /* discovery */
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/adapters/llm-adapters/slow/',
    '/__tests__/known-issues/',
  ],

  /* path aliases */
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },



  /* extra search roots (monorepo-friendly) */
  moduleDirectories: [
    'node_modules',
    '<rootDir>',
    '<rootDir>/../node_modules',
  ],
};

export default createJestConfig(config);


// import type { Config } from 'jest';
// import nextJest from 'next/jest';

// const createJestConfig = nextJest({
//   // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
//   dir: './',
// });

// const config: Config = {
//   coverageProvider: 'v8',
//   testEnvironment: 'node',
//   setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
//   moduleNameMapper: {
//     '^@/(.*)$': '<rootDir>/src/$1', // Adjust this if you use a different baseUrl
//     '^@superexpert-ai/framework$':
//       '<rootDir>/node_modules/@superexpert-ai/framework/dist/index.js',
//   },
//   clearMocks: true,
//   testPathIgnorePatterns: ['/node_modules/', '/__tests__/adapters/llm-adapters/slow/', '/__tests__/known-issues/'],
// };

// export default createJestConfig(config);