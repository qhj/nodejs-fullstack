import { createServer } from 'node:http'
import { NodeHttpServer, NodeRuntime } from '@effect/platform-node'
import { Layer } from 'effect'
import { HttpRouter } from 'effect/http'
import { ApiLive } from '#/server/api.ts'

const ServerLive = HttpRouter.serve(ApiLive).pipe(
  Layer.provide(
    NodeHttpServer.layer(createServer, { port: 3000, ipv6Only: false }),
  ),
)

NodeRuntime.runMain(Layer.launch(ServerLive))