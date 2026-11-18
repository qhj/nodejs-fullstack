import { Config, Context, Layer } from 'effect'

export class ConfigService extends Context.Service<ConfigService>()(
  'app/ConfigService',
  {
    make: Config.all({
      databaseConnectionString: Config.NonEmptyString('DB_CONNECTION_STRING'),
    }),
  },
) {
  static readonly layer = Layer.effect(ConfigService, ConfigService.make)
}
