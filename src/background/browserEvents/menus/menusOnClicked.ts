import Browser from "webextension-polyfill";
import * as API from "@root/browserAPI";

async function removeCookies(domain: string, storeId: string) {
	const cookies = await Browser.cookies.getAll({
		// domain: ".www.kleinanzeigen.de",
		// storeId: "firefox-container-1",
		domain,
		storeId,
	});

	for (let cookie of cookies) {
		console.log({ cookie });
		await Browser.cookies.remove({
			name: cookie.name,
			storeId,
			url: `https://${
				cookie.domain.startsWith(".")
					? cookie.domain.substring(1)
					: cookie.domain
			}${cookie.path}`,
		});
	}
}

async function syncCookie(
	removed: boolean,
	cookie: Browser.Cookies.Cookie & { strippedDomain: string },
	targetContainerStoreId: string
) {
	console.log("syncing", cookie.domain, { removed, cookie });
	if (removed) {
		console.log(`removing cookie ${cookie.name} from store ${cookie.storeId}`);
		Browser.cookies.remove({
			url: `https://${cookie.domain}${cookie.path}`,
			name: cookie.name,
		});
	} else {
		console.log(
			`copying cookie ${cookie.name} to store ${targetContainerStoreId}`
		);

		await Browser.cookies.set({
			url: `https://${cookie.strippedDomain}${cookie.path}`,
			domain: cookie.domain,
			expirationDate: cookie.expirationDate,
			firstPartyDomain: cookie.firstPartyDomain,
			httpOnly: cookie.httpOnly,
			name: cookie.name,
			partitionKey: cookie.partitionKey,
			path: cookie.path,
			sameSite: "strict",
			// sameSite: cookie.sameSite,
			secure: cookie.secure,
			value: cookie.value,
			storeId: targetContainerStoreId,
		});
	}
}

export async function menusOnClicked(
	info: Browser.Menus.OnClickData,
	tab: Browser.Tabs.Tab | undefined
) {
	const { menuItemId: _menuItemId } = info;
	const menuItemId = _menuItemId.toString();

	if (menuItemId.toString().startsWith("container")) {
		const sourceContainerStoreId = menuItemId.split("_")[1];
		const currentTab = (
			await API.queryTabs({ active: true, currentWindow: true })
		).tabs?.at(0);

		if (!currentTab) return;
		const domain = new URL(currentTab.url!).hostname.replace("www", "");

		const currentContainer =
			tab?.cookieStoreId === "firefox-default"
				? { cookieStoreId: "firefox-default" }
				: await Browser.contextualIdentities.get(currentTab.cookieStoreId!);

		const sourceContainer =
			sourceContainerStoreId === "firefox-default"
				? { cookieStoreId: "firefox-default" }
				: (await Browser.contextualIdentities.get(sourceContainerStoreId))!;

		console.info({
			sourceContainerStoreId,
			menuItemId,
			domain,
		});

		try {
			const cookies = await Browser.cookies.getAll({
				domain: domain.startsWith(".") ? domain : `.${domain}`,
				storeId: sourceContainerStoreId,
			});

			console.info({ cookies });

			for (let cookie of cookies) {
				console.info({ cookie });
				const { domain } = cookie;
				const strippedDomain = domain.startsWith(".")
					? domain.substring(1)
					: domain;
				console.info({ strippedDomain });
				await syncCookie(
					false,
					{ ...cookie, strippedDomain },
					currentContainer.cookieStoreId
				);
			}

			Browser.runtime.onMessage.addListener(onMessage);
			const strippedDomain = domain.startsWith(".")
				? domain.substring(1)
				: domain;
			const tab = await Browser.tabs.create({
				url: `https://${strippedDomain}`,
				active: false,
				cookieStoreId: sourceContainer?.cookieStoreId,
			});
			console.info({
				url: `https://${strippedDomain}`,
				tab,
				sourceContainer,
				csi: sourceContainer?.cookieStoreId,
			});

			await Browser.tabs.hide(tab.id!);

			const removalTimer = setTimeout(clearThings, 2000);

			Browser.tabs.onUpdated.addListener(async function (
				tabId,
				changeInfo,
				_tab
			) {
				if (_tab.status == "complete") {
					console.info("tab is completely loaded");
					await Browser.tabs.executeScript(tab.id!, {
						runAt: "document_start",
						code: `
									const localStorageEntries = Object.entries(localStorage);
									browser.runtime.sendMessage({ msg: "localStorageEntries", localStorageEntries, domain: window.location.hostname.replace("www", "")});
							`,
					});
				}
			});

			async function clearThings() {
				Browser.runtime.onMessage.removeListener(onMessage);
				Browser.tabs.remove(tab.id!);
				currentTab && (await Browser.tabs.reload(currentTab.id!));
			}

			async function onMessage(message: any) {
				const { msg } = message;
				console.info({ msg });
				if (msg === "localStorageEntries") {
					clearTimeout(removalTimer);
					const { localStorageEntries, domain: pageDomain } = message;
					console.info({ localStorageEntries, pageDomain, domain });
					if (pageDomain !== domain) return;

					const activeTab = (
						await API.queryTabs({
							active: true,
							currentWindow: true,
						})
					).tabs?.at(0);

					if (activeTab) {
						await Browser.scripting.executeScript({
							target: { tabId: activeTab.id! },
							func: (localStorageEntries: [string, any][]) => {
								console.info({ localStorageEntries });
								localStorageEntries.forEach(([key, value]) => {
									localStorage.setItem(key, value);
								});
							},
							args: [localStorageEntries],
						});
					}

					clearThings();
				}
			}
		} catch (err) {
			console.error(err);
		}
	} else if (menuItemId.toString().startsWith("remove-cookies")) {
		const action = menuItemId.split("_")[1];

		// const domain = new URL(tab?.url!).hostname.replace("www", "");
		const domain = new URL(tab?.url!).hostname;

		switch (action) {
			case "cookies":
				await removeCookies(domain, tab!.cookieStoreId!);
				break;
			case "localStorage":
				await Browser.browsingData.removeLocalStorage({
					hostnames: [domain],
					cookieStoreId: tab!.cookieStoreId!,
				});
				break;
			case "both":
				await Promise.all([
					removeCookies(domain, tab!.cookieStoreId!),
					Browser.browsingData.removeLocalStorage({
						hostnames: [domain],
						cookieStoreId: tab!.cookieStoreId!,
					}),
				]);
				break;
			default:
				break;
		}

		Browser.tabs.reload(tab!.id!);
	}
}
