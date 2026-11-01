// The screenshot scripts only rewrite a capture when its decoded pixels differ (PNG bytes vary from one run or machine
// to the next). The comparison must look at every channel: opaque captures of different colours have the same alpha,
// and a comparison of the alpha alone would keep the old picture. Needs Chromium (`npx playwright install chromium`).
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

let harness;
try {
  harness = await import("../scripts/screenshots/harness.mjs");
} catch {}
const browser = await harness?.launch().catch(() => null);

test("writeIfChanged compares every channel of the decoded pixels", { skip: !browser && "no Chromium" }, async () => {
  const dir = mkdtempSync(join(tmpdir(), "rc-shots-"));
  const page = await browser.newPage({ viewport: { width: 40, height: 20 } });
  try {
    // Opaque captures: same alpha everywhere, only red, green or blue differs.
    const shot = async (color) => {
      await page.setContent(`<body style="margin:0;background:${color}"></body>`);
      return page.screenshot();
    };
    const [red, green, blue, blue2] = [await shot("#ff0000"), await shot("#00ff00"), await shot("#0000ff"), await shot("#0000fe")];
    const path = join(dir, "shot.png");
    writeFileSync(path, red);
    assert.equal(await harness.writeIfChanged(page, path, green), true, "red → green: rewritten");
    assert.deepEqual(readFileSync(path), green);
    assert.equal(await harness.writeIfChanged(page, path, blue), true, "green → blue: rewritten");
    assert.equal(await harness.writeIfChanged(page, path, blue2), true, "one step of blue: rewritten");
    assert.deepEqual(readFileSync(path), blue2);
    // The same pixels encoded again (other bytes): the file in place is kept.
    assert.equal(await harness.writeIfChanged(page, path, await shot("#0000fe")), false, "same pixels: kept");
    assert.deepEqual(readFileSync(path), blue2);
  } finally {
    await page.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test.after(() => browser?.close());
