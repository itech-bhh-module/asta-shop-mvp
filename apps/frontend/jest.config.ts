import type { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest',
  // Wenn du später echte React-Komponenten (mit HTML) testen willst,
  // musst du 'node' hier vielleicht in 'jsdom' ändern. Für unseren Dummy-Test reicht das aber:
  testEnvironment: 'node',
}

export default jestConfig