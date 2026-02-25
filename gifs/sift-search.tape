# sift-search.tape — FTS5 full-text search across all sessions
# Record: vhs gifs/sift-search.tape

Output gifs/sift-search.gif
Set Theme "Catppuccin Mocha"
Set FontFamily "JetBrains Mono"
Set FontSize 13
Set Width 960
Set Height 480
Set Padding 20
Set TypingSpeed 30ms

Type "sqlite3 -header -column ~/.claude/miner.db"
Enter
Sleep 500ms

Type "SELECT m.session_id, substr(m.content_preview,1,60) AS match FROM messages m JOIN messages_fts f ON m.id=f.rowid WHERE messages_fts MATCH 'streaming' LIMIT 5;"
Enter
Sleep 3s

Type ".quit"
Enter
Sleep 500ms
