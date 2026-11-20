import { Effect, Exit, Layer } from 'effect'
import { FetchHttpClient } from 'effect/http'
import { RpcClient, RpcSerialization } from 'effect/rpc'
import {
  CircleAlert,
  ClipboardList,
  ListChecks,
  LoaderCircle,
  Plus,
} from 'lucide-react'
import { type SubmitEvent, useEffect, useRef, useState } from 'react'
import { TodoProgress } from '#/client/components/todo-progress.tsx'
import { TodoRow } from '#/client/components/todo-row.tsx'
import { Button } from '#/client/components/ui/button.tsx'
import { Input } from '#/client/components/ui/input.tsx'
import { TodoRpcPath, TodoRpcs } from '#/server/todos/rpc.ts'
import type { Todo } from '#/server/todos/schema.ts'

const TodoClientLive = RpcClient.layerProtocolHttp({
  url: new URL(TodoRpcPath, globalThis.location.origin).href,
}).pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerJson]))

const makeTodoClient = RpcClient.make(TodoRpcs)

type TodoClient = Effect.Success<typeof makeTodoClient>
type TodoItem = typeof Todo.Type

const todoFilters = [
  { value: 'all', label: '全部', empty: '暂无待办事项' },
  { value: 'active', label: '待完成', empty: '没有待完成的事项' },
  { value: 'completed', label: '已完成', empty: '还没有已完成的事项' },
] as const

type TodoFilter = (typeof todoFilters)[number]['value']

const runTodo = <A, E>(
  request: (client: TodoClient) => Effect.Effect<A, E>,
  signal?: AbortSignal,
) =>
  Effect.runPromiseExit(
    makeTodoClient.pipe(
      Effect.flatMap(request),
      Effect.scoped,
      Effect.provide(TodoClientLive),
    ),
    { signal },
  )

export function App() {
  const [todos, setTodos] = useState<readonly TodoItem[] | null>(null)
  const [title, setTitle] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [pending, setPending] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<TodoFilter>('all')
  const titleInput = useRef<HTMLInputElement>(null)

  const completedCount = todos?.filter((todo) => todo.completed).length ?? 0
  const visibleTodos =
    filter === 'all'
      ? todos
      : todos?.filter((todo) => todo.completed === (filter === 'completed'))
  const emptyMessage = todoFilters.find(
    (option) => option.value === filter,
  )?.empty

  useEffect(() => {
    const controller = new AbortController()
    void runTodo((client) => client.listTodos(), controller.signal).then(
      (result) => {
        if (controller.signal.aborted) return
        if (Exit.isSuccess(result)) setTodos(result.value)
        else setError('加载待办失败。')
        setPending(false)
      },
    )
    return () => controller.abort()
  }, [])

  const perform = async <A, E>(
    request: (client: TodoClient) => Effect.Effect<A, E>,
    onSuccess: (value: A) => void,
    failureMessage: string,
  ) => {
    setPending(true)
    setError(null)
    const result = await runTodo(request)
    if (Exit.isSuccess(result)) onSuccess(result.value)
    else setError(failureMessage)
    setPending(false)
  }

  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    titleInput.current?.focus()
  }

  const replaceTodo = (updated: TodoItem) => {
    setTodos(
      (items) =>
        items?.map((item) => (item.id === updated.id ? updated : item)) ?? null,
    )
  }

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextTitle = title.trim()
    if (nextTitle === '' || pending || todos === null) return

    if (editingId === null) {
      void perform(
        (client) => client.createTodo({ title: nextTitle }),
        (created) => {
          setTodos((items) => [...(items ?? []), created])
          setFilter((current) => (current === 'completed' ? 'all' : current))
          resetForm()
        },
        '添加待办失败，请重试。',
      )
    } else {
      void perform(
        (client) =>
          client.updateTodo({ id: editingId, changes: { title: nextTitle } }),
        (updated) => {
          replaceTodo(updated)
          resetForm()
        },
        '保存标题失败，请重试。',
      )
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pt-10 pb-12 sm:px-8 sm:pt-16 lg:pt-20">
      <header className="mb-7 flex items-center gap-3 sm:mb-9 sm:gap-4">
        <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm sm:size-12">
          <ListChecks aria-hidden="true" className="size-6" />
        </span>
        <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
          待办事项
        </h1>
      </header>

      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_15.5rem] lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-6">
        <section
          aria-labelledby="todos-heading"
          className="min-w-0 overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm"
        >
          <div className="px-4 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-5">
            <h2 id="todos-heading" className="text-lg font-semibold">
              任务清单
            </h2>
            <form className="mt-4 flex items-center gap-2" onSubmit={submit}>
              <label htmlFor="todo-title" className="sr-only">
                {editingId === null ? '新任务标题' : '编辑任务标题'}
              </label>
              <Input
                ref={titleInput}
                id="todo-title"
                className="h-11 flex-1 bg-card px-3 sm:text-sm"
                type="text"
                placeholder={
                  editingId === null ? '添加一项待办…' : '输入任务标题…'
                }
                value={title}
                onChange={(event) => setTitle(event.currentTarget.value)}
                disabled={todos === null}
                readOnly={pending}
                required
              />
              <Button
                type="submit"
                className="h-11 px-3 sm:px-4"
                disabled={pending || todos === null || !title.trim()}
              >
                {editingId === null && (
                  <Plus data-icon="inline-start" aria-hidden="true" />
                )}
                {editingId === null ? '添加' : '保存'}
              </Button>
              {editingId !== null && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 px-3"
                  onClick={resetForm}
                  disabled={pending}
                >
                  取消
                </Button>
              )}
            </form>
          </div>

          <div className="border-y bg-muted/40 px-4 py-2.5 sm:px-6">
            <fieldset className="flex flex-wrap gap-1.5">
              <legend className="sr-only">按任务状态筛选</legend>
              {todoFilters.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant="ghost"
                  className="h-9 px-3 text-muted-foreground aria-pressed:bg-accent aria-pressed:text-accent-foreground"
                  aria-pressed={filter === option.value}
                  disabled={todos === null}
                  onClick={() => setFilter(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </fieldset>
          </div>

          {error && (
            <div className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive sm:mx-6">
              <p role="alert" className="flex items-center gap-2">
                <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
                {error}
              </p>
              {todos === null && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() =>
                    void perform(
                      (client) => client.listTodos(),
                      setTodos,
                      '加载待办失败。',
                    )
                  }
                >
                  重试
                </Button>
              )}
            </div>
          )}

          {todos === null && pending && (
            <p
              role="status"
              className="flex min-h-44 items-center justify-center gap-2 px-4 text-sm text-muted-foreground"
            >
              <LoaderCircle
                aria-hidden="true"
                className="size-4 motion-safe:animate-spin"
              />
              正在加载待办事项…
            </p>
          )}
          {visibleTodos?.length === 0 && (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-4 py-8 text-center">
              <span className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <ClipboardList aria-hidden="true" className="size-6" />
              </span>
              <div>
                <p className="text-sm font-medium">{emptyMessage}</p>
                {filter === 'all' && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    在上方输入标题，添加第一项待办。
                  </p>
                )}
              </div>
            </div>
          )}
          {visibleTodos && visibleTodos.length > 0 && (
            <ul className="divide-y">
              {visibleTodos.map((todo) => (
                <TodoRow
                  key={todo.id}
                  todo={todo}
                  editing={editingId === todo.id}
                  pending={pending}
                  onToggle={(completed) =>
                    void perform(
                      (client) =>
                        client.updateTodo({
                          id: todo.id,
                          changes: { completed },
                        }),
                      replaceTodo,
                      '更新完成状态失败，请重试。',
                    )
                  }
                  onEdit={() => {
                    setEditingId(todo.id)
                    setTitle(todo.title)
                    titleInput.current?.focus()
                  }}
                  onDelete={() =>
                    void perform(
                      (client) => client.deleteTodo({ id: todo.id }),
                      () => {
                        setTodos(
                          (items) =>
                            items?.filter((item) => item.id !== todo.id) ??
                            null,
                        )
                        if (editingId === todo.id) resetForm()
                      },
                      '删除待办失败，请重试。',
                    )
                  }
                />
              ))}
            </ul>
          )}
        </section>

        <TodoProgress
          total={todos?.length ?? null}
          completed={completedCount}
        />
      </div>
    </main>
  )
}
