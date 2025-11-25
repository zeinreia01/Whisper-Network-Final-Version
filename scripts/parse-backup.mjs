#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Parse PostgreSQL backup file and extract public schema data
 * Usage: node scripts/parse-backup.mjs <backup-file-path>
 */

async function parseBackup(backupPath) {
  if (!fs.existsSync(backupPath)) {
    console.error(`❌ File not found: ${backupPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(backupPath, "utf-8");
  const tables = ["users", "admins", "messages", "replies", "reactions", "notifications", "follows", "liked_messages"];
  
  const outputDir = path.join(__dirname, "..", "data-exports");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("📖 Parsing backup file...\n");

  for (const table of tables) {
    // Look for COPY commands
    const copyRegex = new RegExp(`^COPY public\\.${table} \\(([^)]+)\\) FROM stdin;$`, "m");
    const copyMatch = content.match(copyRegex);
    
    if (!copyMatch) continue;

    const columns = copyMatch[1].split(", ");
    const startIdx = content.indexOf(copyMatch[0]);
    const endIdx = content.indexOf("\n\\.\n", startIdx);
    
    if (endIdx === -1) continue;

    const dataSection = content.substring(startIdx + copyMatch[0].length, endIdx);
    const lines = dataSection.trim().split("\n").filter(l => l.trim());
    
    if (lines.length === 0) {
      console.log(`⊘ ${table}: no data`);
      continue;
    }

    const records = lines.map(line => {
      const values = line.split("\t");
      const record = {};
      columns.forEach((col, idx) => {
        record[col] = values[idx] === "\\N" ? null : values[idx];
      });
      return record;
    });

    const outputFile = path.join(outputDir, `${table}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(records, null, 2));
    console.log(`✅ ${table}: ${records.length} records → ${outputFile}`);
  }

  console.log("\n✨ Parsing complete!");
  console.log(`📁 Check the data-exports/ folder for JSON files`);
}

const backupFile = process.argv[2];
if (!backupFile) {
  console.log("Usage: node scripts/parse-backup.mjs <path-to-backup-file>");
  console.log("Example: node scripts/parse-backup.mjs attached_assets/db_backup.backup");
  process.exit(1);
}

parseBackup(backupFile);
