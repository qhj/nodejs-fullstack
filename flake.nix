{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "https://channels.nixos.org/nixpkgs-unstable/nixexprs.tar.zst";
    effect-src = {
      url = "github:Effect-TS/effect/effect@4.1.4";
      flake = false;
    };
  };

  outputs =
    inputs:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
      ];
      forAllSystems =
        f:
        inputs.nixpkgs.lib.genAttrs systems (
          system:
          f system (
            import inputs.nixpkgs {
              inherit system;
            }
          )
        );
    in
    {
      devShells = forAllSystems (
        _: pkgs:
        let
          typescript7 = pkgs.callPackage ./nix/typescript-native-preview.nix { };
          patchedVscodium = pkgs.callPackage ./nix/vscodium.nix { };
        in
        {
          default = pkgs.mkShellNoCC {
            packages = with pkgs; [
              bashInteractive
              git
              nixd
              nixfmt
              nodejs-slim_26
              pnpm
              biome
              atlas
              sqlite
              esbuild
              typescript
              typescript-language-server
              (vscode-with-extensions.override {
                vscode = patchedVscodium;
                vscodeExtensions =
                  (with vscode-extensions; [
                    jnoortheen.nix-ide
                    typescript7
                    biomejs.biome
                    hashicorp.hcl
                  ])
                  ++ vscode-utils.extensionsFromVscodeMarketplace [
                    {
                      name = "fluid-diff";
                      publisher = "steinsfu";
                      version = "1.3.0";
                      hash = "sha256-Y6sfOTdv269wPafNQj/vtHHdLQJ9EyR7wVrOoTZdPXg=";
                    }
                  ];
              })
            ];

            shellHook =
              with pkgs;
              let
                settings = writers.writeJSON "settings.json" {
                  "terminal.integrated.defaultProfile.linux" = "fish";
                  "explorer.compactFolders" = false;
                  "nix.enableLanguageServer" = true;
                  "nix.serverPath" = "nixd";
                  "nix.formatterPath" = "nixfmt";
                  "[nix]" = {
                    "editor.defaultFormatter" = "jnoortheen.nix-ide";
                  };
                  "editor.formatOnSave" = true;
                  "editor.defaultFormatter" = "biomejs.biome";
                  "editor.codeActionsOnSave" = {
                    "source.organizeImports.biome" = "explicit";
                  };
                  "json.schemaDownload.trustedDomains" = {
                    "https://biomejs.dev" = true;
                  };
                  "js/ts.preferences.importModuleSpecifier" = "non-relative";
                  "js/ts.experimental.useTsgo" = true;
                };
              in
              ''
                mkdir -p .vscode
                ln -sf ${settings} .vscode/settings.json

                export EFFECT_SOURCE="${inputs.effect-src}"
                export SHELL=${inputs.nixpkgs.lib.getExe fish}

                if [[ $- == *i* ]]; then
                  exec "$SHELL"
                fi
              '';
          };
        }
      );
    };
}
