# nodejs-fullstack

基于 Node.js 的 TypeScript 全栈模板

## 技术栈

### 后端

- 运行时：Node.js 26
- 语言：TypeScript
- 框架：Effect 4
- 数据库：SQLite
- ORM：Drizzle ORM
- 构建：esbuild

### 工具链

- 包管理器：pnpm
- 数据库迁移：Atlas
- 代码检查与格式化：Biome
- 开发环境：Nix Flakes

## 代码规范

- 自定义组件：放在 `client/components`
- 模块导入：使用 `#/` 子路径，禁用相对导入
- 错误处理：禁用 `throw`，使用 Effect 错误通道

## 命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动开发服务器，加载 `.env.local`，监听服务端代码并启用前端热更新 |
| `pnpm db:push` | 将当前数据库结构直接同步到本地 SQLite 数据库 |
| `pnpm db:export` | 将当前数据库结构导出到 `.dev/schema.sql` |
| `pnpm db:diff` | 导出数据库结构，并使用 Atlas 生成迁移文件 |
| `pnpm check` | 执行 Biome 检查和 TypeScript 类型检查 |
| `pnpm lint:fix` | 使用 Biome 修复可安全修复的 lint 问题 |
| `pnpm fmt:fix` | 使用 Biome 格式化代码 |
| `pnpm typecheck` | 检查 TypeScript 类型 |
| `pnpm build:server` | 使用 esbuild 构建服务端代码 |
| `pnpm build` | 清理并构建服务端和前端生产产物 |

## 数据库

### 开发

启动开发服务或运行 `db:push`、`db:export`、`db:diff` 前，在 `.env.local` 中设置 `DB_CONNECTION_STRING`。下面以 `.dev/app.sqlite` 为例。

```dotenv
DB_CONNECTION_STRING=.dev/app.sqlite
```

执行以下命令同步数据库结构。

```sh
pnpm db:push
```

`db:push` 不生成迁移文件。
数据库结构开发完成后、提交到 git 前，使用 Atlas 生成迁移文件：

```sh
pnpm db:diff
```

### 部署

部署时应用已经提交的迁移：

```sh
atlas migrate apply --dir file://atlas/migrations --url <database-url>
```

## [将 SQLite 替换为 PostgreSQL](POSTGRESQL.md)
