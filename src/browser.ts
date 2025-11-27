import path from 'node:path';
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

export async function authenticate(context: BrowserContext): Promise<void> {
	// Authenticate with the New Rock website by going through the actual login flow
	// Using the AsyncDisposablePage wrapper ensures the page is automatically closed
	await using disposablePage = await AsyncDisposablePage.create(context);
	const { page } = disposablePage;

	// Navigate to the login page
	await page.goto('https://www.newrock.com/en/login?back=my-account');

	// Wait for the page to load
	await page.waitForLoadState('domcontentloaded');

	// Check if we're already logged in by seeing if we were redirected to my-account
	if (!ALREADY_LOGGED_IN_ROUTE.test(page.url())) {
		// Fill in the email field - use the specific name attribute from the login form
		await page.locator('input[name="email"][type="email"]').first().fill(env.NEW_ROCK_USERNAME);

		// Fill in the password field - use first() to avoid matching the modal form
		await page.locator('input[name="password"][type="password"]').first().fill(env.NEW_ROCK_PASSWORD);

		// Click the "Sign in" button
		await page.getByRole('button', { name: /sign in/i }).click();

		// Wait for navigation to complete after login
		await page.waitForLoadState('networkidle');
	}

	// Save the authenticated state
	await context.storageState({ path: STORAGE_STATE_PATH });
}
