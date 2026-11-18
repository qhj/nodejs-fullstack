import { SqliteClient } from '@effect/sql-sqlite-node'
import { makeWithDefaults } from 'drizzle-orm/effect-sqlite-node'
import { Context, Effect, Layer } from 'effect'
import { ConfigService } from '#/server/config/service.ts'

export class DatabaseService extends Context.Service<DatabaseService>()(
  'app/DatabaseService',
  { make: makeWithDefaults() },
) {
  static readonly layer = Layer.effect(
    DatabaseService,
    DatabaseService.make,
  ).pipe(
    Layer.provide(
      Layer.unwrap(
        Effect.map(ConfigService, ({ databaseConnectionString }) =>
          SqliteClient.layer({ filename: databaseConnectionString }),
        ),
      ),
    ),
  )
}
