import { expect, test } from '@playwright/test';

test.describe('ArenaMind challenge alignment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows explainable live recommendations that require human approval', async ({ page }) => {
    await page.getByRole('button', { name: /Launch operations/i }).click();

    const queue = page.getByRole('region', { name: 'Operator action queue' });
    await expect(queue).toContainText('3 recommendations');
    await expect(queue).toContainText('AI-assisted, rules verified');
    await expect(queue).toContainText('An operator must approve every action');
    await expect(page.getByTestId('decision-crowd-rebalance')).toContainText('Gate C');
    await page.getByTestId('decision-crowd-rebalance').locator('.decision-summary').click();
    await expect(page.getByTestId('decision-crowd-rebalance')).toContainText('92% load');
  });

  test('applies an approved crowd plan and preserves an audit state', async ({ page }) => {
    await page.getByRole('button', { name: /Launch operations/i }).click();
    await page.click('#btn-approve-crowd-rebalance');

    await expect(page.locator('#btn-approve-crowd-rebalance')).toBeDisabled();
    await expect(page.locator('#btn-approve-crowd-rebalance')).toContainText('Approved');
    await expect(page.locator('#gate-ctrl-gate-c')).toContainText('Restricted');
    await expect(page.locator('#gate-ctrl-gate-c')).toContainText('Load: 68%');
    await expect(page.locator('#gate-ctrl-gate-d')).toContainText('Restricted');
  });

  test('drafts a multilingual transit broadcast from a live recommendation', async ({ page }) => {
    await page.getByRole('button', { name: /Launch operations/i }).click();
    await page.click('#btn-approve-transit-diversion');

    await expect(page.locator('#broadcast-input')).toHaveValue(/Line 6 is crowded/);
    await expect(page.locator('#broadcast-input')).toHaveValue(/Line 2 Local/);
  });

  test('supports French and right-to-left Arabic offline assistance', async ({ page }) => {
    await page.getByRole('button', { name: /Open fan experience/i }).click();
    await page.selectOption('#lang-select', 'fr');
    await page.fill('#chat-input', 'wheelchair elevator');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.locator('.chat-bubble.ai').last()).toContainText('Porte E');

    await page.selectOption('#lang-select', 'ar');
    await expect(page.getByRole('log', { name: 'ArenaMind conversation' })).toHaveAttribute('dir', 'rtl');
    await page.fill('#chat-input', 'metro');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.locator('.chat-bubble.ai').last()).toContainText('الخط المحلي 2');
  });

  test('makes stadium locations operable from the keyboard', async ({ page }) => {
    await page.getByRole('button', { name: /Open fan experience/i }).click();
    const gate = page.getByRole('button', { name: /Gate D.*45 mins/i });
    await gate.focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('.selected-zone-info')).toContainText('Gate D (South Entry)');
    await expect(page.locator('.selected-zone-info')).toContainText('Wait: 45 mins');
  });

  test('validates empty incident and broadcast submissions inline', async ({ page }) => {
    await page.getByRole('button', { name: /Launch operations/i }).click();
    await page.click('#btn-toggle-report');
    await page.click('#btn-submit-incident');
    await expect(page.locator('#form-error')).toHaveText('Please enter a description for the incident.');

    await page.click('#btn-submit-broadcast');
    await expect(page.getByText('Please input emergency message description.')).toBeVisible();
  });
});
