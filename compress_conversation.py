#!/usr/bin/env python3
import json
import os

def compress_conversation(conversation):
    # Create a compressed summary of conversation messages.
    summary_lines = []
    for msg in conversation.get("messages", []):
        content = msg.get("content", "").strip()
        if content:
            author = msg.get("author", {}).get("nickname", msg.get("author", {}).get("name", "Unknown"))
            timestamp = msg.get("timestamp", "")
            # Use full content without cutting it off.
            short_content = content
            summary_lines.append(f"- {author} ({timestamp}): {short_content}")
    return "\n".join(summary_lines)

def main():
    # Load conversation JSON file from the team_chat folder.
    json_path = os.path.join("team_chat", "Direct Messages - endomorphosis, Lizardperson [1332237033673850880].json")
    with open(json_path, "r", encoding="utf-8") as f:
        conversation = json.load(f)
    summary = compress_conversation(conversation)
    # Write compressed summary to team_chat.md in markdown format.
    with open("team_chat.md", "w", encoding="utf-8") as f:
        f.write("# Compressed Conversation Summary\n\n")
        f.write(summary)
    print("Compressed conversation written to team_chat.md")

if __name__ == "__main__":
    main()
