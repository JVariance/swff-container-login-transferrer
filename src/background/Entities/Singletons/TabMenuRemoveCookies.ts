import Browser, { i18n } from "webextension-polyfill";
import * as API from "@root/browserAPI";

class TabMenuRemoveCookies {
	#parentId!: string;
	private static _instance: TabMenuRemoveCookies;

	private constructor() {}

	public static get Instance() {
		return this._instance || (this._instance = new this());
	}

	init() {
		return this.update();
	}

	#createParentMenu() {
		this.#parentId = Browser.menus.create({
			id: "tab-menu-remove-cookies",
			title: i18n.getMessage("remove_login_data"),
			contexts: ["tab"],
			// enabled: false,
		}) as string;
	}

	async update() {
		console.info("update TabMenuRemoveCookies");

		await Browser.menus.removeAll();
		this.#createParentMenu();

		["cookies", "localStorage", i18n.getMessage("both")].forEach((action) => {
			Browser.menus.create({
				id: `remove-cookies_${action}`,
				title: action,
				contexts: ["tab"],
				type: "normal",
				parentId: this.#parentId,
			});
		});

		Browser.menus.refresh();
	}
}

export default TabMenuRemoveCookies.Instance;
