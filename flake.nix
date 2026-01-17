{
  description = "OpenCCP - Twitter/X data collection for sentiment analysis";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            python312
            uv
          ];

          shellHook = ''
            echo "OpenCCP Development Environment"
            echo "Python: $(python3 --version)"
            echo "uv: $(uv --version)"
            echo ""
            echo "Use 'uv pip install <package>' to add dependencies"
          '';
        };
      });
}
