import { createServer, IncomingMessage, ServerResponse } from 'node:http'
import {
  NodeHttpServer,
  NodeHttpServerRequest,
  NodeRuntime,
} from '@effect/platform-node'
import { Effect, Layer } from 'effect'
import {
  HttpRouter,
  type HttpServerRequest,
  HttpServerResponse,
} from 'effect/http'
import { createServer as createViteServer } from 'vite'
import { ApiLive } from '#/server/api.ts'

const vite = await createViteServer({
  server: {
    middlewareMode: true,
  },
})

const viteHandler = (request: HttpServerRequest.HttpServerRequest) =>
  Effect.callback<HttpServerResponse.HttpServerResponse>((resume) => {
    const incoming = NodeHttpServerRequest.toIncomingMessage(request)
    const response = NodeHttpServerRequest.toServerResponse(request)
    if (
      !(incoming instanceof IncomingMessage) ||
      !(response instanceof ServerResponse)
    ) {
      resume(Effect.succeed(HttpServerResponse.empty({ status: 500 })))
      return
    }

    const complete = () =>
      resume(
        Effect.succeed(
          HttpServerResponse.empty({ status: response.statusCode }),
        ),
      )

    response.once('finish', complete)
    response.once('close', complete)

    vite.middlewares(incoming, response, () =>
      resume(Effect.succeed(HttpServerResponse.empty({ status: 404 }))),
    )
  })

const app = Layer.mergeAll(
  ApiLive,
  HttpRouter.add('*', '/api/*', HttpServerResponse.empty({ status: 404 })),
  HttpRouter.add('*', '*', viteHandler).pipe(
    Layer.provide(HttpRouter.disableLogger),
  ),
)

const serverLive = HttpRouter.serve(app).pipe(
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
)

NodeRuntime.runMain(Layer.launch(serverLive))
