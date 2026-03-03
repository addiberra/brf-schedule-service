import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

declare const process: { env: Record<string, string | undefined> };

const baseFromEnv = process.env.BASE_PATH;
const base =
  baseFromEnv && baseFromEnv.length > 0
    ? baseFromEnv.endsWith('/')
      ? baseFromEnv
      : `${baseFromEnv}/`
    : '/';

export default defineConfig({
  base,
  plugins: [tailwindcss(), svelte()],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
