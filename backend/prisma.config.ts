import { defineConfig } from '@prisma/client/runtime/library';

export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL!,
    },
  },
});
