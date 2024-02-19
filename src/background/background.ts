import browser from "webextension-polyfill";
import {
	menusOnClicked,
	menusOnShown,
	runtimeOnInstalled,
	runtimeOnStartup,
	runtimeOnMessage,
	commandsOnCommand,
} from "./browserEvents";
import { cookiesOnChanged } from "./cookies/cookiesOnChanged";

browser.runtime.onInstalled.addListener(runtimeOnInstalled);
browser.runtime.onStartup.addListener(runtimeOnStartup);

browser.menus.onClicked.addListener(menusOnClicked);
browser.menus.onShown.addListener(menusOnShown);

browser.cookies.onChanged.addListener(cookiesOnChanged);

browser.commands.onCommand.addListener(commandsOnCommand);

browser.runtime.onMessage.addListener(runtimeOnMessage);
