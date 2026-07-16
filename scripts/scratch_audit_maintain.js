
const fs = require("fs");
const path = require("path");

const dirsToAudit = [
  "dh-backoffice-react/src",
  "dh-frontend/src",
  "dh-staff-app/src",
  "dh-shared/src"
];

const results = {};

function countLines(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  return content.split("\n").length;
}

function walk(dir, project, stats) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (item !== "node_modules" && item !== "dist" && item !== "build" && item !== ".git") {
        walk(fullPath, project, stats);
      }
    } else if (stat.isFile() && (fullPath.endsWith(".js") || fullPath.endsWith(".jsx") || fullPath.endsWith(".ts") || fullPath.endsWith(".tsx"))) {
      const lines = countLines(fullPath);
      stats.totalFiles++;
      stats.totalLines += lines;
      if (lines > 300) {
        stats.largeFiles.push({ file: fullPath.replace("c:\\DH Notebook\\Management System\\", ""), lines });
      }
    }
  }
}

for (const dir of dirsToAudit) {
  const project = dir.split("/")[0];
  const fullDir = path.join("c:\\DH Notebook\\Management System", dir);
  results[project] = {
    totalFiles: 0,
    totalLines: 0,
    largeFiles: []
  };
  walk(fullDir, project, results[project]);
}

console.log(JSON.stringify(results, null, 2));

