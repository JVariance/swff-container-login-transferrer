import Browser from "webextension-polyfill";
import * as API from "@root/browserAPI";

export async function runtimeOnInstalled(
	details: Browser.Runtime.OnInstalledDetailsType
) {
	console.info("onInstalled");

	switch (details.reason) {
		case "install":
			break;
		case "update":
			break;
		default:
			break;
	}
}
