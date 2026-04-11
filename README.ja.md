> [EN](./README.md) | [ZH](./README.zh-CN.md) | [ES](./README.es.md) | [HI](./README.hi.md) | [PT](./README.pt-BR.md) | [JA](./README.ja.md)

# claude-code-tips

[![CI](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml/badge.svg)](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml)
[![GitHub stars](https://img.shields.io/github/stars/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/stargazers)
[![last commit](https://img.shields.io/github/last-commit/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/commits/main)
[![tested with](https://img.shields.io/badge/tested%20with-Claude%20Code%20v2.1.94-000?style=flat-square&labelColor=D4A574&logo=anthropic&logoColor=white)](https://docs.anthropic.com/en/docs/claude-code)
[![license](https://img.shields.io/github/license/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](./LICENSE)

俺のClaude Code設定をオープンソース化したやつ。hooks、agents、tips、そしてお前の使用データを掘り出すプラグインがある。

これで時間が浮いたら、[スターをつけて](https://github.com/anipotts/claude-code-tips)くれ。他の奴らが見つけやすくなるからな。

## クイックスタート

```bash
claude plugin install anipotts/mine   # mineプラグインをインストール
```

それから：[safety-guard.sh](./hooks/safety-guard.sh)を危険なコマンドをブロックするためにコピーしろ。[ティップス](./docs/tips/)を読め。以上だ。

---

## 数字で見ると

数十個のプロジェクト、数百のセッション。最大プラン月200ドルだ。

同じ使用量だと、キャッシング付きAPIで約12000ドル、キャッシングなしだと約95000ドル。自律ループはなし。cronジョブもなし。全セッションはお前がプロンプトを打つことから始まる。[コスト計算がどう動作してるかを見る &rarr;](./docs/cost.md)

<img src="./gifs/mine-stats.gif" width="100%" alt="mine stats showing sessions, tokens, costs, and projects" />

---

## mineプラグインをインストールする

```bash
claude plugin install anipotts/mine
```

**[mine](https://github.com/anipotts/mine)**が手に入る · セッションをsqliteにマイニング。コスト、検索、エラーメモリ、パターン検出。全部のデータはローカルの`~/.claude/mine.db`に残る。

```
/mine                     今日のセッション、コスト、トップツール
/mine search "websocket"  全会話を通じた全文検索
/mine mistakes            Claudeが何度も繰り返してるエラーパターン
/mine hotspots            セッション全体で最も編集されたファイル
/mine loops               セッション全体の繰り返しパターン
```

`mine`と`safety-guard` hookから始めろ。あとは必要に応じて足していく。**[mineドキュメント &rarr;](https://github.com/anipotts/mine)**

---

## 俺のコード作成を変えた3つのこと

### hooks

hooksがあるかないかで「Claudeが俺の思い通りに動く」と「Claudeが気分次第で動く」が決まる。CLAUDE.mdはガイダンス。hooksは実行。一つはアドバイス、もう一つは壁だ。

このリポジトリには9個のhooksがあって、どんなプロジェクトにでもドロップできる。safety-guardはforcce push、`rm -rf /`、`curl | bash`をブロック。no-squashはスクウォッシュマージをブロック。context-saveはコンパクション前に状態を保存。お前のワークフローに合うやつを選べ。[hookガイド &rarr;](./docs/hooks.md)

### agent teams

複数のClaudeインスタンスが同時に同じコードベースで動く、各々独立したgit worktreeの中で。コーディネーターがタスクを割り当て、結果を集めて、最適なアプローチをマージする。

平行リサーチ、危険な変更を安全に試す、ワーキングツリーに触れずにアプローチを比較する時に使ってる。[どうやってagent teamsを使ってるか &rarr;](./docs/agents.md)

### prompt caching

月200ドルプランが脚本AI開発で最高の取引な理由がこれだ。Claude Codeはシステムプロンプト、ツール、CLAUDE.mdを接頭辞としてキャッシュする。俺の入力トークンの91%がキャッシュヒット、つまり91%の読み込みで入力コストの10%だけ払う。

キー：CLAUDE.mdは短く安定を保て。編集するたびに接頭辞キャッシュが壊れる。俺のは30行で週1回位の更新だ。[完全なコスト内訳 &rarr;](./docs/cost.md)

---

## ティップス

短くて独立したテクニック。各々次のセッションで使える何かだ。

| ティップス | 学べること |
|-----|---------------|
| [prompt caching](./docs/tips/prompt-caching.md) | 97%以上のキャッシュヒット率を出す、請求を削る |
| [safety hooks](./docs/tips/safety-hooks.md) | 5分でforcce pushと`rm -rf`をブロック |
| [settings hierarchy](./docs/tips/settings-hierarchy.md) | プロジェクトvs グローバルvs ローカル設定 |
| [session length](./docs/tips/session-length.md) | 短いセッションがなぜ効率的か（データ付き） |
| [ultrathink](./docs/tips/ultrathink.md) | 複雑な問題に拡張思考を強制 |
| [context management](./docs/tips/context-management.md) | コンパクション戦略、アクティブツールレート、セッションを締める |
| [plan mode](./docs/tips/plan-mode.md) | プランニングが時間を節約する時vs 無駄にする時 |
| [fast mode](./docs/tips/fast-mode.md) | 同じモデル、高速出力、トレードオフ |
| [plugins](./docs/tips/plugins.md) | スクラッチからプラグインを作る、インストール価値のあるプラグインの条件 |
| [subagents](./docs/tips/subagents.md) | agent teams、worktree分離、平行処理がペイする時 |
| [mcp integration](./docs/tips/mcp-integration.md) | MCPサーバーを配線、セッション内で使う |
| [hooks v2](./docs/tips/hooks-v2.md) | commandvs httpvs prompthooks、非同期パターン |

---

## hooks

1つコピー、配線する、以上。各々独立したbashスクリプトだ。[完全ガイド &rarr;](./docs/hooks.md)

| hook | イベント | やること |
|---|---|---|
| [safety-guard](./hooks/safety-guard.sh) | PreToolUse | force push、`rm -rf /`、DROP TABLE、curl-pipe-shをブロック |
| [no-squash](./hooks/no-squash.sh) | PreToolUse | スクウォッシュマージをブロック |
| [panopticon](./hooks/panopticon.sh) | PostToolUse | 全ツール呼び出しをsqliteにログ |
| [context-save](./hooks/context-save.sh) | PreCompact | 圧縮前にコンテキストを保存 |
| [notify](./hooks/notify.sh) | Notification | macOS、Slack、ntfyにルーティング |

<details>
<summary>4つ以上のhooks</summary>

| hook | イベント | やること |
|---|---|---|
| [commit-nudge](./hooks/commit-nudge.sh) | PostToolUse | N回の編集後にコミットを促す |
| [version-stamp](./hooks/version-stamp.sh) | SessionEnd | 「テスト済み」スタンプを自動更新 |
| [stale-branch](./hooks/stale-branch.sh) | SessionStart | なくなったトラッキングブランチを警告 |
| [md-lint-fix](./hooks/md-lint-fix.sh) | PostToolUse | セーブ時にmarkdownリントを自動修正 |

</details>

<img src="./gifs/hook-safety.gif" width="100%" alt="safety-guard blocking a dangerous command" />

## エグザンプルagents

`.claude/agents/`にコピーして`/agent <name>`で呼び出せ。各々違うパターンを教える。[ガイド &rarr;](./docs/agents.md)

| agent | パターン | やること |
|---|---|---|
| [watch-tests](./examples/agents/watch-tests.md) | daemon | ファイルを監視、テストを実行、修正を提案 |
| [try-worktree](./examples/agents/try-worktree.md) | worktree | 危険な変更を独立したworktreeで試す |
| [arch-review](./examples/agents/arch-review.md) | quick review | 速いアーキテクチャ臭い検査 |
| [write-pr](./examples/agents/write-pr.md) | git integration | diffからPR説明を生成 |

## 使ってるコマンド

| コマンド | やること |
|---|---|
| `/mine` | 使用データ · コスト、セッション、検索、パターン |
| `/ship` | ステージ、コミット、プッシュ、1コマンドでPRを開く |
| `/improve` | gitヒストリーからCLAUDE.mdの更新を提案 |

他に[2つのエグザンプルコマンド](./examples/commands/)がある、コピーできるやつ：`/sweep`、`/quicktest`。

---

## 俺の個人的な見解

| | 何 |
|---|---|
| [コスト現実](./docs/cost.md) | Claude Codeが実際にいくらかかるか、prompt cacheingの数学 |
| [やらかした失敗](./docs/mistakes.md) | 俺が燃やした奴だから、お前はスキップできる |
| [自動化](./docs/automation.md) | このリポジトリを保つ12個のCIパイプライン |
| [セッションワークフロー](./docs/session-workflow.md) | 日々のClaude Code作業の流れ |
| [worktrees](./docs/worktrees.md) | デスクトップアプリでの平行探索 |

## 他の選択肢との比較

外交的で、データドリブン、FUDなし。全ての主張には出典がある。

[vs cursor](./docs/comparisons/cursor.md) &middot; [vs codex](./docs/comparisons/codex.md) &middot; [vs gemini](./docs/comparisons/gemini.md) &middot; [vs antigravity](./docs/comparisons/antigravity.md) &middot; [価格](./docs/comparisons/pricing.md)

---

## エグザンプル

- [CLAUDE.mdテンプレート](./examples/claude-md/) · TypeScript、Python、Rust、Next.jsのスターター設定
- [エグザンプルagents](./examples/agents/) · 4つのagents、各々違うパターンを教える
- [エグザンプルコマンド](./examples/commands/) · 2つのコマンド、どんなプロジェクトにでもコピーできる
- [handoffプラグイン](./examples/plugins/handoff/) · PreCompactコンテキスト保存
- [broadcastプラグイン](./examples/plugins/broadcast/) · gitイベント上の非同期通知

---

## このリポジトリがどう動いてるか

このリポジトリは独自のパターンの上に動いてる。

- **12個のCIワークフロー** · docs監査、競争インテリジェンス、コミュニティダイジェスト、鮮度チェック、古いクリーンアップ、dependabot、リリース、プラグイン煙テスト、PRクオリティゲート、バリデーション、Claude応答者、アップストリーム監視
- **11個のhooks**、全セッション上で動く
- **月1ドル未満**のCI費 · AIパワード ワークフロー haikuを使う
- **ゼロ手動保守** · センスが必要でないものは全部自動化

[自動化詳細 &rarr;](./docs/automation.md)

---

## これらのパターンから作ったツール

全部Claude Code内で毎日生きてることから出てきた。各々俺が何度も当たった特定の問題を解く。

- **[mine](https://github.com/anipotts/mine)** · セッションマイニングをsqliteに。コスト、検索、エラーメモリ、パターン検出
- **[claudemon](https://github.com/anipotts/claudemon)** · プロジェクトとマシン全体のリアルタイムセッション監視
- **[cc](https://github.com/anipotts/cc)** · マルチセッション認識。他のセッションが何やってるか見る、メッセージ送る
- **[imessage-mcp](https://github.com/anipotts/imessage-mcp)** · iMessageヒストリーの読み込み専用MCPサーバー。26のツール、ネットワーク リクエストゼロ

## 俺の他の作品

- [anipotts.com/thoughts](https://anipotts.com/thoughts) · 長編
- [buttondown.com/anipotts](https://buttondown.com/anipotts) · ニュースレター
- [@anipottsbuilds](https://instagram.com/anipottsbuilds) · 短編

---

MIT &middot; [anipotts](https://anipotts.com)が作成

<!-- translated from README.md @ 25b25ac -->
