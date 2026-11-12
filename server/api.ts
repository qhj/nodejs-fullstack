import { Effect, Layer, Schema } from 'effect'
import { HttpApi, HttpApiBuilder, HttpApiEndpoint, HttpApiGroup, HttpApiSchema, HttpApiSecurity } from 'effect/http-api'

const Api = HttpApi.make('Api').add(
  HttpApiGroup.make('Probe')
    .add(
      HttpApiEndpoint.get('ping', '/ping', {
        success: Schema.String.pipe(HttpApiSchema.asText()),
      }),
    )
    .prefix('/api'),
)

const ProbeLive = HttpApiBuilder.group(Api, 'Probe', (handlers) =>
  handlers
    .handle('ping', () => Effect.succeed('pong'))
  ,
)

const ApiLive = HttpApiBuilder.layer(Api).pipe(
  Layer.provide(ProbeLive),
)

export { Api, ApiLive }