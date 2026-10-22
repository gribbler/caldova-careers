import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Derive the expected posting count from the job content collection so this
// assertion stays correct as roles are added or removed.
const jobsDir = fileURLToPath(new URL('../src/content/jobs', import.meta.url));
const expectedRoleCount = readdirSync(jobsDir).filter((f) => f.endsWith('.md')).length;

test.describe('Open roles listing', () => {
    test('shows the roles grid with all postings', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { name: 'Open roles' })).toBeVisible();

        const grid = page.getByTestId('roles-grid');
        await expect(grid).toBeVisible();
        await expect(page.getByTestId('role-card')).toHaveCount(expectedRoleCount);
    });

    test('filters roles by department', async ({ page }) => {
        await page.goto('/');

        await page.getByTestId('department-filter').selectOption({ label: 'Technology' });

        const visibleCards = page.locator('[data-testid="role-card"]:visible');
        await expect(visibleCards).toHaveCount(2);
        await expect(visibleCards.getByTestId('role-department')).toHaveText([
            'Technology',
            'Technology',
        ]);
    });

    test('filters roles by location', async ({ page }) => {
        await page.goto('/');

        await page.getByTestId('location-filter').selectOption({
            label: 'London, United Kingdom',
        });

        const visibleCards = page.locator('[data-testid="role-card"]:visible');
        await expect(visibleCards).toHaveCount(1);
        await expect(visibleCards.getByTestId('role-title')).toHaveText('Regional Sales Manager');
    });

    test('combines filters, shows no matches, and resets to all roles', async ({ page }) => {
        await page.goto('/');
        const visibleCards = page.locator('[data-testid="role-card"]:visible');

        await page.getByTestId('department-filter').selectOption({ label: 'Technology' });
        await expect(visibleCards).toHaveCount(2);
        await page.getByTestId('location-filter').selectOption({
            label: 'London, United Kingdom',
        });

        await expect(page.getByTestId('roles-grid')).toBeHidden();
        await expect(page.getByTestId('filter-empty-state')).toBeVisible();
        await expect(visibleCards).toHaveCount(0);

        await page.getByTestId('role-filter-reset').click();

        await expect(page.getByTestId('department-filter')).toHaveValue('');
        await expect(page.getByTestId('location-filter')).toHaveValue('');
        await expect(page.getByTestId('filter-empty-state')).toBeHidden();
        await expect(page.getByTestId('roles-grid')).toBeVisible();
        await expect(visibleCards).toHaveCount(expectedRoleCount);
    });

    test('links through to a role detail page', async ({ page }) => {
        await page.goto('/');
        const firstCard = page.getByTestId('role-card').first();
        const title = await firstCard.getByTestId('role-title').textContent();
        await firstCard.click();
        await expect(page.getByTestId('role-detail-title')).toHaveText(title!.trim());
        await expect(page.getByTestId('apply-form')).toBeVisible();
    });

    for (const { title, location } of [
        { title: 'Senior Frontend Engineer', location: 'Remote (US & Canada)' },
        { title: 'Financial Analyst', location: 'Woodinville, WA, USA' },
    ]) {
        test(`shows ${title} location on its card and details`, async ({ page }) => {
            await page.goto('/');
            const card = page.getByTestId('role-card').filter({
                has: page.getByRole('heading', { name: title, exact: true }),
            });

            await expect(card).toBeVisible();
            await expect(card.getByTestId('role-location')).toHaveText(location);
            await card.click();
            await expect(page.getByText(location, { exact: true })).toBeVisible();
        });
    }

    test('has no automatically detectable accessibility violations', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();
        expect(results.violations).toEqual([]);
    });
});
