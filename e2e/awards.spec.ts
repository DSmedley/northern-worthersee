import { test, expect } from '@playwright/test';

test.describe('awards page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/awards/');
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Awards.*Northern Wörthersee/);
  });

  test('has Form vs. Function section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Form vs. Function' })).toBeVisible();
  });

  test('has Award Classes section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Award Classes' })).toBeVisible();
  });

  test('lists Most Unique award class', async ({ page }) => {
    await expect(page.getByText('Most Unique', { exact: true }).first()).toBeVisible();
  });

  test('lists Best of Breed classes', async ({ page }) => {
    await expect(page.getByText('Best of Breed', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Volkswagen', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Audi', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Porsche', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('BMW', { exact: false }).first()).toBeVisible();
  });

  test('has How Voting Works section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'How Voting Works' })).toBeVisible();
  });

  test('has register to compete button', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /register/i });
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute('href', /northernworthersee\.com\/store/);
  });
});
