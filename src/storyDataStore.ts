import { writable } from "svelte/store";

export interface StoryData {
    title: string;
    blockList: any[]; // Define more specific types if needed
}

export const currentStory = writable<StoryData | null>(null);
