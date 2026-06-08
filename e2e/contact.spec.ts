import { test, expect } from '@playwright/test';

test.describe('contact page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact/');
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Contact.*Northern Wörthersee/);
  });

  test('has Get In Touch section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Get In Touch' })).toBeVisible();
  });

  test('displays the contact email address', async ({ page }) => {
    await expect(page.getByText('northernworthersee@gmail.com', { exact: false })).toBeVisible();
  });

  test('has Follow Us section with social links', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Follow Us' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Facebook', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Instagram', exact: true })).toBeVisible();
  });

  test('has Register for the Event section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Register for the Event' })).toBeVisible();
  });

  test('has register button linking to the store', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /register/i }).first();
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute('href', /northernworthersee\.com\/store/);
  });
});
