# query-daily.tape — daily spending trend from daily_costs VIEW
# Record: vhs gifs/query-daily.tape

Output gifs/query-daily.gif
Set Theme "Catppuccin Mocha"
Set FontFamily "JetBrains Mono"
Set FontSize 14
Set Width 900
Set Height 500
Set Padding 20

Type "sqlite3 -header -column ~/.claude/miner.db"
Enter
Sleep 1s

Type "SELECT date, sessions, ROUND(estimated_cost_usd, 2) AS cost"
Enter
Type "FROM daily_costs ORDER BY date DESC LIMIT 14;"
Enter
Sleep 3s

Type ".quit"
Enter
Sleep 1s
