import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  skipNodeModulesBundle: true,
  external: ['react', 'react-dom', '@speakbetter/core'],
  platform: 'neutral',
  target: 'es2020',
});
