{ vscodium }:

vscodium.overrideAttrs (old: {
  postPatch = (old.postPatch or "") + ''
    substituteInPlace \
      resources/app/extensions/typescript-language-features/dist/extension.js \
      --replace-fail \
      '["typescriptteam.vscode-typescript","typescriptteam.vscode-typescript-nightly",' \
      '["typescriptteam.vscode-typescript","typescriptteam.vscode-typescript-nightly","local-publisher.native-preview",'

    substituteInPlace resources/app/product.json \
      --replace-fail \
      '"TypeScriptTeam.native-preview": [' \
      '"local-publisher.native-preview": ['
  '';
})
