import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  sourcemap: true,
  clean: true,
  format: ['cjs', 'esm'],
  dts: true,
  external: ['firebase', '@google-cloud/speech', '@google-cloud/text-to-speech'],
});
