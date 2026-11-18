# 项目约定

- 遵循 `README.md` 中记录的技术栈、代码规范和开发流程。
- 项目已处于 `nix develop` 环境中，如果缺少所需工具，使用 `nix shell nixpkgs#<package> -c <command>` 临时运行。
- 更新 Flake 依赖时，同步检查 Nix 开发环境中的 Biome 版本，并将 `biome.json` 的 `$schema` 和配置更新到对应版本。
- 执行 `pnpm update -L` 后，检查 `effect`、`@effect/platform-node` 和 `@effect/sql-sqlite-node` 的版本；若任一版本变化，查询包含对应版本的上游发布提交，更新 `flake.nix` 中 `effect-src` 的提交地址，并运行 `nix flake lock` 更新锁文件，确保 `$EFFECT_SOURCE` 指向的源码与依赖版本一致。

## Effect 源码参考

- `nix develop` 通过 `EFFECT_SOURCE` 提供与项目依赖版本对应的 Effect 仓库源码。
- 编写 Effect 代码时，查阅该仓库中的实现、测试和示例，学习惯用写法、模块结构与 API 设计；优先依据这些材料，而不是猜测或仅凭网页片段。
- 将 `$EFFECT_SOURCE` 中的仓库作为只读参考，不修改其中的文件。
- 不从 `$EFFECT_SOURCE` 导入代码；应用代码继续从 `package.json` 声明的依赖包导入。