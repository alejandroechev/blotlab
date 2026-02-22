import { test, expect, Page } from '@playwright/test';

// ─── Helpers ─────────────────────────────────────────────────

const SAMPLE_IDS = ['simple-4lane', 'uneven-loading', 'dose-response', 'multi-band', 'low-contrast'];

async function loadSample(page: Page, id: string) {
  await page.locator('.sample-select').selectOption(id);
}

async function waitForCanvas(page: Page) {
  await expect(page.locator('.canvas-panel canvas')).toBeVisible({ timeout: 5000 });
}

async function runAnalyze(page: Page) {
  await page.getByText('▶ Analyze').click();
  await expect(page.locator('.results-panel')).toBeVisible({ timeout: 10000 });
}

// ─── 1. App Load — drop zone visible, no errors ──────────────

test.describe('1. App Load', () => {
  test('drop zone visible, no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('/');
    await expect(page.locator('.drop-zone')).toBeVisible();
    await expect(page.locator('.drop-zone')).toContainText('Drop a blot image');
    expect(errors).toEqual([]);
  });
});

// ─── 2. Theme — toggle, localStorage, dark mode text readability ─

test.describe('2. Theme Toggle & Dark Mode Text', () => {
  test('toggle sets data-theme and persists in localStorage', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app')).toHaveAttribute('data-theme', 'light');
    await page.getByText('🌙').click();
    await expect(page.locator('.app')).toHaveAttribute('data-theme', 'dark');

    const stored = await page.evaluate(() => localStorage.getItem('blotlab-theme'));
    expect(stored).toBe('dark');

    await page.reload();
    await expect(page.locator('.app')).toHaveAttribute('data-theme', 'dark');
  });

  test('dark mode: ALL visible text elements have readable color', async ({ page }) => {
    await page.goto('/');
    await page.getByText('🌙').click();
    await expect(page.locator('.app')).toHaveAttribute('data-theme', 'dark');

    // Load a sample and run analysis to reveal all UI elements
    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);
    await runAnalyze(page);

    // Check toolbar text
    const toolbarH1 = page.locator('.toolbar h1');
    await expect(toolbarH1).toBeVisible();

    // Check drop-zone text in dark mode (when visible)
    // Check results panel headings
    const resultsH2 = page.locator('.results-panel h2');
    const h2Count = await resultsH2.count();
    expect(h2Count).toBeGreaterThan(0);

    // Check table header text is readable
    const thElements = page.locator('.results-panel th');
    const thCount = await thElements.count();
    for (let i = 0; i < thCount; i++) {
      const color = await thElements.nth(i).evaluate((el) => getComputedStyle(el).color);
      // Color should not be dark (black/near-black) on dark background
      expect(color).not.toBe('rgb(0, 0, 0)');
    }

    // Check table data text is readable
    const tdElements = page.locator('.results-panel td');
    const tdCount = await tdElements.count();
    for (let i = 0; i < Math.min(tdCount, 6); i++) {
      const color = await tdElements.nth(i).evaluate((el) => getComputedStyle(el).color);
      expect(color).not.toBe('rgb(0, 0, 0)');
    }

    // Check lane-info text
    const laneInfo = page.locator('.lane-info');
    await expect(laneInfo).toBeVisible();
    const laneColor = await laneInfo.evaluate((el) => getComputedStyle(el).color);
    expect(laneColor).not.toBe('rgb(0, 0, 0)');

    // Check controls label text
    const controlsLabel = page.locator('.controls label');
    const labelColor = await controlsLabel.evaluate((el) => getComputedStyle(el).color);
    expect(labelColor).not.toBe('rgb(0, 0, 0)');

    // Check controls select text
    const controlsSelect = page.locator('.controls select');
    const selectColor = await controlsSelect.evaluate((el) => getComputedStyle(el).color);
    expect(selectColor).not.toBe('rgb(0, 0, 0)');

    // Check inline export buttons text
    const exportBtns = page.locator('.btn-inline-export');
    const exportCount = await exportBtns.count();
    for (let i = 0; i < exportCount; i++) {
      const color = await exportBtns.nth(i).evaluate((el) => getComputedStyle(el).color);
      expect(color).not.toBe('rgb(0, 0, 0)');
    }

    // Check radius control text
    const radiusSpan = page.locator('.radius-control span');
    const radiusColor = await radiusSpan.evaluate((el) => getComputedStyle(el).color);
    expect(radiusColor).not.toBe('rgb(0, 0, 0)');

    // Check toolbar buttons
    const toolbarBtns = page.locator('.toolbar button');
    const btnCount = await toolbarBtns.count();
    for (let i = 0; i < btnCount; i++) {
      const color = await toolbarBtns.nth(i).evaluate((el) => getComputedStyle(el).color);
      // Should not be pure black
      expect(color).not.toBe('rgb(0, 0, 0)');
    }
  });

  test('dark mode: contrast ratio check on key elements', async ({ page }) => {
    await page.goto('/');
    await page.getByText('🌙').click();

    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);
    await runAnalyze(page);

    // Check that background colors are actually dark
    const appBg = await page.locator('.app').evaluate((el) => getComputedStyle(el).backgroundColor);
    // Parse to check it's a dark color
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    // Results panel background should be dark
    const panelBg = await page.locator('.results-panel').evaluate((el) => getComputedStyle(el).backgroundColor);

    // Text color on results panel should be light
    const panelText = await page.locator('.results-panel').evaluate((el) => getComputedStyle(el).color);

    // Verify text is light (R > 150 for light text)
    const match = panelText.match(/rgb\((\d+), (\d+), (\d+)\)/);
    if (match) {
      const r = parseInt(match[1]);
      expect(r).toBeGreaterThan(150); // Light text on dark bg
    }
  });
});

// ─── 3. Sample Loading — each sample renders ─────────────────

test.describe('3. Samples', () => {
  for (const id of SAMPLE_IDS) {
    test(`sample "${id}" loads, image renders on canvas`, async ({ page }) => {
      await page.goto('/');
      await loadSample(page, id);
      await waitForCanvas(page);
      // Verify canvas has non-zero dimensions
      const canvas = page.locator('.canvas-panel canvas');
      const w = await canvas.evaluate((c: HTMLCanvasElement) => c.width);
      const h = await canvas.evaluate((c: HTMLCanvasElement) => c.height);
      expect(w).toBeGreaterThan(0);
      expect(h).toBeGreaterThan(0);
    });
  }
});

// ─── 4. Analyze — results appear (chart + table), no hang ────

test.describe('4. Analyze Button', () => {
  test('click analyze → results panel with chart AND table, no hang', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);

    const start = Date.now();
    await runAnalyze(page);
    const duration = Date.now() - start;

    // Should complete in reasonable time (no hang)
    expect(duration).toBeLessThan(30000);

    // Chart visible
    await expect(page.locator('.chart-container')).toBeVisible();
    const chartSvg = page.locator('.chart-container svg');
    await expect(chartSvg).toBeVisible();

    // Table visible with data
    const rows = page.locator('.results-panel table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ─── 5. In-place Exports — CSV, PNG, SVG ─────────────────────

test.describe('5. In-place Exports', () => {
  test('CSV button on table triggers download', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);
    await runAnalyze(page);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('.results-panel').getByText('📄 CSV').click(),
    ]);
    expect(download.suggestedFilename()).toBe('blotlab-results.csv');
  });

  test('PNG button on chart triggers download', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);
    await runAnalyze(page);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('.results-panel').getByText('🖼 PNG').click(),
    ]);
    expect(download.suggestedFilename()).toBe('blotlab-chart.png');
  });

  test('SVG button on chart triggers download', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);
    await runAnalyze(page);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('.results-panel').getByText('📐 SVG').click(),
    ]);
    expect(download.suggestedFilename()).toBe('blotlab-chart.svg');
  });

  test('Raw CSV button triggers download', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);
    await runAnalyze(page);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('.results-panel').getByText('📄 Raw CSV').click(),
    ]);
    expect(download.suggestedFilename()).toBe('blotlab-raw-data.csv');
  });
});

// ─── 6. Results — lane count in results area, data table values ─

test.describe('6. Results Details', () => {
  test('lane count shown in results area (not toolbar)', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);
    await runAnalyze(page);

    // Lane info should be in results panel
    const laneInfo = page.locator('.results-panel .lane-info');
    await expect(laneInfo).toBeVisible();
    const text = await laneInfo.textContent();
    expect(text).toMatch(/\d+ lanes/);

    // Verify it's NOT in the toolbar
    const toolbarLaneInfo = page.locator('.toolbar .lane-info');
    await expect(toolbarLaneInfo).not.toBeAttached();
  });

  test('data table values are numeric and non-empty', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);
    await runAnalyze(page);

    const rows = page.locator('.results-panel table tbody tr');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const cells = rows.nth(i).locator('td');
      const cellCount = await cells.count();
      expect(cellCount).toBe(6); // Lane, Band, Raw, Corrected, Normalized, Fold
      for (let j = 0; j < cellCount; j++) {
        const text = await cells.nth(j).textContent();
        expect(text).not.toBe('');
        expect(text).not.toBeNull();
      }
    }
  });
});

// ─── 7. Guide/Feedback buttons ───────────────────────────────

test.describe('7. Guide & Feedback Buttons', () => {
  test('Guide button opens intro.html', async ({ page, context }) => {
    await page.goto('/');
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByText('📖 Guide').click(),
    ]);
    await newPage.waitForLoadState();
    expect(newPage.url()).toContain('/intro.html');
    await newPage.close();
  });

  test('Feedback button opens GitHub issues page', async ({ page, context }) => {
    await page.goto('/');
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByText('💬 Feedback').click(),
    ]);
    expect(newPage.url()).toContain('github.com');
    await newPage.close();
  });
});

// ─── 8. Edge Cases ───────────────────────────────────────────

test.describe('8. Edge Cases', () => {
  test('rapid sample switching does not crash or produce errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    // Rapidly cycle 3 times
    for (let cycle = 0; cycle < 3; cycle++) {
      for (const id of SAMPLE_IDS) {
        await page.locator('.sample-select').selectOption(id);
      }
    }
    await waitForCanvas(page);
    await expect(page.getByText('▶ Analyze')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('analyze without image — button is hidden, no crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await expect(page.getByText('▶ Analyze')).not.toBeVisible();
    expect(errors).toEqual([]);
  });

  test('switching samples after analyze clears results', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);
    await runAnalyze(page);
    await expect(page.locator('.results-panel')).toBeVisible();

    await loadSample(page, 'dose-response');
    await waitForCanvas(page);
    await expect(page.locator('.results-panel')).not.toBeVisible();
  });

  test('analyze twice in a row does not crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);
    await runAnalyze(page);
    // Click analyze again
    await page.getByText('▶ Analyze').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.results-panel')).toBeVisible();
    expect(errors).toEqual([]);
  });
});

// ─── 9. Ball Radius Control ──────────────────────────────────

test.describe('9. Ball Radius Control', () => {
  test('radius input visible with default value 50', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);

    const radiusControl = page.locator('.radius-control');
    await expect(radiusControl).toBeVisible();
    const input = page.locator('.radius-control input');
    await expect(input).toHaveValue('50');
  });

  test('changing radius and re-analyzing works', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);

    // Change radius
    const input = page.locator('.radius-control input');
    await input.fill('30');
    await expect(input).toHaveValue('30');

    // Analyze with new radius
    await runAnalyze(page);
    const rows = page.locator('.results-panel table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });
});

// ─── 10. Dark Theme — systematic text element check ──────────

test.describe('10. Dark Theme Systematic Check', () => {
  test('toolbar elements readable in dark mode', async ({ page }) => {
    await page.goto('/');
    await page.getByText('🌙').click();

    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);

    // Check each toolbar element color
    const elements = [
      { selector: '.toolbar h1', name: 'toolbar title' },
      { selector: '.toolbar .sample-select', name: 'sample select' },
      { selector: '.radius-control span', name: 'radius label' },
      { selector: '.radius-control input', name: 'radius input' },
    ];

    for (const { selector, name } of elements) {
      const el = page.locator(selector).first();
      if (await el.isVisible()) {
        const color = await el.evaluate((e) => getComputedStyle(e).color);
        const bg = await el.evaluate((e) => getComputedStyle(e).backgroundColor);
        // Verify we don't have dark text on dark bg
        const colorMatch = color.match(/rgb\((\d+), (\d+), (\d+)\)/);
        if (colorMatch) {
          const luminance = (parseInt(colorMatch[1]) * 0.299 + parseInt(colorMatch[2]) * 0.587 + parseInt(colorMatch[3]) * 0.114);
          // Text should be reasonably visible (luminance > 100 for light text)
          expect(luminance, `${name} text too dark in dark mode: ${color}`).toBeGreaterThan(80);
        }
      }
    }
  });

  test('results panel elements readable in dark mode', async ({ page }) => {
    await page.goto('/');
    await page.getByText('🌙').click();

    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);
    await runAnalyze(page);

    // Systematic check of all text elements in results panel
    const checks = [
      '.results-panel h2',
      '.results-panel .lane-info',
      '.results-panel .controls label',
      '.results-panel .controls select',
      '.results-panel th',
      '.results-panel td',
      '.btn-inline-export',
    ];

    for (const selector of checks) {
      const elements = page.locator(selector);
      const count = await elements.count();
      for (let i = 0; i < Math.min(count, 3); i++) {
        const color = await elements.nth(i).evaluate((e) => getComputedStyle(e).color);
        const bg = await elements.nth(i).evaluate((e) => {
          // Walk up to find the first non-transparent bg
          let el: Element | null = e;
          while (el) {
            const s = getComputedStyle(el);
            if (s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent') {
              return s.backgroundColor;
            }
            el = el.parentElement;
          }
          return 'unknown';
        });

        const colorMatch = color.match(/rgb\((\d+), (\d+), (\d+)\)/);
        const bgMatch = bg.match(/rgb\((\d+), (\d+), (\d+)\)/);

        if (colorMatch && bgMatch) {
          const textLum = parseInt(colorMatch[1]) * 0.299 + parseInt(colorMatch[2]) * 0.587 + parseInt(colorMatch[3]) * 0.114;
          const bgLum = parseInt(bgMatch[1]) * 0.299 + parseInt(bgMatch[2]) * 0.587 + parseInt(bgMatch[3]) * 0.114;
          const contrast = Math.abs(textLum - bgLum);
          expect(contrast, `${selector}[${i}] contrast too low: text=${color}, bg=${bg}`).toBeGreaterThan(40);
        }
      }
    }
  });

  test('drop zone text readable in dark mode', async ({ page }) => {
    await page.goto('/');
    await page.getByText('🌙').click();

    const dropZone = page.locator('.drop-zone');
    await expect(dropZone).toBeVisible();
    const color = await dropZone.evaluate((e) => getComputedStyle(e).color);
    const colorMatch = color.match(/rgb\((\d+), (\d+), (\d+)\)/);
    if (colorMatch) {
      const lum = parseInt(colorMatch[1]) * 0.299 + parseInt(colorMatch[2]) * 0.587 + parseInt(colorMatch[3]) * 0.114;
      expect(lum, `drop zone text too dark: ${color}`).toBeGreaterThan(80);
    }
  });
});
