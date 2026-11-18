import { Schema } from 'effect'
import { Rpc, RpcGroup } from 'effect/rpc'
import {
  CreateTodo,
  Todo,
  TodoNotFound,
  TodoStorageError,
  UpdateTodo,
} from '#/server/todos/schema.ts'

export const TodoRpcPath = '/api/rpc'

const TodoById = { id: Todo.fields.id }
const TodoError = Schema.Union([TodoNotFound, TodoStorageError])

export const TodoRpcs = RpcGroup.make(
  Rpc.make('listTodos', {
    success: Schema.Array(Todo),
    error: TodoStorageError,
  }),
  Rpc.make('getTodo', {
    payload: TodoById,
    success: Todo,
    error: TodoError,
  }),
  Rpc.make('createTodo', {
    payload: CreateTodo,
    success: Todo,
    error: TodoStorageError,
  }),
  Rpc.make('updateTodo', {
    payload: { ...TodoById, changes: UpdateTodo },
    success: Todo,
    error: TodoError,
  }),
  Rpc.make('deleteTodo', {
    payload: TodoById,
    error: TodoError,
  }),
)
