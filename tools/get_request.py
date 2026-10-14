import json

transcript_path = r"C:\Users\webgarh\.gemini\antigravity\brain\a6b1f788-2767-4842-ba9a-74e8abcdbbaa\.system_generated\logs\transcript_full.jsonl"

with open(transcript_path, "r", encoding="utf-8") as f:
    for line in f:
        data = json.loads(line)
        if data.get("source") == "USER_EXPLICIT":
            content = data.get("content", "")
            if "STEP A (document only)" in content:
                lines = content.splitlines()
                for i in range(min(12, len(lines))):
                    print(f"{i:2d}: {lines[i]}")
                break

