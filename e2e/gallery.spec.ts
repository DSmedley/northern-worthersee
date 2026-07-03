import { test, expect } from '@playwright/test';

test.describe('gallery page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gallery/');
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Gallery.*Northern Wörthersee/);
  });

  test('has gallery heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /gallery/i }).first()).toBeVisible();
  });

  test('has a section for the current year (2026)', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /NoWo 2026/i })).toBeVisible();
  });

  // Past years mirror the year folders in assets/gallery/
  test('has sections for past years', async ({ page }) => {
    for (const year of ['2025', '2024', '2023', '2017', '2016', '2015', '2014']) {
      await expect(page.getByRole('heading', { name: `NoWo ${year}` })).toBeVisible();
    }
  });
});
