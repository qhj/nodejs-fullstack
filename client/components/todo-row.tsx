import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '#/client/components/ui/button.tsx'
import { Checkbox } from '#/client/components/ui/checkbox.tsx'
import type { Todo } from '#/server/todos/schema.ts'

interface TodoRowProps {
  todo: typeof Todo.Type
  editing: boolean
  pending: boolean
  onToggle: (completed: boolean) => void
  onEdit: () => void
  onDelete: () => void
}

export function TodoRow({
  todo,
  editing,
  pending,
  onToggle,
  onEdit,
  onDelete,
}: TodoRowProps) {
  const checkboxId = `todo-${todo.id}`

  return (
    <li
      data-editing={editing || undefined}
      className="flex min-h-16 items-center gap-2 px-4 hover:bg-muted/45 data-editing:bg-accent sm:gap-4 sm:px-6"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Checkbox
          id={checkboxId}
          className="size-5 cursor-pointer rounded-sm bg-card"
          checked={todo.completed}
          readOnly={pending}
          onCheckedChange={onToggle}
        />
        <label
          htmlFor={checkboxId}
          data-completed={todo.completed || undefined}
          className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center py-3 text-sm leading-6 wrap-anywhere data-completed:text-muted-foreground data-completed:line-through"
        >
          {todo.title}
        </label>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="text-muted-foreground"
          title="编辑"
          aria-label={`编辑 ${todo.title}`}
          onClick={onEdit}
          disabled={pending}
        >
          <Pencil aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="删除"
          aria-label={`删除 ${todo.title}`}
          onClick={onDelete}
          disabled={pending}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
    </li>
  )
}
