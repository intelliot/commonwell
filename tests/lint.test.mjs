import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

function lint(source) {
  const directory = mkdtempSync(join(tmpdir(), "commonwell-lint-"));
  try {
    const path = join(directory, "probe.tsx");
    writeFileSync(path, source);
    const result = spawnSync(process.execPath, [
      join(root, "node_modules/oxlint/bin/oxlint"),
      "--config", join(root, ".oxlintrc.json"), "--format", "json", path,
    ], { cwd: root, encoding: "utf8", timeout: 15_000 });
    assert.ifError(result.error);
    assert.ok(result.status === 0 || result.status === 1, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.number_of_files, 1, "The probe must actually be linted");
    return output.diagnostics;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("lint rejects conditional React hooks", () => {
  const diagnostics = lint('import { useState } from "react"; export function Probe({ enabled }: { enabled: boolean }) { if (enabled) useState(0); return <div />; }');
  assert.ok(diagnostics.some(d => d.code.includes("rules-of-hooks") && d.severity === "error"));
});

test("lint rejects missing React list keys", () => {
  const diagnostics = lint('export function Probe() { return [1, 2].map(value => <div>{value}</div>); }');
  assert.ok(diagnostics.some(d => d.code.includes("jsx-key") && d.severity === "error"));
});

test("lint retains accessibility checks", () => {
  const diagnostics = lint('export function Probe() { return <img src="sample.png" aria-bogus="true" />; }');
  assert.ok(diagnostics.some(d => d.code.includes("alt-text")));
  assert.ok(diagnostics.some(d => d.code.includes("aria-props")));
});

test("lint rejects explicit any in TypeScript", () => {
  const diagnostics = lint('export function Probe(value: any) { return value; }');
  assert.ok(diagnostics.some(d => d.code.includes("no-explicit-any") && d.severity === "error"));
});

test("lint rejects synchronous scripts in Next pages", () => {
  const diagnostics = lint('export function Probe() { return <script src="/script.js" />; }');
  assert.ok(diagnostics.some(d => d.code.includes("no-sync-scripts") && d.severity === "error"));
});

test("lint retains React render purity checks", () => {
  const diagnostics = lint('export function Probe() { return <div>{Date.now()}</div>; }');
  assert.ok(diagnostics.some(d => d.code.includes("purity") && d.severity === "error"));
});

test("lint accepts a valid typed component with lazy state", () => {
  assert.deepEqual(lint('import { useState } from "react"; export function Probe({ name }: { name: string }) { const [year] = useState(() => new Date().getUTCFullYear()); return <button type="button">{name} {year}</button>; }'), []);
});
