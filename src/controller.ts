import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { writable } from "svelte/store";

// Global Stores
export const isLoading = writable(false);

import { getGamePath } from "./configStore";

// Configuration
// Dynamic paths fetched from store on demand
const getMetaPath = () => `${getGamePath()}/meta`;
const metaKey = "532b4631e4a7b9473e7cfb"; // JP Default

let activeStoryId: string | null = null;
let activeStoryData: any = null; // To access cueIds if needed? Actually we might calculate cue IDs or just load whole AWB.

// Helper to query DB (reused)
async function queryDb(query: string) {
    const res = await invoke<{ header: string[], rows: any[][] }>("query_db", {
        dbPath: getMetaPath(),
        query,
        key: metaKey
    });
    return res.rows.map(r => r[0]);
}

export function setupController() {
    window.addEventListener("bridge-message", (event: any) => {
        const msg = event.detail;
        if (msg.type === "loadVoice") {
            handleLoadVoice();
        }
    });
}

export async function openStory(storyId: string) {
    if (!storyId) return;
    isLoading.set(true);
    activeStoryId = storyId; // Track ID
    try {
        console.log(`[Controller] Opening story ${storyId}`);

        // Resolve Asset Path and Hash
        const res = await invoke<{ header: string[], rows: any[][] }>("query_db", {
            dbPath: getMetaPath(),
            query: `SELECT h, n FROM a WHERE n LIKE '%storytimeline_${storyId}' ESCAPE '\\' LIMIT 1`,
            key: metaKey
        });

        if (res.rows.length === 0) {
            throw new Error("Story manifest not found in meta DB.");
        }

        const bundleHash = res.rows[0][0]; // h
        const assetName = res.rows[0][1];  // n
        const hashPrefix = bundleHash.substring(0, 2);
        const assetPath = `${getGamePath()}/dat/${hashPrefix}/${bundleHash}`;

        // 3. Call Extract
        const extractParams = {
            "asset_path": assetPath,
            "asset_name": assetName,
            "use_decryption": true,
            "meta_path": getMetaPath(),
            "bundle_hash": bundleHash,
            "meta_key": metaKey
        };

        const storyData: any = await invoke("extract_story_data", { params: extractParams });
        console.log("[Controller] Extracted data:", storyData);
        activeStoryData = storyData;

        // 4. Update Store & Set Config
        const STORY_VIEW_CATEGORIES = new Set<string>(["02", "04", "09"]);
        const categoryId = storyId.slice(0, 2);
        const isStoryView = STORY_VIEW_CATEGORIES.has(categoryId);

        // Send config to editor
        import("./bridge").then(({ bridge }) => {
            bridge.postMessage({
                type: "setConfig",
                config: {
                    noWrap: false,
                    isStoryView,
                }
            } as any);
        });

        // @ts-ignore
        import("./storyDataStore").then(({ currentStory }) => {
            currentStory.set(storyData as any);
        });

    } catch (e) {
        console.error("Failed to open story:", e);
        alert(`Error opening story: ${e}`);
    } finally {
        isLoading.set(false);
    }
}

async function handleLoadVoice() {
    if (!activeStoryId) return;
    console.log("[Controller] Loading voice for", activeStoryId);

    // Voice ID = CC GGGG
    const ccgggg = activeStoryId.slice(0, 6);
    const voiceAssetName = `sound/c/snd_voi_story_${ccgggg}.awb`;

    try {
        // Query Hash
        const res = await invoke<{ header: string[], rows: any[][] }>("query_db", {
            dbPath: getMetaPath(),
            query: `SELECT h FROM a WHERE n = '${voiceAssetName}' LIMIT 1`,
            key: metaKey
        });

        if (res.rows.length === 0) {
            console.warn("[Controller] No voice asset found for", voiceAssetName);
            return;
        }

        const hash = res.rows[0][0];
        const hashPrefix = hash.substring(0, 2);
        const assetPath = `${getGamePath()}/dat/${hashPrefix}/${hash}`;

        // We need the cue list to extract.
        // `activeStoryData` contains `blockList`.
        // `blockList` item has `.cueId`. 
        // We need to collect all unique `cueId` != -1.

        if (!activeStoryData || !activeStoryData.blockList) {
            console.warn("[Controller] No active story data to determine cues.");
            return;
        }

        const cueIds = new Set<number>();
        for (const block of activeStoryData.blockList) {
            if (block.cueId !== -1) {
                cueIds.add(block.cueId);
            }
        }

        if (cueIds.size === 0) {
            console.log("[Controller] No cues to extract.");
            return;
        }

        console.log(`[Controller] Extracting ${cueIds.size} cues...`);

        // Call Extract
        const extractParams = {
            "awb_path": assetPath,
            "cue_ids": Array.from(cueIds),
            "hca_key": "0" // Assuming default or not needed if wannacri handles it. 
            // ZokuZoku-Edge uses HCA_KEY import.
        };

        const result = await invoke<{ uris: Record<string, string>, error?: string }>("extract_voice", { params: extractParams });

        if (result.error) {
            console.error("[Controller] Voice extraction failed:", result.error);
            return;
        }

        if (result.uris) {
            // Convert paths to Tauri asset URLs
            const finalUris: Record<string, string> = {};
            for (const [cueId, path] of Object.entries(result.uris)) {
                // In v2, convertFileSrc(path)
                finalUris[cueId] = convertFileSrc(path);
            }

            console.log("[Controller] Extracted voices:", Object.keys(finalUris).length);

            // Send back to Editor
            // We use window.postMessage to simulate VSCode
            window.postMessage({
                type: "loadVoice",
                uris: finalUris
            }, "*");
        }

    } catch (e) {
        console.error("Voice load logic failed", e);
    }
}
