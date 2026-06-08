import { test, expect } from '@playwright/test';

test.describe('sponsors page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sponsors/');
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Sponsors.*Northern Wörthersee/);
  });

  test('has Event Sponsors section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Event Sponsors' })).toBeVisible();
  });

  test('has Become a Sponsor section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Become a Sponsor' })).toBeVisible();
  });

  test('lists sponsor names', async ({ page }) => {
    await expect(page.getByRole('img', { name: 'Air Lift Performance' })).toBeVisible();
    await expect(page.getByRole('img', { name: '034 Motorsport' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'APR' })).toBeVisible();
  });

  test('sponsor logos link to sponsor sites', async ({ page }) => {
    const airLiftLink = page.getByRole('link', { name: /air lift/i });
    await expect(airLiftLink).toHaveAttribute('href', /airliftperformance\.com/);
  });

  test('has contact link for sponsorship inquiries', async ({ page }) => {
    await expect(page.getByRole('link', { name: /contact/i }).first()).toBeVisible();
  });

  test('thanks sponsors in page copy', async ({ page }) => {
    await expect(page.getByText(/generous support/i)).toBeVisible();
  });
});
