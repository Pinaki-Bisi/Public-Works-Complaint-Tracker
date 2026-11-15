import { expect, test, Page } from '@playwright/test';

async function signIn(page: Page, username: string, password = process.env.PWCT_E2E_PASSWORD || 'Password123!') {
  await page.goto('/login');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test('citizen registration and login open the citizen complaint page', async ({ page }) => {
  const suffix = Date.now();
  await page.goto('/register');
  await page.getByLabel('Full name').fill('E2E Citizen');
  await page.getByLabel('Username').fill(`e2e-${suffix}`);
  await page.getByLabel('Email').fill(`e2e-${suffix}@example.test`);
  await page.getByLabel('Password').fill('Password123!');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'File a complaint' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await signIn(page, `e2e-${suffix}`, 'Password123!');
  await expect(page.getByRole('heading', { name: 'File a complaint' })).toBeVisible();
});

test('citizen complaint moves through supervisor and crew workflow', async ({ page }) => {
  const title = `E2E pothole ${Date.now()}`;
  await signIn(page, process.env.PWCT_E2E_USERNAME || 'citizen');
  await expect(page.getByRole('heading', { name: 'File a complaint' })).toBeVisible();
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Category').click();
  await page.getByRole('option', { name: /Pothole/ }).click();
  await page.getByLabel('Location').fill('Main Street near the library');
  await page.getByLabel('Description').fill('Automated test complaint');
  await page.getByRole('button', { name: 'Submit complaint' }).click();
  const ticket = page.getByRole('link', { name: /PW-/ }).first();
  await expect(ticket).toBeVisible();
  const ticketNo = (await ticket.innerText()).trim();
  await ticket.click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();

  await signIn(page, process.env.PWCT_E2E_SUPERVISOR || 'supervisor');
  await page.goto('/staff');
  await page.getByRole('link', { name: ticketNo }).click();
  await page.getByLabel('Assign crew').click();
  await page.getByRole('option', { name: /Roads Crew/ }).click();
  await page.getByRole('button', { name: 'Assign' }).click();
  await expect(page.getByText('ASSIGNED')).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();

  await signIn(page, process.env.PWCT_E2E_CREW || 'crew');
  await page.goto('/crew');
  await page.getByRole('link', { name: ticketNo }).click();
  await page.getByRole('button', { name: 'IN_PROGRESS' }).click();
  await page.getByRole('button', { name: 'RESOLVED' }).click();
  await expect(page.getByText('RESOLVED').first()).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();

  await signIn(page, process.env.PWCT_E2E_SUPERVISOR || 'supervisor');
  await page.goto('/staff');
  await page.getByRole('link', { name: ticketNo }).click();
  await page.getByRole('button', { name: 'CLOSED' }).click();
  await expect(page.getByText('CLOSED').first()).toBeVisible();
});
