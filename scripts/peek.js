const fs = require('fs');
const readline = require('readline');
const logPath = "C:\\Users\\bents\\.gemini\\antigravity\\brain\\6f49daf2-85d1-46f1-83a7-fec12db65a12\\.system_generated\\logs\\transcript_full.jsonl";

async function peek() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    const entry = JSON.parse(line);
    if (entry.tool_calls) {
        console.log(JSON.stringify(entry.tool_calls[0], null, 2).substring(0, 500));
        break;
    }
  }
}
peek().catch(console.error);
