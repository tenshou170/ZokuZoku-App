import { writable } from "svelte/store";

interface AppConfig {
    gamePath: string;
    translationPath: string;
}

const DEFAULT_CONFIG: AppConfig = {
    gamePath: "",
    translationPath: ""
};

// Load from localStorage
const storedConfig = localStorage.getItem("appConfig");
const initialConfig: AppConfig = storedConfig ? JSON.parse(storedConfig) : DEFAULT_CONFIG;

export const appConfig = writable<AppConfig>(initialConfig);

// Subscribe and save to localStorage
appConfig.subscribe((config) => {
    localStorage.setItem("appConfig", JSON.stringify(config));
});

export const getGamePath = () => {
    let path = "";
    appConfig.subscribe(c => path = c.gamePath)();
    return path;
};

export const getTranslationPath = () => {
    let path = "";
    appConfig.subscribe(c => path = c.translationPath)();
    return path;
};
