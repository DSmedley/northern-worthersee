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

  test('has sections for past years', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /NoWo 2025/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /NoWo 2024/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /NoWo 2023/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /NoWo 2022/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /NoWo 2021/i })).toBeVisible();
  });
});
