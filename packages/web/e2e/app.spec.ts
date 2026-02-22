import { test, expect, Page } from '@playwright/test';

const SAMPLE_IDS = [
  'simple-4lane',
  'uneven-loading',
  'dose-response',
  'multi-band',
  'low-contrast',
];

// Helper: select a sample from the dropdown
async function loadSample(page: Page, id: string) {
  await page.locator('.sample-select').selectOption(id);
}

// Helper: wait for image to render on canvas
async function waitForCanvas(page: Page) {
  await expect(page.locator('.canvas-panel canvas')).toBeVisible({ timeout: 5000 });
}

// Helper: click Analyze and wait for results panel
async function runAnalyze(page: Page) {
  await page.getByText('▶ Analyze').click();
  await expect(page.locator('.results-panel')).toBeVisible({ timeout: 10000 });
}

// ─── Page Load ────────────────────────────────────────────

test.describe('Page Load', () => {
  test('has correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('BlotLab — Western Blot Densitometry');
  });

  test('shows toolbar with branding', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.toolbar h1')).toHaveText('🧬 BlotLab');
  });

  test('shows drop zone when no image loaded', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.drop-zone')).toBeVisible();
    await expect(page.locator('.drop-zone')).toContainText('Drop a blot image');
  });

  test('toolbar has Upload, Samples, Guide, theme toggle', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('📂 Upload')).toBeVisible();
    await expect(page.locator('.sample-select')).toBeVisible();
    await expect(page.getByText('📖 Guide')).toBeVisible();
    // Theme toggle button (moon or sun emoji)
    await expect(page.getByText('🌙')).toBeVisible();
  });

  test('analyze button hidden when no image', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('▶ Analyze')).not.toBeVisible();
  });

  test('toolbar alignment: guide/feedback/theme on right', async ({ page }) => {
    await page.goto('/');
    const spacer = page.locator('.toolbar-spacer');
    await expect(spacer).toBeAttached();
  });
});

// ─── Theme Toggle ─────────────────────────────────────────

test.describe('Theme Toggle', () => {
  test('toggles from light to dark', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app')).toHaveAttribute('data-theme', 'light');
    await page.getByText('🌙').click();
    await expect(page.locator('.app')).toHaveAttribute('data-theme', 'dark');
    // Should now show sun emoji
    await expect(page.getByText('☀️')).toBeVisible();
  });

  test('toggles back to light', async ({ page }) => {
    await page.goto('/');
    await page.getByText('🌙').click();
    await page.getByText('☀️').click();
    await expect(page.locator('.app')).toHaveAttribute('data-theme', 'light');
    await expect(page.getByText('🌙')).toBeVisible();
  });

  test('persists theme in localStorage', async ({ page }) => {
    await page.goto('/');
    await page.getByText('🌙').click();
    await expect(page.locator('.app')).toHaveAttribute('data-theme', 'dark');
    // Reload and verify theme persists
    await page.reload();
    await expect(page.locator('.app')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByText('☀️')).toBeVisible();
  });
});

// ─── Guide Button ─────────────────────────────────────────

test.describe('Guide Button', () => {
  test('opens intro.html in new tab', async ({ page, context }) => {
    await page.goto('/');
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByText('📖 Guide').click(),
    ]);
    await newPage.waitForLoadState();
    expect(newPage.url()).toContain('/intro.html');
  });
});

// ─── Sample Loading ───────────────────────────────────────

test.describe('Sample Loading', () => {
  for (const id of SAMPLE_IDS) {
    test(`sample "${id}" loads and shows canvas`, async ({ page }) => {
      await page.goto('/');
      await loadSample(page, id);
      await waitForCanvas(page);
      // After loading, toolbar should show Analyze button
      await expect(page.getByText('▶ Analyze')).toBeVisible();
    });
  }

  test('cycling through all samples leaves no stale state', async ({ page }) => {
    await page.goto('/');
    for (const id of SAMPLE_IDS) {
      await loadSample(page, id);
      await waitForCanvas(page);
    }
    // After cycling, should show last sample — canvas visible, no results yet
    await expect(page.locator('.canvas-panel canvas')).toBeVisible();
    await expect(page.locator('.results-panel')).not.toBeVisible();
  });
});

// ─── Core Workflow: Load → Analyze ─────────────────────────

test.describe('Core Workflow', () => {
  test('analyze button triggers full pipeline', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);
    await runAnalyze(page);
    // Results panel should have table with data rows
    const rows = page.locator('.results-panel table tbody tr');
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    // Lane count shown in results area
    const laneInfo = page.locator('.results-panel .lane-info');
    await expect(laneInfo).toBeVisible();
    const laneText = await laneInfo.textContent();
    expect(laneText).toMatch(/\d+ lanes/);
  });

  test('results table has correct columns', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);
    await runAnalyze(page);
    const headers = page.locator('.results-panel table thead th');
    const headerTexts = await headers.allTextContents();
    expect(headerTexts).toEqual(['Lane', 'Band', 'Raw', 'Corrected', 'Normalized', 'Fold']);
  });

  test('chart is rendered in results', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);
    await runAnalyze(page);
    await expect(page.locator('.chart-container')).toBeVisible();
  });

  test('loading control band selector is present', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);
    await runAnalyze(page);
    await expect(page.locator('.results-panel .controls select')).toBeVisible();
  });
});

// ─── All Samples Full Workflow ────────────────────────────

test.describe('Full Workflow for Each Sample', () => {
  for (const id of SAMPLE_IDS) {
    test(`"${id}" → analyze produces results`, async ({ page }) => {
      await page.goto('/');
      await loadSample(page, id);
      await waitForCanvas(page);
      await runAnalyze(page);
      const rows = page.locator('.results-panel table tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
    });
  }
});

// ─── In-place Export Buttons ──────────────────────────────

test.describe('In-place Exports', () => {
  test('export buttons visible after results', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);
    await runAnalyze(page);
    // Chart exports
    await expect(page.locator('.results-panel').getByText('🖼 PNG')).toBeVisible();
    await expect(page.locator('.results-panel').getByText('📐 SVG')).toBeVisible();
    // Table exports
    await expect(page.locator('.results-panel').getByText('📄 CSV')).toBeVisible();
    await expect(page.locator('.results-panel').getByText('📄 Raw CSV')).toBeVisible();
  });

  test('CSV export triggers download', async ({ page }) => {
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

  test('Chart SVG export triggers download', async ({ page }) => {
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
});

// ─── Ball Radius Control ──────────────────────────────────

test.describe('Ball Radius Control', () => {
  test('ball radius input is visible after loading image', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);
    await expect(page.locator('.radius-control')).toBeVisible();
    await expect(page.locator('.radius-control input')).toHaveValue('50');
  });

  test('changing ball radius value works', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);
    const input = page.locator('.radius-control input');
    await input.fill('30');
    await expect(input).toHaveValue('30');
  });
});

// ─── Edge Cases ───────────────────────────────────────────

test.describe('Edge Cases', () => {
  test('rapid sample switching does not crash', async ({ page }) => {
    await page.goto('/');
    // Rapidly cycle through samples without waiting for canvas
    for (const id of SAMPLE_IDS) {
      await page.locator('.sample-select').selectOption(id);
    }
    // Wait for last sample to settle
    await waitForCanvas(page);
    // Page should still be functional
    await expect(page.getByText('▶ Analyze')).toBeVisible();
  });

  test('analyze without image does nothing (no crash)', async ({ page }) => {
    await page.goto('/');
    // Analyze button shouldn't be visible without image
    await expect(page.getByText('▶ Analyze')).not.toBeVisible();
  });

  test('window resize does not break layout', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);
    await page.setViewportSize({ width: 800, height: 400 });
    await expect(page.locator('.canvas-panel canvas')).toBeVisible();
    await page.setViewportSize({ width: 1400, height: 900 });
    await expect(page.locator('.canvas-panel canvas')).toBeVisible();
  });

  test('loading sample after full workflow resets state', async ({ page }) => {
    await page.goto('/');
    // Full workflow on first sample
    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);
    await runAnalyze(page);
    await expect(page.locator('.results-panel')).toBeVisible();

    // Load a different sample — results should be cleared
    await loadSample(page, 'dose-response');
    await waitForCanvas(page);
    await expect(page.locator('.results-panel')).not.toBeVisible();
  });

  test('re-running analyze does not crash', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'simple-4lane');
    await waitForCanvas(page);
    await runAnalyze(page);
    await expect(page.locator('.results-panel')).toBeVisible();

    // Re-analyze should not crash
    await page.getByText('▶ Analyze').click();
    await expect(page.locator('.toolbar')).toBeVisible();
  });
});

// ─── Dose-Response specific ───────────────────────────────

test.describe('Dose-Response Verification', () => {
  test('dose-response sample detects lanes', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'dose-response');
    await waitForCanvas(page);
    await runAnalyze(page);
    const laneInfo = page.locator('.results-panel .lane-info');
    await expect(laneInfo).toBeVisible();
    const laneText = await laneInfo.textContent();
    expect(laneText).toMatch(/\d+ lanes/);
  });
});

// ─── Multi-Band specific ─────────────────────────────────

test.describe('Multi-Band Verification', () => {
  test('multi-band sample produces multiple band indices', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'multi-band');
    await waitForCanvas(page);
    await runAnalyze(page);

    // Should have multiple band options in the control selector
    const options = page.locator('.results-panel .controls select option');
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
