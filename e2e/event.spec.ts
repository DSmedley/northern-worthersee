import { test, expect } from '@playwright/test';

test.describe('event page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/event/');
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Event.*Northern Wörthersee/);
  });

  test('has Event Overview section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Event Overview' })).toBeVisible();
  });

  test('has Location section with Kern Pavilion', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Location', exact: true })).toBeVisible();
    await expect(page.getByText('Kern Pavilion').first()).toBeVisible();
    await expect(page.getByText('Frankenmuth', { exact: false }).first()).toBeVisible();
  });

  test('has Admission section with pricing', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Admission' })).toBeVisible();
    await expect(page.getByText('$35', { exact: false })).toBeVisible();
    await expect(page.getByText('$40', { exact: false })).toBeVisible();
    await expect(page.getByText('Free', { exact: false }).first()).toBeVisible();
  });

  test('has Event Schedule section with key times', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Event Schedule' })).toBeVisible();
    await expect(page.getByText('9:30 AM', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('10:00 AM', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('2:00 PM', { exact: false }).first()).toBeVisible();
  });

  test('schedule includes awards ceremony', async ({ page }) => {
    await expect(page.getByText('Awards ceremony', { exact: false })).toBeVisible();
  });

  test('has link to Awards page', async ({ page }) => {
    await expect(page.getByRole('link', { name: /awards/i })).toBeVisible();
  });

  test('has link to Contact page', async ({ page }) => {
    await expect(page.getByRole('link', { name: /contact/i }).first()).toBeVisible();
  });

  test('has register button', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /register/i }).first();
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute('href', /northernworthersee\.com\/store/);
  });

  test('notes European vehicles only', async ({ page }) => {
    await expect(page.getByText('European vehicles only', { exact: false })).toBeVisible();
  });
});
