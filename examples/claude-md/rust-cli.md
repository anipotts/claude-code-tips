# dex

rust CLI tool for managing and querying local dev environments. clap for args, tokio for async, serde for config.

## structure

- `src/main.rs` -- entrypoint, clap arg parsing, dispatches to commands
- `src/commands/` -- one file per subcommand (init, status, sync, clean)
- `src/config.rs` -- serde config loading from ~/.dex/config.toml
- `src/client.rs` -- async HTTP client for the dex registry API
- `src/output.rs` -- terminal output formatting, colors, tables
- `src/error.rs` -- error types with thiserror, all errors funnel through `DexError`
- `tests/` -- integration tests, run against real temp dirs
- `fixtures/` -- sample configs and test data

## commands

- `cargo build` -- debug build
- `cargo test` -- all tests
- `cargo test --test integration` -- integration tests only
- `cargo test config::tests` -- tests in config module only
- `cargo clippy -- -D warnings` -- lint, treat warnings as errors
- `cargo fmt --check` -- formatting check
- `cargo run -- status --verbose` -- run the status subcommand
- `cargo install --path .` -- install locally

## conventions

- all public functions have doc comments. no exceptions
- errors use thiserror derive macros, not string errors
- `?` for propagation everywhere. no `.unwrap()` outside tests
- clap uses derive API, not builder: `#[derive(Parser)]` on structs
- async only where needed (http calls, file i/o). sync for pure logic
- output module handles all user-facing text -- commands never println! directly
- config uses serde defaults so missing fields dont break old configs
- feature flags for optional deps: `--features cloud` enables registry sync

## testing

- unit tests in the same file: `#[cfg(test)] mod tests { ... }`
- integration tests in `tests/` use `assert_cmd` for CLI testing
- `tempfile::TempDir` for any test that touches the filesystem
- snapshot testing with `insta` for complex output formatting
- CI runs: `cargo test`, `cargo clippy -- -D warnings`, `cargo fmt --check`

## release process

- version in Cargo.toml, bump with `cargo set-version X.Y.Z`
- changelog in CHANGELOG.md, keep it up to date manually
- `git tag vX.Y.Z && git push --tags` triggers CI release
- CI builds binaries for linux-x64, macos-x64, macos-arm64
- homebrew formula in `HomebrewFormula/dex.rb`, update sha256 after release

## common mistakes

- dont add `tokio::main` to tests -- use `#[tokio::test]` instead
- clap derive fields: `Option<String>` for optional args, not `String` with default
- serde rename_all = "snake_case" on all config structs -- toml keys are snake_case
- dont use `std::fs` in async contexts -- use `tokio::fs`
- the config path is `~/.dex/config.toml`, not `~/.config/dex/`
