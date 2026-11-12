{ vscode-utils, stdenv }:

vscode-utils.buildVscodeExtension (
  let
    upstreamPublisher = "TypeScriptTeam";
    platform =
      {
        x86_64-linux = {
          arch = "linux-x64";
          hash = "sha256-2Rt8GC4WwnLkbFLQez6ose8UasXMKlbuDcwAvVVYZ4A=";
        };
        aarch64-linux = {
          arch = "linux-arm64";
          hash = "sha256-8J+Q0K2GHzIGgrTqTKPqUHhm4oN6+s5L7sY4I6XWGwk=";
        };
      }
      .${stdenv.hostPlatform.system};
  in
  rec {
    pname = "typescript-native-preview";
    version = "1.0.1";

    vscodeExtPublisher = "local-publisher";
    vscodeExtName = "native-preview";
    vscodeExtUniqueId = "${vscodeExtPublisher}.${vscodeExtName}";

    src = vscode-utils.fetchVsixFromVscodeMarketplace {
      publisher = upstreamPublisher;
      name = vscodeExtName;
      version = version;
      inherit (platform) arch hash;
    };

    postPatch = ''
      substituteInPlace package.json \
        --replace-fail '"publisher": "${upstreamPublisher}"' '"publisher": "${vscodeExtPublisher}"'
    '';
  }
)
