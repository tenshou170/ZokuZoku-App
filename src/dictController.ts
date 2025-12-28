import { invoke } from "@tauri-apps/api/core";
import { writable } from "svelte/store";
import type { ITreeNode } from "./mdbController"; // Reuse type

export const dictLoading = writable(false);

import { getTranslationPath } from "./configStore";
// Configuration (Mock)
// Should come from a central config store or Sidebar
// const gamePath = ...; 

const getDictPath = () => `${getTranslationPath()}/localize_dump.json`;

export async function loadLocalizeDict() {
    dictLoading.set(true);
    try {
        const path = getDictPath();
        console.log(`[DictController] Loading dict from ${path}`);
        const content = await invoke<string>("read_text_file", { path });

        let dict: { [key: string]: string };
        try {
            dict = JSON.parse(content);
        } catch (e) {
            throw new Error("Failed to parse localize dict JSON: " + e);
        }

        const nodes: ITreeNode[] = [];
        const categoryMap: { [key: string]: ITreeNode[] } = {};

        for (const key in dict) {
            if (!dict.hasOwnProperty(key)) continue;
            const value = dict[key];

            // Category key: extract non-digit prefix?
            // "021001" -> "021001" (if all digits?)
            // Extension logic:
            // for (const c of key) { if (c >= '0' && c <= '9') break; categoryName += c; }
            // Wait, logic says: break if digit. So "foo123" -> "foo".
            // If "123", category is empty?

            let categoryName = "";
            for (const c of key) {
                if (c >= '0' && c <= '9') { break; }
                categoryName += c;
            }
            if (!categoryName) categoryName = "Misc"; // Fallback

            let categoryChildren = categoryMap[categoryName];
            let prev: string | undefined;

            if (!categoryChildren) {
                categoryChildren = [];
                nodes.push({
                    type: "category",
                    id: categoryName,
                    name: categoryName,
                    children: categoryChildren
                });
                // @ts-ignore
                categoryMap[categoryName] = categoryChildren;
            } else {
                const prevNode = categoryChildren[categoryChildren.length - 1];
                prevNode.next = key;
                prev = prevNode.id;
            }

            categoryChildren.push({
                type: "entry",
                id: key,
                name: key,
                content: [{
                    content: value,
                    multiline: true
                }],
                prev
            });
        }

        return nodes;
    } catch (e) {
        console.error("Failed to load localize dict:", e);
        throw e;
    } finally {
        dictLoading.set(false);
    }
}
