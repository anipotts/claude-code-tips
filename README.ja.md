> [EN](./README.md) | [ZH](./README.zh-CN.md) | [ES](./README.es.md) | [HI](./README.hi.md) | [PT](./README.pt-BR.md) | [JA](./README.ja.md)

# claude-code-tips

[![CI](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml/badge.svg)](https://github.com/anipotts/claude-code-tips/actions/workflows/validate.yml)
[![GitHub stars](https://img.shields.io/github/stars/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/stargazers)
[![last commit](https://img.shields.io/github/last-commit/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](https://github.com/anipotts/claude-code-tips/commits/main)
[![tested with](https://img.shields.io/badge/tested%20with-Claude%20Code%20v2.1.94-000?style=flat-square&labelColor=D4A574&logo=anthropic&logoColor=white)](https://docs.anthropic.com/en/docs/claude-code)
[![license](https://img.shields.io/github/license/anipotts/claude-code-tips?style=flat-square&labelColor=111827&color=000)](./LICENSE)

俺のClaude Codeのセットアップ。オープンソース。hooks、agents、コツ、そして使用データを採掘するプラグイン。

これで時間が浮いたら、[スターをつけて](https://github.com/anipotts/claude-code-tips)くれ。他の人が見つけやすくなる。

## クイックスタート

```bash
/plugin marketplace add anipotts/claude-code-tips   # マーケットプレイスを追加（1回限り）
/plugin install mine@cc                             # mineをインストール（セッション分析）
/plugin install cc@cc                               # ccをインストール（クロスセッションメッセージング）
```

その後：[safety-guard.sh](./hooks/safety-guard.sh) を危険なコマンドをブロックするためにコピーする。[コツ](./docs/tips/)を読む。完了。

---

## 数字の話

数十のプロジェクトで数百のセッション。月額$200の上限プラン。

同じ使用量はAPIではキャッシング付きで約$12K、キャッシングなしで約$95K掛かる。自律ループはない。cronジョブもない。すべてのセッションはプロンプトを入力する俺から始まる。[コスト計算の仕組み &rarr;](./docs/cost.md)

<img src="./gifs/mine-stats.gif" width="100%" alt="mine stats showing sessions, tokens, costs, and projects" />

---

## mineプラグインをインストール

```bash
/plugin marketplace add anipotts/claude-code-tips   # マーケットプレイスを追加（1回限り）
/plugin install mine@cc                             # mineをインストール（セッション分析）
/plugin install cc@cc                               # ccをインストール（クロスセッションメッセージング）
```

**[mine](./plugins/mine/)** を手に入れられる。セッションをsqliteに採掘する。コスト、検索、エラーメモリ、パターン検出。すべてのデータは `~/.claude/mine.db` にローカルで保存される。

```
/mine                     今日のセッション、コスト、よく使うツール
/mine search "websocket"  すべての会話をフルテキスト検索
/mine mistakes            Claudeが繰り返すエラーパターン
/mine hotspots            セッション全体で最も編集されたファイル
/mine loops               セッション全体で繰り返されるパターン
```

`mine` と `safety-guard` hookから始める。進むにつれてもっと追加する。**[mine ドキュメント &rarr;](./plugins/mine/)**

---

## ccプラグイン

クロスセッションメッセージング。他のClaude Codeセッションが何をしているか見て、それらの間でメッセージを送る。

```bash
/plugin install cc@cc
```

```
/cc                          アクティブなセッションを表示
/cc send merizo "pause"      別のセッションにメッセージを送る
```

---

## 俺のコーディング方法を変えた3つのこと

### hooks

hookは「Claudeがやることを望む」と「Claudeが好きなことをやる」の違いだ。CLAUDE.mdはガイダンスを与える。hookは実行を強制する。ひとつは提案で、もう一つは壁だ。

このリポには任意のプロジェクトにドロップできる9つのhookがある。safety-guardはforce push、`rm -rf /`、`curl | bash` をブロック。no-squashはスクワッシュマージをブロック。context-saveはコンパクション前に状態を保存。ワークフローに合うものを選べ。[hook ガイド &rarr;](./docs/hooks.md)

### エージェントチーム

複数のClaudeインスタンスが同じコードベースで同時に作業。それぞれ独自のgit worktreeにある。コーディネーターはタスクを割り当て、結果を集め、最高のアプローチをマージする。

これは並列研究、危険な変更を安全に試す、ワーキングツリーに触れずにアプローチを並べて比較するのに使ってる。[エージェントチームをどう使ってるか &rarr;](./docs/agents.md)

### prompt caching

月額$200プランがAIコーディングで最高の取引な理由がこれだ。Claude Codeはシステムプロンプト、ツール、CLAUDE.mdを接頭辞としてキャッシュする。俺の入力トークンの91%はキャッシュに当たる。つまり読み出しの91%で入力コストの10%を払ってる。

鍵はCLAUDE.mdを短く安定したまま保つこと。編集するたびに接頭辞キャッシュが壊れる。俺のは30行で、1週間に1回変わるくらい。[完全なコスト内訳 &rarr;](./docs/cost.md)

---

## コツ

短くてスタンドアローンのテクニック。それぞれ次のセッションで使える何かだ。

| コツ | 学べること |
|-----|---------------|
| [prompt caching](./docs/tips/prompt-caching.md) | キャッシュヒット率97%以上を目指す、請求額を削る |
| [safety hooks](./docs/tips/safety-hooks.md) | force pushと rm -rf を5分でブロック |
| [settings hierarchy](./docs/tips/settings-hierarchy.md) | プロジェクト vs グローバル vs ローカル設定 |
| [session length](./docs/tips/session-length.md) | より短いセッションがなぜ効率的か（データ付き） |
| [ultrathink](./docs/tips/ultrathink.md) | 複雑な問題で拡張思考を強制 |
| [context management](./docs/tips/context-management.md) | コンパクション戦略、アクティブツール率、セッションを引き締めておく |
| [plan mode](./docs/tips/plan-mode.md) | 計画が時間を節約するとき vs 無駄にするとき |
| [fast mode](./docs/tips/fast-mode.md) | 同じモデル、より高速な出力、トレードオフ |
| [plugins](./docs/tips/plugins.md) | スクラッチからプラグインを構築、インストール価値がある理由 |
| [subagents](./docs/tips/subagents.md) | エージェントチーム、worktree分離、並列が利益になるとき |
| [mcp integration](./docs/tips/mcp-integration.md) | MCPサーバーを配線、セッション内で使用 |
| [hooks v2](./docs/tips/hooks-v2.md) | command vs http vs prompt hooks、非同期パターン |

---

## hooks

1つコピー、配線してやるだけ。それぞれスタンドアローンのbashスクリプト。[完全なガイド &rarr;](./docs/hooks.md)

| hook | イベント | 何をするか |
|---|---|---|
| [safety-guard](./hooks/safety-guard.sh) | PreToolUse | force push、`rm -rf /`、DROP TABLE、curl-pipe-shをブロック |
| [no-squash](./hooks/no-squash.sh) | PreToolUse | スクワッシュマージをブロック |
| [panopticon](./hooks/panopticon.sh) | PostToolUse | すべてのツール呼び出しをsqliteにログ |
| [context-save](./hooks/context-save.sh) | PreCompact | 圧縮前にコンテキストを保存 |
| [notify](./hooks/notify.sh) | Notification | macOS、Slack、ntfyにルーティング |

<details>
<summary>4つのhookがあります</summary>

| hook | イベント | 何をするか |
|---|---|---|
| [commit-nudge](./hooks/commit-nudge.sh) | PostToolUse | N回の編集後にコミットをリマインド |
| [version-stamp](./hooks/version-stamp.sh) | SessionEnd | テストスタンプを自動更新 |
| [stale-branch](./hooks/stale-branch.sh) | SessionStart | 消えたトラッキングブランチについて警告 |
| [md-lint-fix](./hooks/md-lint-fix.sh) | PostToolUse | 保存時にマークダウンリントを自動修正 |

</details>

<img src="./gifs/hook-safety.gif" width="100%" alt="safety-guard blocking a dangerous command" />

## エージェント例

`.claude/agents/` にコピーして `/agent <name>` で呼び出す。それぞれ異なるパターンを教える。[ガイド &rarr;](./docs/agents.md)

| エージェント | パターン | 何をするか |
|---|---|---|
| [watch-tests](./examples/agents/watch-tests.md) | daemon | ファイルを監視、テストを実行、修正を提案 |
| [try-worktree](./examples/agents/try-worktree.md) | worktree | 分離されたworktreeで危険な変更を試す |
| [arch-review](./examples/agents/arch-review.md) | quick review | 高速なアーキテクチャ悪臭テスト |
| [write-pr](./examples/agents/write-pr.md) | git integration | diffからPRの説明を生成 |

## 俺が使うコマンド

| コマンド | 何をするか |
|---|---|
| `/mine` | 使用データ・コスト、セッション、検索、パターン |
| `/ship` | ステージ、コミット、プッシュ、PRを1つのコマンドで開く |
| `/improve` | gitヒストリーからCLAUDE.mdアップデートを提案 |

プラス[2つのサンプルコマンド](./examples/commands/)コピーできる：`/sweep`、`/quicktest`。

---

## 俺の個人的な見方

| | 何 |
|---|---|
| [コスト現実](./docs/cost.md) | Claude Codeの実際のコスト、prompt cachingの計算 |
| [やった失敗](./docs/mistakes.md) | 俺が焼かれたこと、スキップできるもの |
| [自動化](./docs/automation.md) | このリポを保つ12のCIパイプライン |
| [セッションワークフロー](./docs/session-workflow.md) | Claude Codeで日常的にどう作業するか |
| [worktrees](./docs/worktrees.md) | デスクトップアプリで並列探索 |

## 代替案との比較

外交的で、データ駆動型。FUDなし。すべての主張は出典を示す。

[vs cursor](./docs/comparisons/cursor.md) &middot; [vs codex](./docs/comparisons/codex.md) &middot; [vs gemini](./docs/comparisons/gemini.md) &middot; [vs antigravity](./docs/comparisons/antigravity.md) &middot; [料金](./docs/comparisons/pricing.md)

---

## 例

- [CLAUDE.md テンプレート](./examples/claude-md/) · TypeScript、Python、Rust、Next.jsのスターター設定
- [エージェント例](./examples/agents/) · 4つのエージェント、それぞれ異なるパターンを教える
- [コマンド例](./examples/commands/) · 任意のプロジェクトにコピーできる2つのコマンド
- [handoff plugin](./examples/plugins/handoff/) · PreCompactコンテキスト保存
- [broadcast plugin](./examples/plugins/broadcast/) · gitイベントで非同期通知

---

## このリポはどう動くか

このリポは自分のパターンで動いてる。

- **12のCIワークフロー** · ドキュメント監査、競合インテリジェンス、コミュニティダイジェスト、鮮度チェック、古い物のクリーンアップ、dependabot、リリース、plugin smoke test、PR品質ゲート、バリデーション、claude responder、アップストリームwatcher
- **11のhook** すべてのセッションで実行
- **月額<$1** CI コスト · AI駆動ワークフローはhaikuを使う
- **ゼロの手動メンテナンス** · 趣味を必要としないすべてが自動化される

[自動化の詳細 &rarr;](./docs/automation.md)

---

## これらのパターンから俺が作ったツール

これはすべてClaude Codeで毎日生活することから出てきた。それぞれ何度も当たった特定の問題を解く。

- **[mine](./plugins/mine/)** · セッション採掘をsqliteに。コスト、検索、エラーメモリ、パターン検出
- **[claudemon](https://github.com/anipotts/claudemon)** · プロジェクトとマシン間の実時間セッション監視
- **[cc](./plugins/cc/)** · マルチセッション認識。他のセッションが何をしているか見て、それらの間でメッセージを送る
- **[imessage-mcp](https://github.com/anipotts/imessage-mcp)** · iMessageヒストリーのMCPサーバー。26ツール、ゼロネットワークリクエスト

## 俺からもっと

- [anipotts.com/thoughts](https://anipotts.com/thoughts) · 長編
- [buttondown.com/anipotts](https://buttondown.com/anipotts) · ニュースレター
- [@anipottsbuilds](https://instagram.com/anipottsbuilds) · ショート

---

MIT · [anipotts](https://anipotts.com) が作ったもの

<!-- translated from README.md @ 77e88e7 -->
