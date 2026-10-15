import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock mode - navigate directly to app
    await page.goto(`${BASE_URL}`);
    // In mock mode, login is not required automatically
    // But we need to navigate to /utilisateurs first to trigger the mock auth
    await page.goto(`${BASE_URL}/utilisateurs`);
    // Then go back to dashboard
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard KPIs', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Tableau de bord');

    // Check for KPI labels
    await expect(page.locator('text=Utilisateurs actifs')).toBeVisible();
    await expect(page.locator('text=Total dépôts')).toBeVisible();
    await expect(page.locator('text=Total retraits')).toBeVisible();
    await expect(page.locator('text=Solde plateforme')).toBeVisible();
  });

  test('should have working quick action buttons', async ({ page }) => {
    const userButton = page.locator('button:has-text("👤 Utilisateurs")');
    await expect(userButton).toBeVisible();

    const kycButton = page.locator('button:has-text("✓ KYC")');
    await expect(kycButton).toBeVisible();

    const promoButton = page.locator('button:has-text("🎁 Promotions")');
    await expect(promoButton).toBeVisible();
  });

  test('should navigate to users page', async ({ page }) => {
    await page.click('button:has-text("👤 Utilisateurs")');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Utilisateurs');
  });
});

test.describe('Promotions Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/utilisateurs`);
    await page.goto(`${BASE_URL}/promotions`);
    await page.waitForLoadState('networkidle');
  });

  test('should display promotions KPIs', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Promotions');
    await expect(page.locator('text=Codes totaux')).toBeVisible();
    await expect(page.locator('text=Codes actifs')).toBeVisible();
  });

  test('should open promo code creation form', async ({ page }) => {
    const createButton = page.locator('button:has-text("+ Créer code")');
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Check form fields appear
    await expect(page.locator('input[placeholder="SUMMER20"]')).toBeVisible();
    await expect(page.locator('select')).toBeVisible();
  });
});

test.describe('Games Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/utilisateurs`);
    await page.goto(`${BASE_URL}/jeux`);
    await page.waitForLoadState('networkidle');
  });

  test('should display games list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Jeux');
    await expect(page.locator('text=Jeux actifs')).toBeVisible();
  });

  test('should filter games by category', async ({ page }) => {
    const casinoFilter = page.locator('button:has-text("Casino")');
    await expect(casinoFilter).toBeVisible();
    await casinoFilter.click();

    // After filtering, only Casino games should be visible
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Admins Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/utilisateurs`);
    await page.goto(`${BASE_URL}/admins`);
    await page.waitForLoadState('networkidle');
  });

  test('should display admin list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Administrateurs');
    await expect(page.locator('text=Admins total')).toBeVisible();
  });

  test('should display admin creation form', async ({ page }) => {
    const createButton = page.locator('button:has-text("+ Ajouter admin")');
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Check form appears
    await expect(page.locator('input[placeholder="admin@wynveo.com"]')).toBeVisible();
  });
});

test.describe('Audit Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/utilisateurs`);
    await page.goto(`${BASE_URL}/audit`);
    await page.waitForLoadState('networkidle');
  });

  test('should display audit logs', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Journaux d\'audit');
    await expect(page.locator('text=Logs total')).toBeVisible();
  });

  test('should have filtering options', async ({ page }) => {
    const adminSelect = page.locator('label:has-text("Admin") + select');
    await expect(adminSelect).toBeVisible();
  });
});
