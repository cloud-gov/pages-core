const { test, expect } = require('@playwright/test');

test('has title', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Pages/);
});

test('use cookie login', async ({ page }) => {
  await page.goto('/sites');

  // eslint-disable-next-line testing-library/prefer-screen-queries
  await expect(page.getByText('Your sites')).toBeVisible();
});
