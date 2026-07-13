import { test, expect } from '@playwright/test';

test.describe('ArenaMind 2026 E2E Platform Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Open the platform
    await page.goto('/');
  });

  test('Page metadata, header info, and role toggling', async ({ page }) => {
    // 1. Verify Page Title
    await expect(page).toHaveTitle(/ArenaMind 2026/);

    // 2. Verify branding logo exists
    const logo = page.locator('.logo-title');
    await expect(logo).toContainText('ArenaMind');

    // 3. Verify the public product overview is the default entry point
    await expect(page.getByRole('heading', { name: /One living view/i })).toBeVisible();

    // 4. Open the Fan Hub and verify secure workspace state
    await page.getByRole('button', { name: /Open fan experience/i }).click();
    const secureBadge = page.locator('.security-status-badge');
    await expect(secureBadge).toBeVisible();
    await expect(secureBadge).toContainText('Secure Mode');
    const hubTitle = page.locator('.fan-hub-screen h2').first();
    await expect(hubTitle).toContainText('Fan Experience Hub');

    // 6. Toggle view to Ops Command
    await page.click('#btn-ops-command');
    const opsTitle = page.locator('.ops-command-screen h3').first();
    await expect(opsTitle).toContainText('AI Operations Command Advisor');

    // 7. Toggle back to Fan Hub
    await page.click('#btn-fan-hub');
    await expect(hubTitle).toContainText('Fan Experience Hub');
  });

  test('Complete product overview and responsive containment', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /One living view/i })).toBeVisible();
    await expect(page.getByText('From signal to action, without changing tools.')).toBeVisible();
    await expect(page.getByText('For fans')).toBeVisible();
    await expect(page.getByText('For venue teams')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByRole('button', { name: /Open fan experience/i }).click();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('Multilingual AI Assistant core conversation and quick chips', async ({ page }) => {
    await page.click('#btn-fan-hub');
    // 1. Send manual message
    await page.fill('#chat-input', 'Best gate to enter');
    await page.locator('#btn-send-chat').dispatchEvent('click');

    // Verify loading state appears
    await expect(page.locator('.typing-indicator')).toBeVisible();

    // Verify AI response arrives
    const lastResponse = page.locator('.chat-bubble.ai').last();
    await expect(lastResponse).toContainText(/gate/i);

    // 2. Click a quick query chip
    await page.click('#quick-chip-1'); // Wheelchair elevators chip
    await expect(page.locator('.typing-indicator')).toBeVisible();
    await expect(page.locator('.chat-bubble.ai').last()).toContainText(/Gate E/i);

    // 3. Change assistant language to Spanish
    await page.selectOption('#lang-select', 'es');
    await page.fill('#chat-input', 'comida');
    await page.locator('#btn-send-chat').dispatchEvent('click');
    await expect(page.locator('.chat-bubble.ai').last()).toContainText(/North Concourse Grill/i);
  });

  test('Accessibility parameters controls', async ({ page }) => {
    await page.click('#btn-fan-hub');
    // 1. Verify high contrast is off by default
    const hubScreen = page.locator('.fan-hub-screen');
    await expect(hubScreen).not.toHaveClass(/high-contrast-mode/);

    // 2. Toggle high contrast on
    await page.click('#btn-toggle-contrast');
    await expect(hubScreen).toHaveClass(/high-contrast-mode/);

    // 3. Toggle back off
    await page.click('#btn-toggle-contrast');
    await expect(hubScreen).not.toHaveClass(/high-contrast-mode/);

    // 4. Text scaling: cycle sizes
    await page.click('#btn-toggle-text-size');
    await expect(hubScreen).toHaveClass(/text-lg/);

    await page.click('#btn-toggle-text-size');
    await expect(hubScreen).toHaveClass(/text-xl/);

    await page.click('#btn-toggle-text-size');
    await expect(hubScreen).not.toHaveClass(/text-/); // Returns to normal

    // 5. Toggle Voice narration check
    const voiceBtn = page.locator('#btn-toggle-voice');
    await expect(voiceBtn).toContainText('Audio OFF');
    await page.click('#btn-toggle-voice');
    await expect(voiceBtn).toContainText('Audio ON');
  });

  test('Sustainability bin scan gamification and rewards claiming', async ({ page }) => {
    await page.click('#btn-fan-hub');
    // 1. Verify initial stats
    await expect(page.locator('#eco-points')).toContainText('150');
    await expect(page.locator('#eco-co2')).toContainText('3.5 kg');
    await expect(page.locator('#eco-scans')).toContainText('7');

    // 2. Scan bin QR code
    await page.click('#btn-scan-bin');

    // Verify stats increment
    await expect(page.locator('#scan-notification')).toBeVisible();
    await expect(page.locator('#eco-points')).toContainText('200');
    await expect(page.locator('#eco-co2')).toContainText('4 kg');
    await expect(page.locator('#eco-scans')).toContainText('8');

    // 3. Claim coupon reward (deducts 100 points)
    await page.click('#btn-claim-coupon');

    // Verify discount display is rendered
    await expect(page.locator('#coupon-display')).toBeVisible();
    await expect(page.locator('#coupon-display code')).toContainText('GREEN-FIFA-');
    await expect(page.locator('#eco-points')).toContainText('100');
  });

  test('Smart Map marker selectors and integration', async ({ page }) => {
    await page.click('#btn-fan-hub');
    // 1. Click Gate D marker on SVG
    await page.click('#map-node-gate-d');

    // Verify info panel populates
    const infoPanel = page.locator('.selected-zone-info');
    await expect(infoPanel).toContainText('Gate D (South Entry)');
    await expect(infoPanel).toContainText('Wait: 45 mins.');

    // 2. Click "Ask AI about this area"
    await page.click('#btn-ask-ai-gate-d');

    // Verify text is copied to chat input
    const chatInput = page.locator('#chat-input');
    await expect(chatInput).toHaveValue(/Gate D/);

    // Send query
    await page.locator('#btn-send-chat').dispatchEvent('click');
    await expect(page.locator('.chat-bubble.ai').last()).toContainText(/Gate D/i);
  });

  test('Operations incident filing, auto-triage, and task dispatcher', async ({ page }) => {
    // 1. Go to Operations Center
    await page.click('#btn-ops-command');

    // Verify AI Operational briefing is populated
    await expect(page.locator('#ops-ai-brief')).toContainText(/Gate/i);

    // 2. Open Incident Form
    await page.click('#btn-toggle-report');

    // 3. Fill form details representing a critical fire/smoke event
    await page.selectOption('#inc-category', 'Security');
    await page.selectOption('#inc-location', 'Gate A (North Entry)');
    await page.fill('#inc-description', 'Fire warning trigger in mechanical room near Gate A, light smoke');
    
    // Submit
    await page.click('#btn-submit-incident');

    // 4. Verify incident appears in log, classified as CRITICAL by AI rules
    const newInc = page.locator('[id^="inc-item-inc-"]').first();
    await expect(newInc).toBeVisible();
    await expect(newInc.locator('.font-mono').first()).toContainText('CRITICAL');
    await expect(newInc).toContainText('Fire warning trigger');
    await expect(newInc).toContainText('GenAI Tactical Plan:Deploy Emergency Security Squad');

    // 5. Verify corresponding task is added to Dispatcher Unassigned column
    const dispatcherTask = page.locator('[id^="task-item-task-"]').first();
    await expect(dispatcherTask).toBeVisible();
    await expect(dispatcherTask).toContainText('CRITICAL: Clear gate/stairs');

    // 6. Assign task to yourself
    await dispatcherTask.locator('button').click();

    // Verify task is now In Progress
    const inProgressSec = page.locator('.md\\:grid-cols-3 > div:nth-child(2)');
    await expect(inProgressSec).toContainText('Officer Ramirez');

    // 7. Complete task
    await inProgressSec.locator('button').first().click();

    // Verify task is moved to Completed column
    const completedSec = page.locator('.md\\:grid-cols-3 > div:nth-child(3)');
    await expect(completedSec).toContainText('Clear gate/stairs');
  });

  test('Emergency Broadcast Jumbotron translators', async ({ page }) => {
    // 1. Go to Ops Command
    await page.click('#btn-ops-command');

    // 2. Fill Broadcast message
    await page.fill('#broadcast-input', 'Gate C turnstiles overloaded. Divert outbound fans.');
    await page.click('#btn-submit-broadcast');

    // Verify message appears in active translation logs with AI localized terms
    const alertItem = page.locator('[id^="broadcast-item-alert-"]').first();
    await expect(alertItem).toBeVisible();
    await expect(alertItem).toContainText('EN:Gate C turnstiles overloaded');
    await expect(alertItem).toContainText('ES:ATENCIÓN: Puertas C y D congestionadas');
    await expect(alertItem).toContainText('FR:ATTENTION: Portes C et D encombrées');
    await expect(alertItem).toContainText('AR:تنبيه: البوابتان C و D مزدحمتان');
  });

  test('Security filters: XSS and SQL Injection validation', async ({ page }) => {
    await page.click('#btn-fan-hub');
    // 1. Submit XSS payload in chatbot
    const xssPayload = '<script>alert("XSS-Hack")</script>';
    await page.fill('#chat-input', xssPayload);
    await page.click('#btn-send-chat', { force: true });

    // Verify message text is rendered as plain text rather than executing script
    const userMessage = page.locator('.chat-bubble.user').last();
    await expect(userMessage).toContainText('&lt;script&gt;alert(&quot;XSS-Hack&quot;)&lt;&#x2F;script&gt;');

    // 2. Submit SQL injection payload in incident description
    await page.click('#btn-ops-command');
    await page.click('#btn-toggle-report');
    await page.fill('#inc-description', "' OR 1=1 --");
    await page.click('#btn-submit-incident');

    // Verify it is treated as a clean literal description
    const incLog = page.locator('[id^="inc-item-inc-"]').first();
    await expect(incLog).toContainText("&#x27; OR 1=1 --");
  });

});
