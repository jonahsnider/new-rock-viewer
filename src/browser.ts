import path from 'node:path';
import { taskLog } from '@clack/prompts';
import { pathExists } from 'path-exists';
import type { BrowserContext, Page } from 'playwright';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { env } from './env.ts';

chromium.use(StealthPlugin());

export class AsyncDisposablePage {
	public readonly page: Page;

	private constructor(page: Page) {
		this.page = page;
	}

	static async create(context: BrowserContext): Promise<AsyncDisposablePage> {
		const page = await context.newPage();
		return new AsyncDisposablePage(page);
	}

	async [Symbol.asyncDispose](): Promise<void> {
		await this.page.close();
	}
}

export const browser = await chromium.launch({
	headless: true,
});

const STORAGE_STATE_PATH = path.join(import.meta.dirname, '..', 'browser-state.json');

export const context = await browser.newContext({
	storageState: (await pathExists(STORAGE_STATE_PATH)) ? STORAGE_STATE_PATH : undefined,
});

const ALREADY_LOGGED_IN_ROUTE = new URLPattern('https://www.newrock.com/en/my-account');

/**
 * Check if we have valid authentication cookies in the browser context.
 * Returns true if authentication cookies exist and haven't expired.
 */
async function hasValidAuthCookies(context: BrowserContext): Promise<boolean> {
	const cookies = await context.cookies('https://www.newrock.com');

	// Check for PHPSESSID cookie (critical for session)
	const phpSessionCookie = cookies.find((cookie) => cookie.name === 'PHPSESSID');

	// Check for PrestaShop authentication cookie (starts with "PrestaShop-")
	const prestaShopCookie = cookies.find((cookie) => cookie.name.startsWith('PrestaShop-'));

	// If either cookie is missing, we need to authenticate
	if (!phpSessionCookie || !prestaShopCookie) {
		return false;
	}

	// Check if cookies have expired (expires is in Unix timestamp format)
	const now = Date.now() / 1000; // Convert to seconds

	// Check PHPSESSID expiration (expires is -1 for session cookies or a timestamp)
	if (phpSessionCookie.expires !== -1 && phpSessionCookie.expires < now) {
		return false;
	}

	// Check PrestaShop cookie expiration
	if (prestaShopCookie.expires !== -1 && prestaShopCookie.expires < now) {
		return false;
	}

	return true;
}

export async function authenticate(context: BrowserContext): Promise<void> {
	const log = taskLog({ title: 'Signing in to New Rock' });

	// Check if we already have valid authentication cookies
	if (await hasValidAuthCookies(context)) {
		log.success('Already authenticated with valid cookies');
		return;
	}

	// Authenticate with the New Rock website by going through the actual login flow
	// Using the AsyncDisposablePage wrapper ensures the page is automatically closed
	await using disposablePage = await AsyncDisposablePage.create(context);
	const { page } = disposablePage;

	log.message('Navigating to login page');
	// Navigate to the login page
	await page.goto('https://www.newrock.com/en/login?back=my-account');

	// Wait for the page to load
	log.message('Loading login page');
	await page.waitForLoadState('domcontentloaded');

	// Check if we're already logged in by seeing if we were redirected to my-account
	if (!ALREADY_LOGGED_IN_ROUTE.test(page.url())) {
		// Fill in the email field - use the specific name attribute from the login form
		log.message('Filling in email');
		await page.locator('input[name="email"][type="email"]').first().fill(env.NEW_ROCK_USERNAME);

		// Fill in the password field - use first() to avoid matching the modal form
		log.message('Filling in password');
		await page.locator('input[name="password"][type="password"]').first().fill(env.NEW_ROCK_PASSWORD);

		// Click the "Sign in" button
		log.message('Clicking sign in button');
		await page.getByRole('button', { name: /sign in/i }).click();

		// Wait for navigation to complete after login
		log.message('Waiting for login to complete');
		await page.waitForLoadState('networkidle');

		log.message('Login successful');
	}

	// Save the authenticated state
	await context.storageState({ path: STORAGE_STATE_PATH });

	log.success('Saved authentication state');
}
