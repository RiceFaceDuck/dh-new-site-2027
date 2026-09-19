const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function findEdits(logPath) {
  if (!fs.existsSync(logPath)) return;
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      // Stop before the disaster wipe step in main transcript
      if (logPath.includes('6f49daf2') && !logPath.includes('subagents') && entry.step_index >= 851) break;

      if (entry.type === 'PLANNER_RESPONSE' && entry.tool_calls) {
        for (const call of entry.tool_calls) {
          if (call.name === 'write_to_file' || call.name === 'replace_file_content') {
            let args = call.arguments;
            if (typeof args === 'string') {
              try { args = JSON.parse(args); } catch(e) {}
            }
            if (!args) continue;
            let target = args.TargetFile || args.targetFile;
            if (target) {
                console.log(`[${path.basename(logPath)}] ${call.name}: ${target}`);
            }
          }
        }
      }
    } catch(e) {}
  }
}

async function run() {
  const baseDir = "C:\\Users\\bents\\.gemini\\antigravity\\brain\\6f49daf2-85d1-46f1-83a7-fec12db65a12\\.system_generated";
  await findEdits(path.join(baseDir, "logs", "transcript_full.jsonl"));
  
  const subagentsDir = path.join(baseDir, "subagents");
  if (fs.existsSync(subagentsDir)) {
      const subs = fs.readdirSync(subagentsDir);
      for (const sub of subs) {
          const subLog = path.join(subagentsDir, sub, "logs", "transcript_full.jsonl");
          await findEdits(subLog);
      }
  }
}

run().catch(console.error);
