const { test, expect } = require('@playwright/test');

test('has title', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Pages/);
});

test('use cookie login', async ({ page }) => {
  await page.goto('/sites');

  await expect(page.getByText('Your sites')).toBeVisible();
});
