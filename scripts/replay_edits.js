const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = "C:\\Users\\bents\\.gemini\\antigravity\\brain\\6f49daf2-85d1-46f1-83a7-fec12db65a12\\.system_generated\\logs\\transcript_full.jsonl";

async function replay() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let actions = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      if (entry.step_index >= 851) break;

      if (entry.type === 'PLANNER_RESPONSE' && entry.tool_calls) {
        for (const call of entry.tool_calls) {
          if (call.name === 'write_to_file' || call.name === 'replace_file_content') {
            let args = call.args; // FIX: call.args instead of call.arguments
            if (typeof args === 'string') {
              try { args = JSON.parse(args); } catch(e) {}
            }
            if (!args) continue;
            
            let target = args.TargetFile || args.targetFile;
            if (!target) continue;

            if (!target.includes('Management System')) continue;

            actions.push({
              step: entry.step_index,
              tool: call.name,
              args: args
            });
          }
        }
      }
    } catch(e) {}
  }

  console.log(`Found ${actions.length} file modification actions before disaster.`);

  for (const act of actions) {
    const file = act.args.TargetFile || act.args.targetFile;
    console.log(`Applying step ${act.step}: ${act.tool} on ${path.basename(file)}`);
    
    if (act.tool === 'write_to_file') {
      const content = act.args.CodeContent || act.args.codeContent;
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content, 'utf8');
    } else if (act.tool === 'replace_file_content') {
      if (!fs.existsSync(file)) {
        console.error(`  -> File not found: ${file}`);
        continue;
      }
      let content = fs.readFileSync(file, 'utf8');
      const targetStr = act.args.TargetContent || act.args.targetContent;
      const replaceStr = act.args.ReplacementContent || act.args.replacementContent;
      
      if (content.includes(targetStr)) {
        content = content.replace(targetStr, replaceStr);
        fs.writeFileSync(file, content, 'utf8');
        console.log(`  -> Replaced exact string`);
      } else {
        const normTarget = targetStr.replace(/\r\n/g, '\n');
        const normContent = content.replace(/\r\n/g, '\n');
        if (normContent.includes(normTarget)) {
            const result = normContent.replace(normTarget, replaceStr.replace(/\r\n/g, '\n'));
            fs.writeFileSync(file, result, 'utf8');
            console.log(`  -> Replaced (after CRLF normalization)`);
        } else {
            console.error(`  -> Target string STILL not found! Maybe it was already replaced or file out of sync.`);
            // Output a bit of the targetStr to help debug
            console.error(`     Target starts with: ${targetStr.substring(0, 50).replace(/\n/g, '\\n')}`);
        }
      }
    }
  }
}

replay().catch(console.error);
