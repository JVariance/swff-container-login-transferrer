import type Browser from "webextension-polyfill";
import { TabMenuCookies } from "../../Entities";

export function menusOnShown(
	info: Browser.Menus.OnShownInfoType,
	tab: Browser.Tabs.Tab
) {
	console.info("browser.menus.onShown");
	TabMenuCookies.update();
}
