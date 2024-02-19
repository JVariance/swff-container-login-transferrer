import type Browser from "webextension-polyfill";
import { TabMenuCookies, TabMenuRemoveCookies } from "../../Entities";

export function menusOnShown(
	info: Browser.Menus.OnShownInfoType,
	tab: Browser.Tabs.Tab
) {
	console.info("browser.menus.onShown");
	TabMenuCookies.update();
	TabMenuRemoveCookies.update();
}
