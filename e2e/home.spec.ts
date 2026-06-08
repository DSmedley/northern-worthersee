import { test, expect } from '@playwright/test';

test.describe('home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Northern Wörthersee');
  });

  test('mentions Northern Wörthersee in the body', async ({ page }) => {
    await expect(page.getByText('Northern Wörthersee', { exact: false }).first()).toBeVisible();
  });

  test('mentions Frankenmuth', async ({ page }) => {
    await expect(page.getByText('Frankenmuth', { exact: false }).first()).toBeVisible();
  });

  test('has a register button linking to the store', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /register/i }).first();
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute('href', /northernworthersee\.com\/store/);
  });

  test('has an event details button linking to /event/', async ({ page }) => {
    const eventLink = page.getByRole('link', { name: /event/i }).filter({ hasNotText: /store/i }).first();
    await expect(eventLink).toBeVisible();
  });

  test('displays the event year', async ({ page }) => {
    await expect(page.getByText('2026', { exact: false }).first()).toBeVisible();
  });

  test('displays the event location', async ({ page }) => {
    await expect(page.getByText('Kern Pavilion', { exact: false })).toBeVisible();
  });
});
