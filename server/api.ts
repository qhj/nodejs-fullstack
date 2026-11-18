import { Effect, Layer, Schema } from 'effect'
import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
} from 'effect/http-api'
import { RpcSerialization, RpcServer } from 'effect/rpc'
import { ConfigService } from '#/server/config/service.ts'
import { DatabaseService } from '#/server/database/service.ts'
import { TodoRpcPath, TodoRpcs } from '#/server/todos/rpc.ts'
import { TodoService } from '#/server/todos/service.ts'

const Api = HttpApi.make('Api')
  .add(
    HttpApiGroup.make('Probe').add(
      HttpApiEndpoint.get('ping', '/ping', {
        success: Schema.String.pipe(HttpApiSchema.asText()),
      }),
    ),
  )
  .prefix('/api')

const ProbeLive = HttpApiBuilder.group(Api, 'Probe', (handlers) =>
  handlers.handle('ping', () => Effect.succeed('pong')),
)

const TodoHandlers = TodoRpcs.toLayer(
  Effect.gen(function* () {
    const todos = yield* TodoService

    return {
      listTodos: () => todos.list,
      getTodo: ({ id }) => todos.get(id),
      createTodo: todos.create,
      updateTodo: ({ id, changes }) => todos.update(id, changes),
      deleteTodo: ({ id }) => todos.remove(id),
    }
  }),
)

const TodoRpcLive = RpcServer.layerHttp({
  group: TodoRpcs,
  path: TodoRpcPath,
  protocol: 'http',
}).pipe(
  Layer.provide([RpcSerialization.layerJson, TodoHandlers]),
  Layer.provide(TodoService.layer),
  Layer.provide(DatabaseService.layer),
)

const ApiLive = Layer.merge(
  HttpApiBuilder.layer(Api).pipe(Layer.provide(ProbeLive)),
  TodoRpcLive,
).pipe(Layer.provide(ConfigService.layer))

export { Api, ApiLive }
