import { Effect, Result } from 'effect'
import { ConfigService } from '#/server/config/service.ts'

const localConfig = Effect.try({
  try: () => process.loadEnvFile('.env.local'),
  catch: (cause) =>
    new Error(
      `Failed to load .env.local. ${cause instanceof Error ? cause.message : String(cause)}`,
      { cause },
    ),
}).pipe(Effect.andThen(ConfigService.make), Effect.result)

export function loadLocalConfig() {
  const config = Effect.runSync(localConfig)

  if (Result.isFailure(config)) {
    console.error(config.failure.message)
    process.exit(1)
  }

  return config.success
}

if (import.meta.main) {
  loadLocalConfig()
}
