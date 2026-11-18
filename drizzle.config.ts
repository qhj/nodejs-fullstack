import { defineConfig } from 'drizzle-kit'
import { loadLocalConfig } from '#/scripts/load-local-env.ts'

const { databaseConnectionString } = loadLocalConfig()

export default defineConfig({
  dialect: 'sqlite',
  schema: './server/database/schema.ts',
  dbCredentials: { url: databaseConnectionString },
})
