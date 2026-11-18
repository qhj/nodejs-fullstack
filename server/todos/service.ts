import { asc, eq } from 'drizzle-orm'
import type { EffectDrizzleQueryError } from 'drizzle-orm/effect-core'
import { Cause, Context, Effect, Layer } from 'effect'
import { isSqlError } from 'effect/sql/SqlError'
import { todos } from '#/server/database/schema.ts'
import { DatabaseService } from '#/server/database/service.ts'
import {
  type CreateTodo,
  TodoNotFound,
  TodoStorageError,
  type UpdateTodo,
} from '#/server/todos/schema.ts'

const handleDatabaseError = Effect.catch((error: EffectDrizzleQueryError) => {
  const failure = Cause.isCause(error.cause)
    ? Cause.squash(error.cause)
    : error.cause
  const cause = isSqlError(failure) ? failure.reason.cause : failure
  const message =
    cause instanceof Error
      ? `Todo database query failed: ${cause.message}`
      : 'Todo database query failed'

  return Effect.logError(message).pipe(
    Effect.andThen(Effect.fail(new TodoStorageError({}))),
  )
})

const requireTodo =
  (id: number) =>
  <A>(row: A | undefined) =>
    row === undefined
      ? Effect.fail(new TodoNotFound({ id }))
      : Effect.succeed(row)

export class TodoService extends Context.Service<TodoService>()(
  'app/TodoService',
  {
    make: Effect.gen(function* () {
      const db = yield* DatabaseService

      const list = db
        .select()
        .from(todos)
        .orderBy(asc(todos.id))
        .all()
        .pipe(handleDatabaseError)

      const get = (id: number) =>
        db
          .select()
          .from(todos)
          .where(eq(todos.id, id))
          .get()
          .pipe(handleDatabaseError, Effect.flatMap(requireTodo(id)))

      const create = (input: typeof CreateTodo.Type) =>
        db
          .insert(todos)
          .values(input)
          .returning()
          .get()
          .pipe(handleDatabaseError)

      const update = (id: number, input: typeof UpdateTodo.Type) =>
        db
          .update(todos)
          .set(input)
          .where(eq(todos.id, id))
          .returning()
          .get()
          .pipe(handleDatabaseError, Effect.flatMap(requireTodo(id)))

      const remove = (id: number) =>
        db
          .delete(todos)
          .where(eq(todos.id, id))
          .returning({ id: todos.id })
          .get()
          .pipe(
            handleDatabaseError,
            Effect.flatMap(requireTodo(id)),
            Effect.asVoid,
          )

      return { list, get, create, update, remove }
    }),
  },
) {
  static readonly layer = Layer.effect(TodoService, TodoService.make)
}
