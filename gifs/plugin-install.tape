# plugin-install.tape — installing the miner plugin
# Record: vhs gifs/plugin-install.tape
#
# NOTE: This shows the install command. Actual output depends on
# whether the plugin is already installed and network conditions.

Output gifs/plugin-install.gif
Set Theme "Catppuccin Mocha"
Set FontFamily "JetBrains Mono"
Set FontSize 14
Set Width 900
Set Height 400
Set Padding 20

Type "# install the miner plugin"
Enter
Sleep 1s

Type@50ms "claude plugin add anipotts/miner"
Enter
Sleep 4s
