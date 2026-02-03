import fs from "fs";
import path from "path";

const ROOT_DIR = path.resolve("api"); // adjust if needed

function exists(p) {
  return fs.existsSync(p);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      walk(full);
    } else if (entry.endsWith(".ts")) {
      fixFile(full);
    }
  }
}

function fixFile(filePath) {
  let code = fs.readFileSync(filePath, "utf8");
  let changed = false;
  const dir = path.dirname(filePath);

  code = code.replace(
    /(import\s+[^'"]+['"])(\.{1,2}\/[^'"]+)(['"])/g,
    (match, start, spec, end) => {
      // already has extension → skip
      if (spec.endsWith(".js")) return match;

      const tsFile = path.resolve(dir, spec + ".ts");
      const tsIndex = path.resolve(dir, spec, "index.ts");

      if (exists(tsFile)) {
        changed = true;
        return `${start}${spec}.js${end}`;
      }

      if (exists(tsIndex)) {
        changed = true;
        return `${start}${spec}/index.js${end}`;
      }

      // unknown target → leave unchanged
      return match;
    }
  );

  if (changed) {
    fs.writeFileSync(filePath, code);
    console.log("✔ fixed", filePath);
  }
}

walk(ROOT_DIR);
