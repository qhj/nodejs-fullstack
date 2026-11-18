import { Effect, Exit, Layer } from 'effect'
import { FetchHttpClient } from 'effect/http'
import { RpcClient, RpcSerialization } from 'effect/rpc'
import { type SubmitEvent, useEffect, useState } from 'react'
import { TodoRpcPath, TodoRpcs } from '#/server/todos/rpc.ts'
import type { Todo } from '#/server/todos/schema.ts'

const TodoClientLive = RpcClient.layerProtocolHttp({
  url: new URL(TodoRpcPath, globalThis.location.origin).href,
}).pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerJson]))

const makeTodoClient = RpcClient.make(TodoRpcs)

type TodoClient = Effect.Success<typeof makeTodoClient>
type TodoItem = typeof Todo.Type

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
    <main>
      <h1>待办事项</h1>
      <form onSubmit={submit}>
        <label>
          标题{' '}
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
            disabled={pending || todos === null}
            required
          />
        </label>{' '}
        <button
          type="submit"
          disabled={pending || todos === null || !title.trim()}
        >
          {editingId === null ? '添加' : '保存'}
        </button>{' '}
        {editingId !== null && (
          <button type="button" onClick={resetForm} disabled={pending}>
            取消编辑
          </button>
        )}
      </form>
      {error && <p role="alert">{error}</p>}
      {todos === null &&
        (pending ? (
          <p role="status">正在加载待办事项…</p>
        ) : (
          <button
            type="button"
            onClick={() =>
              void perform(
                (client) => client.listTodos(),
                setTodos,
                '加载待办失败。',
              )
            }
          >
            重试
          </button>
        ))}
      {todos?.length === 0 && <p>暂无待办事项。</p>}
      {todos && todos.length > 0 && (
        <ul>
          {todos.map((todo) => (
            <li key={todo.id}>
              <label>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  disabled={pending}
                  onChange={(event) => {
                    const completed = event.currentTarget.checked
                    void perform(
                      (client) =>
                        client.updateTodo({
                          id: todo.id,
                          changes: { completed },
                        }),
                      replaceTodo,
                      '更新完成状态失败，请重试。',
                    )
                  }}
                />{' '}
                {todo.title}
              </label>{' '}
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setEditingId(todo.id)
                  setTitle(todo.title)
                }}
              >
                编辑
              </button>{' '}
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  void perform(
                    (client) => client.deleteTodo({ id: todo.id }),
                    () => {
                      setTodos(
                        (items) =>
                          items?.filter((item) => item.id !== todo.id) ?? null,
                      )
                      if (editingId === todo.id) resetForm()
                    },
                    '删除待办失败，请重试。',
                  )
                }
              >
                删除
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
