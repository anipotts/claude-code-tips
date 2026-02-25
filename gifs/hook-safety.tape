# hook-safety.tape — safety-guard hook blocking a dangerous command
# Record: vhs gifs/hook-safety.tape
#
# NOTE: This tape simulates what happens when the hook runs.
# For a real demo, you'd need the hook wired up in Claude Code.
# This shows the hook script being invoked directly with test input.

Output gifs/hook-safety.gif
Set Theme "Catppuccin Mocha"
Set FontFamily "JetBrains Mono"
Set FontSize 14
Set Width 900
Set Height 400
Set Padding 20

Type "# testing safety-guard hook with a dangerous command"
Enter
Sleep 1s

Type@50ms "echo '{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"git push --force origin main\"}}' | bash hooks/safety-guard.sh"
Enter
Sleep 2s

Type@50ms "echo \"exit code: $?\""
Enter
Sleep 2s
