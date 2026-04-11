> [EN](./README.md) | [ZH](./README.zh-CN.md) | [ES](./README.es.md) | [HI](./README.hi.md) | [PT](./README.pt-BR.md) | [JA](./README.ja.md)

# claude-code-tips

[![CI](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml/badge.svg)](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml)
[![GitHub stars](https://img.shields.io/github/stars/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/stargazers)
[![last commit](https://img.shields.io/github/last-commit/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/commits/main)
[![tested with](https://img.shields.io/badge/tested%20with-Claude%20Code%20v2.1.94-000?style=flat-square&labelColor=D4A574&logo=anthropic&logoColor=white)](https://docs.anthropic.com/en/docs/claude-code)
[![license](https://img.shields.io/github/license/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](./LICENSE)

自分の Claude Code セットアップをオープンソースで公開。フック、エージェント、Tips、そして使用データをマイニングするプラグイン。

役に立ったら[スターを付けてほしい](https://github.com/anipotts/claude-code-tips)。他の人が見つけやすくなる。

## クイックスタート

```bash
claude plugin install anipotts/mine   # install the mine plugin
```

次に: [safety-guard.sh](./hooks/safety-guard.sh) をコピーして危険なコマンドをブロック。[Tips](./docs/tips/) を読む。以上。

---

## 数字で見る実績

数十のプロジェクトにわたる数百のセッション。月額$200のMaxプラン。

同じ使い方をAPIでやると、キャッシュありで約$12K、なしで約$95K。自律ループなし。cronジョブなし。毎回自分でプロンプトを打つところからセッションが始まる。[コスト計算の詳細 &rarr;](./docs/cost.md)

<img src="./gifs/mine-stats.gif" width="100%" alt="mine stats showing sessions, tokens, costs, and projects" />

---

## mine プラグインのインストール

```bash
claude plugin install anipotts/mine
```

手に入るのは **[mine](https://github.com/anipotts/mine)** -- セッションデータをSQLiteにマイニング。コスト、検索、エラー記憶、パターン検出。データはすべてローカルの `~/.claude/mine.db` に保存される。

```
/mine                     今日のセッション、コスト、トップツール
/mine search "websocket"  全会話をフルテキスト検索
/mine mistakes            Claudeが繰り返すエラーパターン
/mine hotspots            セッション横断で最も編集されたファイル
/mine loops               セッション横断の繰り返しパターン
```

まずは `mine` と `safety-guard` フックから始めて、必要に応じて追加していく。**[mine ドキュメント &rarr;](https://github.com/anipotts/mine)**

---

## コーディングを変えた3つのこと

### フック

フックは「Claudeが自分の意図通りに動く」と「Claudeが好き勝手に動く」の分かれ目だ。CLAUDE.mdはガイダンスを与える。フックは強制する。一方は提案、もう一方は壁。

このリポジトリには、どのプロジェクトにもドロップインできる9つのフックがある。safety-guardはフォースプッシュ、`rm -rf /`、`curl | bash` をブロックする。no-squashはスカッシュマージをブロックする。context-saveはコンパクション前の状態を保存する。ワークフローに合うものを選べばいい。[フックガイド &rarr;](./docs/hooks.md)

### エージェントチーム

複数のClaudeインスタンスが同じコードベース上で同時に作業する。それぞれ独自のgit worktreeで動く。コーディネーターがタスクを割り当て、結果を集め、最良のアプローチをマージする。

並列リサーチ、リスクのある変更を安全に試す、ワーキングツリーに触れずにアプローチを比較する、といった用途で使っている。[エージェントチームの使い方 &rarr;](./docs/agents.md)

### プロンプトキャッシング

これが月額$200プランがAIコーディング最強のコスパである理由だ。Claude Code はシステムプロンプト、ツール、CLAUDE.mdをプレフィックスとしてキャッシュする。入力トークンの91%がキャッシュにヒットする。つまり読み取りの91%で入力コストの10%しか払っていない。

ポイント: CLAUDE.mdを短く安定させること。編集するたびにプレフィックスキャッシュが壊れる。自分のは30行で、変更は週に1回くらいだ。[コスト詳細分析 &rarr;](./docs/cost.md)

---

## Tips

短くて独立したテクニック集。どれも次のセッションですぐ使える。

| Tip | 学べること |
|-----|---------------|
| [プロンプトキャッシング](./docs/tips/prompt-caching.md) | キャッシュヒット率97%以上を達成し、コストを削減する |
| [セーフティフック](./docs/tips/safety-hooks.md) | 5分でフォースプッシュとrm -rfをブロックする |
| [設定の階層構造](./docs/tips/settings-hierarchy.md) | プロジェクト vs グローバル vs ローカル設定 |
| [セッションの長さ](./docs/tips/session-length.md) | 短いセッションが効率的な理由(データ付き) |
| [ultrathink](./docs/tips/ultrathink.md) | 複雑な問題で拡張思考を強制する |
| [コンテキスト管理](./docs/tips/context-management.md) | コンパクション戦略、アクティブツールレート、セッションを引き締める方法 |
| [plan mode](./docs/tips/plan-mode.md) | プランニングが時間の節約になる場合と無駄になる場合 |
| [fast mode](./docs/tips/fast-mode.md) | 同じモデル、速い出力、そのトレードオフ |
| [プラグイン](./docs/tips/plugins.md) | ゼロからプラグインを作る、インストールする価値のあるもの |
| [サブエージェント](./docs/tips/subagents.md) | エージェントチーム、worktree分離、並列が効く場面 |
| [MCP連携](./docs/tips/mcp-integration.md) | MCPサーバーを接続し、セッション内で使う |
| [hooks v2](./docs/tips/hooks-v2.md) | command vs http vs promptフック、非同期パターン |

---

## フック

コピーして、設定して、完了。各フックは独立したbashスクリプト。[完全ガイド &rarr;](./docs/hooks.md)

| フック | イベント | 内容 |
|---|---|---|
| [safety-guard](./hooks/safety-guard.sh) | PreToolUse | フォースプッシュ、`rm -rf /`、DROP TABLE、curl-pipe-sh をブロック |
| [no-squash](./hooks/no-squash.sh) | PreToolUse | スカッシュマージをブロック |
| [panopticon](./hooks/panopticon.sh) | PostToolUse | すべてのツール呼び出しをSQLiteに記録 |
| [context-save](./hooks/context-save.sh) | PreCompact | 圧縮前にコンテキストを保存 |
| [notify](./hooks/notify.sh) | Notification | macOS、Slack、ntfy にルーティング |

<details>
<summary>さらに4つのフック</summary>

| フック | イベント | 内容 |
|---|---|---|
| [commit-nudge](./hooks/commit-nudge.sh) | PostToolUse | N回の編集後にコミットをリマインド |
| [version-stamp](./hooks/version-stamp.sh) | SessionEnd | "tested with" スタンプを自動更新 |
| [stale-branch](./hooks/stale-branch.sh) | SessionStart | 追跡先が消えたブランチを警告 |
| [md-lint-fix](./hooks/md-lint-fix.sh) | PostToolUse | 保存時にMarkdown lintを自動修正 |

</details>

<img src="./gifs/hook-safety.gif" width="100%" alt="safety-guard blocking a dangerous command" />

## エージェントの例

`.claude/agents/` にコピーして `/agent <name>` で呼び出す。それぞれ異なるパターンを学べる。[ガイド &rarr;](./docs/agents.md)

| エージェント | パターン | 内容 |
|---|---|---|
| [watch-tests](./examples/agents/watch-tests.md) | デーモン | ファイルを監視し、テストを実行し、修正を提案 |
| [try-worktree](./examples/agents/try-worktree.md) | worktree | 隔離されたworktreeでリスクのある変更を試す |
| [arch-review](./examples/agents/arch-review.md) | クイックレビュー | 高速なアーキテクチャの匂いチェック |
| [write-pr](./examples/agents/write-pr.md) | git連携 | diffからPRの説明文を生成 |

## よく使うコマンド

| コマンド | 内容 |
|---|---|
| `/mine` | 使用データ -- コスト、セッション、検索、パターン |
| `/ship` | ステージ、コミット、プッシュ、PR作成を一発で |
| `/improve` | gitの履歴からCLAUDE.mdの更新を提案 |

さらに [2つのサンプルコマンド](./examples/commands/) をコピーできる: `/sweep`、`/quicktest`。

---

## 個人的な所感

| | 内容 |
|---|---|
| [コストの現実](./docs/cost.md) | Claude Code の実際のコスト、プロンプトキャッシングの計算 |
| [やらかしたこと](./docs/mistakes.md) | 自分が痛い目を見たこと。同じ轍を踏まなくていい |
| [自動化](./docs/automation.md) | このリポジトリを維持する12のCIパイプライン |
| [セッションワークフロー](./docs/session-workflow.md) | Claude Code との日常的な作業の進め方 |
| [worktrees](./docs/worktrees.md) | デスクトップアプリでの並列探索 |

## 代替ツールとの比較

外交的、データ駆動、FUDなし。すべての主張にソースを引用。

[vs Cursor](./docs/comparisons/cursor.md) &middot; [vs Codex](./docs/comparisons/codex.md) &middot; [vs Gemini](./docs/comparisons/gemini.md) &middot; [vs Antigravity](./docs/comparisons/antigravity.md) &middot; [料金比較](./docs/comparisons/pricing.md)

---

## サンプル集

- [CLAUDE.md テンプレート](./examples/claude-md/) -- TypeScript、Python、Rust、Next.js 向けのスターター設定
- [エージェントの例](./examples/agents/) -- 4つのエージェント、それぞれ異なるパターンを教える
- [コマンドの例](./examples/commands/) -- どのプロジェクトにもコピーできる2つのコマンド
- [handoff プラグイン](./examples/plugins/handoff/) -- PreCompact コンテキスト保存
- [broadcast プラグイン](./examples/plugins/broadcast/) -- gitイベントでの非同期通知

---

## このリポジトリの仕組み

このリポジトリ自体が、自分のパターンで運用されている。

- **12のCIワークフロー** -- ドキュメント監査、競合情報、コミュニティダイジェスト、鮮度チェック、staleクリーンアップ、dependabot、リリース、プラグインスモークテスト、PRクオリティゲート、バリデーション、Claude応答、アップストリーム監視
- **11のフック** が毎セッション稼働
- **月$1未満** のCI費用 -- AIワークフローはHaikuを使用
- **手動メンテナンスゼロ** -- センスが必要ないものはすべて自動化

[自動化の詳細 &rarr;](./docs/automation.md)

---

## これらのパターンから作ったツール

Claude Code を毎日使い倒す中で生まれたもの。それぞれ繰り返しぶつかった特定の問題を解決する。

- **[mine](https://github.com/anipotts/mine)** -- セッションデータをSQLiteにマイニング。コスト、検索、エラー記憶、パターン検出
- **[claudemon](https://github.com/anipotts/claudemon)** -- プロジェクトやマシンを横断したリアルタイムセッション監視
- **[cc](https://github.com/anipotts/cc)** -- マルチセッション認識。他のセッションの動作を確認し、セッション間でメッセージを送信
- **[imessage-mcp](https://github.com/anipotts/imessage-mcp)** -- 読み取り専用のiMessage履歴用MCPサーバー。26ツール、ネットワークリクエストゼロ

## その他

- [anipotts.com/thoughts](https://anipotts.com/thoughts) -- 長文記事
- [buttondown.com/anipotts](https://buttondown.com/anipotts) -- ニュースレター
- [@anipottsbuilds](https://instagram.com/anipottsbuilds) -- ショートフォーム

---

MIT &middot; [anipotts](https://anipotts.com) が作成
