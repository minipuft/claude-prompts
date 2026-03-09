# Skills Export Demo — Zero API cost, pure CLI
# Shows: export command → then the resulting skill file
#
# Usage: PATH="$HOME/bin:$PATH" vhs assets/demos/skills-export.tape

Output assets/demos/skills-export.gif
Set Theme "Catppuccin Mocha"
Set FontFamily "Fira Code"
Set FontSize 15
Set Width 1100
Set Height 700
Set Padding 20
Set WindowBar Colorful
Set TypingSpeed 35ms
Set Framerate 15

Type "cd ~/Applications/claude-prompts-mcp/server"
Enter
Sleep 500ms

# Run the export
Type "npm run skills:export 2>&1 | tail -20"
Sleep 300ms
Enter

# Wait for compilation output
Sleep 8s

# Now show the exported skill
Type "bat --style=header,grid ~/.claude/skills/review/SKILL.md"
Sleep 300ms
Enter

# Let the viewer read the output
Sleep 6s
