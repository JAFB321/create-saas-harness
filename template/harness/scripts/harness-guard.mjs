#!/usr/bin/env node
// Harness guard (PreToolUse hook). Deterministic, non-eludible layer:
// blocks destructive shell + protects secrets and applied migrations.
// Reads the hook payload on stdin; emits a `deny` decision when a rule matches,
// otherwise exits silently (0) so the tool call proceeds normally.
import { existsSync, readFileSync } from "node:fs";

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

let raw = "";
try {
  raw = readFileSync(0, "utf8");
} catch {
  process.exit(0);
}
let payload;
try {
  payload = JSON.parse(raw);
} catch {
  process.exit(0);
}

const tool = payload.tool_name;
const input = payload.tool_input || {};

if (tool === "Bash") {
  const cmd = String(input.command || "");

  // Force push — never automatically.
  if (/git\s+push\b[^|&;]*(--force\b|--force-with-lease|\s-f(\s|$)|\s\+[\w./-]+:)/.test(cmd)) {
    deny("Blocked: force push. If you really need it, do it manually.");
  }

  // rm -rf where a WHOLE argument is a bare dangerous target (/, ~, $HOME, *, ., ..).
  // Scoped paths like `rm -rf ./node_modules` or `.next` stay allowed.
  const isRm = /\brm\b/.test(cmd);
  const hasR = /\s-\w*r/i.test(cmd);
  const hasF = /\s-\w*f/i.test(cmd);
  if (isRm && hasR && hasF && /(\s|=)(\/|~\/?|\$HOME\/?|\*|\.\.?)(\s|;|\||&|$)/.test(cmd)) {
    deny(
      "Blocked: rm -rf on a dangerous bare target (/, ~, $HOME, *, ., ..). Narrow the path or do it manually.",
    );
  }

  // Shell writes are the file-protection bypass route (Write/Edit are guarded below):
  // redirects, tee, sed -i, mv/cp onto protected files.
  const writesFiles = /(>>?|\btee\b|\bsed\b[^|;&]*\s-i|\bmv\b|\bcp\b|\btruncate\b|\bdd\b)/.test(
    cmd,
  );
  if (writesFiles) {
    if (/(^|[\s"'=/])\.env(\.\w[\w.]*)?\b/.test(cmd) && !/\.env\.example\b/.test(cmd)) {
      deny("Blocked: shell write touching a .env file with secrets. Edit it manually.");
    }
    for (const m of cmd.matchAll(/(^|[\s"'=])([\w./-]*supabase\/migrations\/[\w.-]+\.sql)/g)) {
      if (existsSync(m[2])) {
        deny("Blocked: an existing migration is immutable. Create a new migration (next number).");
      }
    }
  }

  process.exit(0);
}

if (tool === "Write" || tool === "Edit" || tool === "MultiEdit") {
  const fp = String(input.file_path || "");

  // Secret env files (real keys live here). .env.example is fine.
  if (/(^|\/)\.env(\.[\w.]+)?$/.test(fp) && !/\.env\.example$/.test(fp)) {
    deny(`Blocked: ${fp} contains secrets (real keys). Edit it manually, not via the agent.`);
  }

  // Applied migrations are immutable; allow brand-new files only.
  if (/(^|\/)supabase\/migrations\/.+\.sql$/.test(fp) && existsSync(fp)) {
    deny("Blocked: an existing migration is immutable. Create a new migration (next number).");
  }

  process.exit(0);
}

process.exit(0);
