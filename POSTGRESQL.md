# 将 SQLite 替换为 PostgreSQL

## 开发环境

在 `flake.nix` 的开发环境 `packages` 列表中，用下面的条目替换 `sqlite`。

```nix
(writeShellScriptBin "psql" ''
  set -e
  project_root=$(git rev-parse --show-toplevel)
  exec ${lib.getExe' postgresql_18 "psql"} -h "$project_root/.dev/postgres" "$@"
'')
(writeShellScriptBin "startdb" ''
  set -e
  project_root=$(git rev-parse --show-toplevel)
  cd "$project_root"

  if [[ -f .dev/postgres/PG_VERSION ]]; then
    exec pg_ctl -D .dev/postgres -l .dev/postgres.log start
  fi

  mkdir -p .dev
  initdb -c listen_addresses= -c unix_socket_directories=. .dev/postgres
  pg_ctl -D .dev/postgres -l .dev/postgres.log start
  createdb -h "$project_root/.dev/postgres"
  createdb -h "$project_root/.dev/postgres" atlas_dev
'')
(writeShellScriptBin "stopdb" ''
  set -e
  project_root=$(git rev-parse --show-toplevel)
  exec pg_ctl -D "$project_root/.dev/postgres" stop
'')
postgresql_18
```

重新进入 `nix develop` 后，运行 `startdb`。首次启动时会创建以系统用户名命名的应用库，以及 Atlas 使用的 `atlas_dev` 空库。`psql` 是预先指定本地 Unix socket 的包装命令，`stopdb` 用于停止服务器。

在 `.env.local` 中设置应用的连接串。将 `your-user` 换成当前系统用户名，`host` 填项目内 `.dev/postgres` 的绝对路径。

```dotenv
DB_CONNECTION_STRING="postgresql:///your-user?host=/path/to/nodejs-fullstack/.dev/postgres"
```

## 依赖和 Drizzle Kit

用与项目 Effect 版本一致的 `@effect/sql-pg` 替换 SQLite 客户端。Drizzle Kit 通过 `pg` 连接 PostgreSQL。

```sh
pnpm remove @effect/sql-sqlite-node
pnpm add @effect/sql-pg@4.1.4
pnpm add -D pg
```

在 `drizzle.config.ts` 中将 `dialect` 改为 `postgresql`。`pnpm db:push` 和 `pnpm dev` 都读取上面在 `.env.local` 中设置的连接串。

## 应用连接

在 `server/database/service.ts` 中，用 `@effect/sql-pg` 的 `PgClient` 替换 `SqliteClient`，将 `makeWithDefaults` 的导入改为 `drizzle-orm/effect-postgres`，并从 `effect` 导入 `Redacted`。连接串由 `ConfigService` 提供，开发时从 `.env.local` 加载，部署时由运行环境提供。

```ts
Layer.provide(
  Layer.unwrap(
    Effect.map(ConfigService, ({ databaseConnectionString }) =>
      PgClient.layer({ url: Redacted.make(databaseConnectionString) }),
    ),
  ),
)
```

## 迁移

将 `atlas.hcl` 改为以下配置。

```hcl
env "postgres" {
  dev = "postgres:///atlas_dev?host=${urlescape(getenv("PWD"))}/.dev/postgres&search_path=public"

  schema {
    src = "file://.dev/schema.sql"
  }

  migration {
    dir = "file://atlas/migrations"
  }
}
```

在 `package.json` 中，将 `db:diff` 的 `--env sqlite` 改为 `--env postgres`。运行 `pnpm db:push` 和 `pnpm dev` 前，先将应用的表定义和查询适配器改为 PostgreSQL 版本。从项目根目录运行 `pnpm db:push` 同步开发库，再运行 `pnpm dev`。

生成首份 PostgreSQL 迁移前，删除 `atlas/migrations` 中原有的 SQLite 迁移及其 `atlas.sum`。数据库结构开发完成后、提交到 Git 前，运行 `pnpm db:diff` 生成迁移。

部署时用目标库的连接串应用已提交的迁移。

```sh
atlas migrate apply --dir file://atlas/migrations --url "$DB_CONNECTION_STRING"
```
