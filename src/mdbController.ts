import { invoke } from "@tauri-apps/api/core";
import { writable } from "svelte/store";

import { getGamePath } from "./configStore";

// Configuration (Should match controller.ts or be centralized)
const getMasterPath = () => `${getGamePath()}/master/master.mdb`;

export const MDB_TABLE_NAMES = ["text_data", "character_system_text", "race_jikkyo_comment", "race_jikkyo_message"] as const;
export type MdbTableName = (typeof MDB_TABLE_NAMES)[number];

export const MDB_TABLE_COLUMNS: { [K in MdbTableName]: string[] } = {
    "text_data": ["category", "index", "text"],
    "character_system_text": ["character_id", "voice_id", "text"],
    "race_jikkyo_comment": ["id", "message"],
    "race_jikkyo_message": ["id", "message"]
};

export const mdbLoading = writable(false);

// Types from sharedTypes (simplified)
export interface ITreeNode {
    type: "category" | "entry";
    id: string;
    name: string;
    children?: ITreeNode[];
    content?: any[];
    next?: string | number;
    prev?: string | number;
}

import mdbTextDataCategories from "./mdbTextDataCategories";

const TEXT_DATA_CHARACTER_CATEGORIES = new Set([7, 8, 9, 144, 157, 158, 162, 163, 164, 165, 166, 167, 168, 169]);

let characterNamesCache: { [key: string]: string } | null = null;
async function getCharacterNames(): Promise<{ [key: string]: string }> {
    if (characterNamesCache) return characterNamesCache;
    try {
        const res = await invoke<{ header: string[], rows: any[][] }>("query_db", {
            dbPath: getMasterPath(),
            query: 'SELECT "index", "text" FROM text_data WHERE category = 6',
            key: ""
        });
        characterNamesCache = {};
        for (const row of res.rows) {
            characterNamesCache[String(row[0])] = String(row[1]);
        }
        return characterNamesCache;
    } catch (e) {
        console.error("Failed to load character names:", e);
        return {};
    }
}

export async function loadMdbTable(tableName: MdbTableName) {
    mdbLoading.set(true);
    try {
        const columns = MDB_TABLE_COLUMNS[tableName];
        const columnNames = columns.map(s => `"${s}"`).join(",");
        const orderByNames = columns.slice(0, -1).map(s => `"${s}"`).join(",");

        const query = `SELECT ${columnNames} FROM ${tableName} ORDER BY ${orderByNames}`;
        console.log(`[MdbController] Querying ${tableName}: ${query}`);

        const res = await invoke<{ header: string[], rows: any[][] }>("query_db", {
            dbPath: getMasterPath(),
            query,
            key: ""
        });

        const rows = res.rows;
        console.log(`[MdbController] Loaded ${rows.length} rows.`);

        const nodes: ITreeNode[] = [];
        let categoryMap: { [key: string]: ITreeNode[] } = {};

        const characterNames = await getCharacterNames();

        if (tableName === "text_data") {
            for (const row of rows) {
                const categoryId = String(row[0]);
                const id = String(row[1]);
                const text = String(row[2]);

                let categoryChildren = categoryMap[categoryId];
                let prev: string | undefined;

                if (!categoryChildren) {
                    categoryChildren = [];
                    nodes.push({
                        type: "category",
                        id: categoryId,
                        name: mdbTextDataCategories[categoryId] ? `${categoryId} ${mdbTextDataCategories[categoryId]}` : categoryId,
                        children: categoryChildren
                    });
                    // @ts-ignore
                    categoryMap[categoryId] = categoryChildren;
                } else {
                    const prevNode = categoryChildren[categoryChildren.length - 1];
                    prevNode.next = id;
                    prev = prevNode.id;
                }

                let entryName = text;
                if (TEXT_DATA_CHARACTER_CATEGORIES.has(Number(categoryId))) {
                    entryName = `${id} ${characterNames[id] || ""}`;
                }

                categoryChildren.push({
                    type: "entry",
                    id,
                    name: entryName,
                    content: [{ content: text, multiline: true }],
                    prev
                });
            }
        } else if (tableName === "character_system_text") {
            for (const row of rows) {
                const charId = String(row[0]);
                const voiceId = String(row[1]);
                const text = String(row[2]);

                let charChildren = categoryMap[charId];
                let prev: string | undefined;

                if (!charChildren) {
                    charChildren = [];
                    const charName = characterNames[charId] || charId;
                    nodes.push({
                        type: "category",
                        id: charId,
                        name: charName,
                        children: charChildren
                    });
                    // @ts-ignore
                    categoryMap[charId] = charChildren;
                } else {
                    const prevNode = charChildren[charChildren.length - 1];
                    prevNode.next = voiceId;
                    prev = String(prevNode.id);
                }

                charChildren.push({
                    type: "entry",
                    id: voiceId,
                    name: text,
                    content: [{ content: text, multiline: true }],
                    prev
                });
            }
        } else {
            let prevNode: ITreeNode | undefined;
            for (const row of rows) {
                const id = String(row[0]);
                const text = String(row[1]);

                if (prevNode) {
                    prevNode.next = id;
                }

                const node: ITreeNode = {
                    type: "entry",
                    id,
                    name: text,
                    content: [{ content: text, multiline: true }],
                    prev: prevNode?.id
                };
                nodes.push(node);
                prevNode = node;
            }
        }

        return nodes;
    } catch (e) {
        console.error("Failed to load MDB table:", e);
        throw e;
    } finally {
        mdbLoading.set(false);
    }
}
