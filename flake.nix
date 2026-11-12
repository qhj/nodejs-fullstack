{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "https://channels.nixos.org/nixpkgs-unstable/nixexprs.tar.zst";
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
              typescript
              typescript-language-server
              esbuild
              (vscode-with-extensions.override {
                vscode = patchedVscodium;
                vscodeExtensions = with vscode-extensions; [
                  jnoortheen.nix-ide
                  typescript7
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
                  "js/ts.preferences.importModuleSpecifier" = "non-relative";
                  "js/ts.experimental.useTsgo" = true;
                };
              in
              ''
                mkdir -p .vscode
                ln -sf ${settings} .vscode/settings.json

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
