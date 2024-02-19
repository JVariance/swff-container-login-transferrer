import Browser from "webextension-polyfill";

export class BrowserStorage {
	private constructor() {}

	static getCookieDuplicatedDomains(): Promise<
		Record<"cookieDuplicatedDomains", string[]>
	> {
		return Browser.storage.local.get("cookieDuplicatedDomains");
	}

	static setCookieDuplicatedDomains(cookieDuplicatedDomains: string[]) {
		return Browser.storage.local.set({ cookieDuplicatedDomains });
	}
}
