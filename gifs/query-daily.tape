# query-daily.tape — daily spending trend from daily_costs VIEW
# Record: vhs gifs/query-daily.tape

Output gifs/query-daily.gif
Set Theme "Catppuccin Mocha"
Set FontFamily "JetBrains Mono"
Set FontSize 13
Set Width 960
Set Height 560
Set Padding 20
Set TypingSpeed 30ms

Type "sqlite3 -header -column ~/.claude/miner.db"
Enter
Sleep 500ms

Type "SELECT date, sessions, ROUND(estimated_cost_usd,2) AS cost FROM daily_costs ORDER BY date DESC LIMIT 14;"
Enter
Sleep 3s

Type ".quit"
Enter
Sleep 500ms
