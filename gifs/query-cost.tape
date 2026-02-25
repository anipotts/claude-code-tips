# query-cost.tape — project costs from the project_costs VIEW
# Record: vhs gifs/query-cost.tape

Output gifs/query-cost.gif
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

Type "SELECT project_name, sessions, ROUND(estimated_cost_usd,2) AS cost FROM project_costs ORDER BY cost DESC LIMIT 15;"
Enter
Sleep 3s

Type ".quit"
Enter
Sleep 500ms
