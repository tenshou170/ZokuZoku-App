import { invoke } from "@tauri-apps/api/core";
import { writable } from "svelte/store";
import { getGamePath } from "./configStore";

const metaKey = "532b4631e4a7b9473e7cfb"; // JP Default

export interface RaceStoryItem {
    id: string; // story id?
    label: string;
    path: string;
}

export const raceStoriesLoading = writable(false);

async function queryDb(query: string) {
    const dbPath = `${getGamePath()}/meta`;
    if (!dbPath) return [];

    const res = await invoke<{ header: string[], rows: any[][] }>("query_db", {
        dbPath,
        query,
        key: metaKey
    });
    return res.rows.map(r => r[0]);
}

let storyNamesCache: { [key: string]: string } | null = null;
async function getStoryNames(): Promise<{ [key: string]: string }> {
    if (storyNamesCache) return storyNamesCache;
    try {
        const res = await invoke<{ header: string[], rows: any[][] }>("query_db", {
            dbPath: `${getGamePath()}/master/master.mdb`,
            query: 'SELECT "index", "text" FROM text_data WHERE category = 181',
            key: ""
        });
        storyNamesCache = {};
        for (const row of res.rows) {
            storyNamesCache[String(row[0])] = String(row[1]);
        }
        return storyNamesCache;
    } catch (e) {
        console.error("Failed to load story names:", e);
        return {};
    }
}

export async function loadRaceStoriesList(): Promise<RaceStoryItem[]> {
    raceStoriesLoading.set(true);
    try {
        const query = "SELECT n FROM a WHERE n LIKE 'race/storytimeline/%' ESCAPE '\\'";
        const paths = await queryDb(query);
        const storyNames = await getStoryNames();

        return paths.map((path: string) => {
            const match = path.match(/storytimeline_(\d+)/);
            const id = match ? match[1] : "unknown";
            const name = storyNames[Number(id)] || `Race ${id}`;
            return {
                id,
                path,
                label: name
            };
        });
    } catch (e) {
        console.error("Failed to load race stories list", e);
        return [];
    } finally {
        raceStoriesLoading.set(false);
    }
}

export async function openRaceStory(id: string, path: string) {
    try {
        const dbPath = `${getGamePath()}/meta`;
        const res = await invoke<{ header: string[], rows: any[][] }>("query_db", {
            dbPath,
            query: `SELECT h, n FROM a WHERE n = '${path}' LIMIT 1`,
            key: metaKey
        });

        if (!res.rows.length) throw new Error("Race story asset not found in DB");

        const hash = res.rows[0][0];
        const name = res.rows[0][1];
        const hashPrefix = hash.substring(0, 2);
        const assetPath = `${getGamePath()}/dat/${hashPrefix}/${hash}`;

        const extractParams = {
            "asset_path": assetPath,
            "asset_name": name,
            "use_decryption": true,
            "meta_path": dbPath,
            "bundle_hash": hash,
            "meta_key": metaKey
        };

        const result = await invoke<{ json_data: any }>("extract_race_story_data", { params: extractParams });
        return result.json_data;

    } catch (e) {
        console.error("Failed to extract race story", e);
        throw e;
    }
}
