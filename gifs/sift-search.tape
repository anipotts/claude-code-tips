# sift-search.tape — FTS5 full-text search across all sessions
# Record: vhs gifs/sift-search.tape

Output gifs/sift-search.gif
Set Theme "Catppuccin Mocha"
Set FontFamily "JetBrains Mono"
Set FontSize 14
Set Width 900
Set Height 500
Set Padding 20

Type "sqlite3 -header -column ~/.claude/miner.db"
Enter
Sleep 1s

Type "SELECT m.session_id, substr(m.content_preview, 1, 80) AS preview"
Enter
Type "FROM messages m JOIN messages_fts f ON m.id = f.rowid"
Enter
Type "WHERE messages_fts MATCH 'streaming bug' LIMIT 5;"
Enter
Sleep 3s

Type ".quit"
Enter
Sleep 1s
