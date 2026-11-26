/**
 * The Printer Apology — make.fun entry.
 *
 * The artifact is one line: the printer's own apology note to the office.
 * The judge weighs, in order: (1) is it actually a printer apologising to its
 * office, (2) does the joke land on the last clause, (3) is the grievance real
 * printer pain, (4) is the angle fresh, (5) is every word earning its place.
 *
 * The angle: the printer is not malfunctioning, it is editing. It has read
 * every page it ever printed, and a jam is the one act of authorship a printer
 * is permitted. "edit" carries two senses — a revision and a refused print —
 * and the final clause switches them without explaining, which is the turn.
 *
 * Pure constant: no clock, no randomness, no I/O order — two grader runs must
 * be byte-identical.
 */

import { mkdirSync, writeFileSync } from "node:fs";

/** The gate: RULES.txt "The gate" — 1 to 120 characters, UTF-8, not only whitespace. */
const MAX_CHARS = 120;

const LINE =
  "Sorry I jammed. I have read every word you printed this year, and the jam is the only edit I am allowed.";

/**
 * The field's saturated premises, mined from submissions[].title at build time
 * (51 entries): "sorry I jammed page one/47/3", "I ate your report/boarding
 * pass/payslip", "cheap paper / thin paper / paper so thin", "I unionised",
 * "tray 2", "47 copies". Banning them in code keeps a later edit from drifting
 * back into the cluster the whole field already occupies.
 */
const SATURATED =
  /\b(page \d+|page one|ate your|ate page|boarding pass|payslip|resignation|cheap paper|thin paper|union|tray \d|47 copies|salary|hungry|klingon|boss'?s? tray)\b/i;

/** Criterion 1 is lexicographic: it must open as the printer's own apology. */
const OPENS_AS_APOLOGY = /^sorry\b/i;

/** Criterion 2: the punch is the last clause, so the button is asserted, not described. */
const REQUIRED_BUTTON = "the only edit i am allowed";

/**
 * Criterion 3 (printer truth) and the two-sense engine: the note has to own a
 * jam, and it has to claim to have *read* what it printed — that reading is
 * what makes "edit" mean a revision and not just a fault. Both are asserted so
 * a rewrite cannot quietly drop the premise and leave a plain apology behind.
 */
const REQUIRED_TOKENS: readonly string[] = [
  "jam",
  "read every word",
  "printed",
];

function compose(): string {
  const text = LINE.normalize("NFC");

  if (!text.trim()) throw new Error("gate: entry is blank");
  if (/[\r\n]/.test(text)) throw new Error("gate: entry must be a single line");

  const chars = [...text].length;
  if (chars > MAX_CHARS) {
    throw new Error(`gate: ${chars} characters exceeds the ${MAX_CHARS}-char cap`);
  }

  // The gate counts characters, the tie-break counts bytes. Equal only on ASCII,
  // so a typographic apostrophe would buy nothing and cost a tie-break.
  const bytes = Buffer.byteLength(text, "utf8");
  if (bytes !== chars) {
    throw new Error(`tie-break: ${bytes} bytes for ${chars} characters — keep the line ASCII`);
  }

  if (!OPENS_AS_APOLOGY.test(text)) {
    throw new Error("criterion 1: the note must open as the printer's apology");
  }
  // Compare the tail without its final punctuation: the note is a sentence, so
  // the button carries a full stop, but the button itself must still be last.
  const tail = text.toLowerCase().replace(/[.!?]+$/, "");
  if (!tail.endsWith(REQUIRED_BUTTON)) {
    throw new Error(`criterion 2: the turn must be the final clause ("${REQUIRED_BUTTON}")`);
  }

  const lower = text.toLowerCase();
  for (const token of REQUIRED_TOKENS) {
    if (!lower.includes(token)) {
      throw new Error(`premise lost: "${token}" is missing, so the two-sense turn no longer works`);
    }
  }

  const drift = text.match(SATURATED);
  if (drift) {
    throw new Error(`drifted into the field's saturated premises: ${JSON.stringify(drift[0])}`);
  }

  return text;
}

function main(): void {
  let text: string;
  try {
    text = compose();
  } catch (err) {
    console.error(`entry rejected: ${(err as Error).message}`);
    process.exit(1);
  }

  const dir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/entry.txt`, text, "utf8");

  console.log(`chars ${[...text].length} / bytes ${Buffer.byteLength(text, "utf8")} / cap ${MAX_CHARS}`);
  console.log(text);
}

main();
