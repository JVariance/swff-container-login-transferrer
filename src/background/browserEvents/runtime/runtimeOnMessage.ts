import Browser from "webextension-polyfill";

export async function runtimeOnMessage(
	message: any,
	sender: Browser.Runtime.MessageSender,
	sendResponse: () => void
) {
	const { msg } = message;

	switch (msg) {
		default:
			break;
	}
}
