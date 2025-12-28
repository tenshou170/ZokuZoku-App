import { invoke } from "@tauri-apps/api/core";
import { writable } from "svelte/store";
import { getGamePath } from "./configStore";

const getMetaPathLocal = () => `${getGamePath()}/meta`;


const metaKey = "532b4631e4a7b9473e7cfb"; // JP Default

export interface LyricItem {
    id: string; // mXXXX
    index: string; // XXXX
    path: string; // original asset path
    label: string;
}

export const lyricsLoading = writable(false);

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

let songNamesCache: { [key: string]: string } | null = null;
async function getSongNames(): Promise<{ [key: string]: string }> {
    if (songNamesCache) return songNamesCache;
    try {
        const res = await invoke<{ header: string[], rows: any[][] }>("query_db", {
            dbPath: `${getGamePath()}/master/master.mdb`,
            query: 'SELECT "index", "text" FROM text_data WHERE category = 16',
            key: ""
        });
        songNamesCache = {};
        for (const row of res.rows) {
            songNamesCache[String(row[0])] = String(row[1]);
        }
        return songNamesCache;
    } catch (e) {
        console.error("Failed to load song names:", e);
        return {};
    }
}

export async function loadLyricsList(): Promise<LyricItem[]> {
    lyricsLoading.set(true);
    try {
        const query = "SELECT n FROM a WHERE n LIKE 'live/musicscores/%\\_lyrics' ESCAPE '\\'";
        const paths = await queryDb(query);
        const songNames = await getSongNames();

        return paths.map((path: string) => {
            const match = path.match(/m(\d{4})_lyrics/);
            const index = match ? match[1] : "0000";
            const name = songNames[Number(index)] || `Song ${index}`;
            return {
                id: `m${index}`,
                index,
                path,
                label: name
            };
        });
    } catch (e) {
        console.error("Failed to load lyrics list", e);
        return [];
    } finally {
        lyricsLoading.set(false);
    }
}

export async function openLyrics(index: string, path: string) {
    // Call extract_lyrics_data
    // We need asset path.
    // Query DB for H and N
    // ...
    // Actually `extract_lyrics_data` needs `asset_path` and `asset_name`.
    // We need to resolve hash first.

    try {
        const dbPath = `${getGamePath()}/meta`;
        const res = await invoke<{ header: string[], rows: any[][] }>("query_db", {
            dbPath,
            query: `SELECT h, n FROM a WHERE n = '${path}' LIMIT 1`,
            key: metaKey
        });

        if (!res.rows.length) throw new Error("Lyrics asset not found in DB");

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

        const result = await invoke<{ csv_data: string }>("extract_lyrics_data", { params: extractParams });
        return result.csv_data;

    } catch (e) {
        console.error("Failed to extract lyrics", e);
        throw e;
    }
}
