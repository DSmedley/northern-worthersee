import { test, expect } from '@playwright/test';

test.describe('navigation', () => {
  test('nav contains all expected menu items', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav');
    await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Event' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Gallery' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Awards' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Sponsors' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Contact' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Store' })).toBeVisible();
  });

  test('Event nav link navigates to event page', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav').getByRole('link', { name: 'Event' }).click();
    await expect(page).toHaveURL('/event/');
    await expect(page).toHaveTitle(/Event.*Northern Wörthersee/);
  });

  test('Gallery nav link navigates to gallery page', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav').getByRole('link', { name: 'Gallery' }).click();
    await expect(page).toHaveURL('/gallery/');
    await expect(page).toHaveTitle(/Gallery.*Northern Wörthersee/);
  });

  test('Awards nav link navigates to awards page', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav').getByRole('link', { name: 'Awards' }).click();
    await expect(page).toHaveURL('/awards/');
    await expect(page).toHaveTitle(/Awards.*Northern Wörthersee/);
  });

  test('Sponsors nav link navigates to sponsors page', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav').getByRole('link', { name: 'Sponsors' }).click();
    await expect(page).toHaveURL('/sponsors/');
    await expect(page).toHaveTitle(/Sponsors.*Northern Wörthersee/);
  });

  test('Contact nav link navigates to contact page', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav').getByRole('link', { name: 'Contact' }).click();
    await expect(page).toHaveURL('/contact/');
    await expect(page).toHaveTitle(/Contact.*Northern Wörthersee/);
  });

  test('Store nav link points to external store URL', async ({ page }) => {
    await page.goto('/');
    const storeLink = page.locator('nav').getByRole('link', { name: 'Store' });
    await expect(storeLink).toHaveAttribute('href', /northernworthersee\.com\/store/);
  });
});
