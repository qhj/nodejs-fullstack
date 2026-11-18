import {
  createInsertSchema,
  createSelectSchema,
} from 'drizzle-orm/effect-schema'
import { Schema } from 'effect'
import { todos } from '#/server/database/schema.ts'

export const Todo = createSelectSchema(todos, {
  id: (id) => id.check(Schema.isGreaterThan(0)),
})

export const CreateTodo = createInsertSchema(todos, {
  title: (title) =>
    Schema.Trim.pipe(Schema.decodeTo(title.check(Schema.isNonEmpty()))),
}).mapFields(({ title }) => ({ title }))

export const UpdateTodo = Schema.Union([
  Schema.Struct({
    title: CreateTodo.fields.title,
    completed: Schema.optionalKey(Todo.fields.completed),
  }),
  Schema.Struct({
    title: Schema.optionalKey(CreateTodo.fields.title),
    completed: Todo.fields.completed,
  }),
])

export class TodoNotFound extends Schema.TaggedError<TodoNotFound>()(
  'TodoNotFound',
  { id: Todo.fields.id },
) {}

export class TodoStorageError extends Schema.TaggedError<TodoStorageError>()(
  'TodoStorageError',
  {},
) {}
