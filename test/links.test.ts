import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

import { getBundledSkillPath } from "../src/skill/index.js";

/** GitHub-style heading anchor: lower-case, punctuation removed, spaces turned into hyphens. */
function slug(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number} _-]/gu, "")
    .replace(/ /g, "-");
}

function anchors(markdown: string): Set<string> {
  const found = new Set<string>();
  let fenced = false;
  for (const line of markdown.split("\n")) {
    if (line.startsWith("```")) fenced = !fenced;
    if (fenced) continue;
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    if (heading?.[1] !== undefined) found.add(slug(heading[1]));
  }
  return found;
}

/** Relative links (`[text](target)`) outside code fences; absolute URLs are not checked here. */
function relativeLinks(markdown: string): string[] {
  const links: string[] = [];
  let fenced = false;
  for (const line of markdown.split("\n")) {
    if (line.startsWith("```")) fenced = !fenced;
    if (fenced) continue;
    for (const match of line.matchAll(/\]\(([^)\s]+)\)/g)) {
      const target = match[1];
      if (target !== undefined && !/^[a-z][a-z0-9+.-]*:/i.test(target)) links.push(target);
    }
  }
  return links;
}

/** Returns one message per link in `file` whose target file or anchor does not exist. */
async function brokenLinks(file: string, markdown: string): Promise<string[]> {
  const broken: string[] = [];
  for (const link of relativeLinks(markdown)) {
    const [target = "", anchor] = link.split("#");
    const destination = target === "" ? file : path.resolve(path.dirname(file), target);
    let destinationText: string;
    try {
      await access(destination);
      destinationText = target === "" ? markdown : await readFile(destination, "utf8");
    } catch {
      broken.push(`${path.basename(file)} -> ${link}: file not found`);
      continue;
    }
    if (anchor !== undefined && !anchors(destinationText).has(anchor)) {
      broken.push(`${path.basename(file)} -> ${link}: no heading with that anchor`);
    }
  }
  return broken;
}

async function markdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

void test("every relative link and anchor inside the packaged Skill resolves", async () => {
  // An agent follows these links to the reference sections it is told to read first. `main` is what
  // `npx skills add` installs, so a broken one ships the moment it is committed.
  const skill = await getBundledSkillPath();
  const files = await markdownFiles(skill);
  assert.ok(files.length >= 3, "SKILL.md and both references must be found");
  const broken: string[] = [];
  for (const file of files) broken.push(...(await brokenLinks(file, await readFile(file, "utf8"))));
  assert.deepEqual(broken, []);
});

void test("the link check reports a missing file and a missing anchor", async () => {
  // Without this, a checker that never finds anything would pass the test above forever.
  const skill = await getBundledSkillPath();
  const file = path.join(skill, "SKILL.md");
  const sample = [
    "# Present heading",
    "[ok](#present-heading) [file](references/does-not-exist.md)",
    "[anchor](references/api-workflows.md#no-such-section) [fine](references/safety.md)",
  ].join("\n");
  assert.deepEqual(await brokenLinks(file, sample), [
    "SKILL.md -> references/does-not-exist.md: file not found",
    "SKILL.md -> references/api-workflows.md#no-such-section: no heading with that anchor",
  ]);
});
