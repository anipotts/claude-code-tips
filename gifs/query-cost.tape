# query-cost.tape — project costs from the project_costs VIEW
# Record: vhs gifs/query-cost.tape

Output gifs/query-cost.gif
Set Theme "Catppuccin Mocha"
Set FontFamily "JetBrains Mono"
Set FontSize 14
Set Width 900
Set Height 600
Set Padding 20

Type "sqlite3 -header -column ~/.claude/miner.db"
Enter
Sleep 1s

Type "SELECT project_name, sessions, ROUND(estimated_cost_usd, 2) AS cost"
Enter
Type "FROM project_costs ORDER BY cost DESC LIMIT 15;"
Enter
Sleep 3s

Type ".quit"
Enter
Sleep 1s
