<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import StoryEditorApp from "../storyEditor/App.svelte";
    import CommonEditorApp from "../commonEditor/App.svelte";
    import Sidebar from "../components/Sidebar.svelte";
    import LyricsEditorApp from "../lyricsEditor/App.svelte";
    import RaceStoryEditorApp from "../raceStoryEditor/App.svelte";
    import { openStory, isLoading, setupController } from "../controller";
    import { loadMdbTable } from "../mdbController";
    import { loadLocalizeDict } from "../dictController";
    import { currentStory } from "../storyDataStore";
    import { userData } from "../stores";
    import { appConfig } from "../configStore";
    import { get } from "svelte/store";
    import { invoke } from "@tauri-apps/api/core";
    import "../app.css";

    let viewMode: "story" | "mdb" | "dict" | "lyrics" | "race-story" = "story";

    function handleOpenStory(event: CustomEvent<{ id: string }>) {
        viewMode = "story";
        openStory(event.detail.id);
    }

    function handleOpenLyrics(event: CustomEvent<{ item: any }>) {
        viewMode = "lyrics";
        // Pass message to Lyrics Editor
        // We need to wait for component to mount?
        // Or just post message and hope the window listener catches it?
        // Svelte component might not be mounted yet if we switch viewMode.
        // But `postMessage` is global.
        // Wait, if we switch `viewMode`, the `LyricsEditorApp` mounts.
        // On mount, it won't receive the *previous* message unless we store it or resend.

        // Better: Dispatch immediately after tick?
        setTimeout(() => {
            window.postMessage(
                {
                    type: "open-lyrics",
                    item: event.detail.item,
                },
                "*",
            );
        }, 50);
    }

    function handleOpenRaceStory(event: CustomEvent<{ item: any }>) {
        viewMode = "race-story";
        setTimeout(() => {
            window.postMessage(
                {
                    type: "open-race-story",
                    item: event.detail.item,
                },
                "*",
            );
        }, 50);
    }

    async function handleOpenMdb(event: CustomEvent<{ tableName: string }>) {
        viewMode = "mdb";
        currentStory.set(null); // Clear story data
        const tableName = event.detail.tableName;

        try {
            const nodes = await loadMdbTable(tableName as any);

            // Dispatch message for Explorer (CommonEditor)
            window.postMessage(
                {
                    type: "setNodes",
                    nodes: nodes,
                },
                "*",
            );

            window.postMessage(
                {
                    type: "setExplorerTitle",
                    title: tableName,
                },
                "*",
            );
        } catch (e) {
            console.error(e);
            alert(`Failed to load MDB: ${e}`);
        }
    }

    async function loadCategories() {
        try {
            const categories = await invoke("load_categories");
            userData.set({
                id: "root",
                type: "category",
                name: "Categories",
                children: categories,
                expanded: true,
            });
        } catch (e) {
            console.error("Failed to load categories:", e);
        }
    }

    async function loadLyrics() {
        try {
            const lyrics = await invoke("load_lyrics");
            window.postMessage(
                {
                    type: "setLyrics",
                    lyrics: lyrics,
                },
                "*",
            );
        } catch (e) {
            console.error("Failed to load lyrics:", e);
        }
    }

    async function loadRaceStories() {
        try {
            const raceStories = await invoke("load_race_stories");
            window.postMessage(
                {
                    type: "setRaceStories",
                    raceStories: raceStories,
                },
                "*",
            );
        } catch (e) {
            console.error("Failed to load race stories:", e);
        }
    }

    async function handleOpenDict() {
        viewMode = "dict";
        currentStory.set(null);
        try {
            const nodes = await loadLocalizeDict();
            // @ts-ignore
            userData.set({
                id: "root",
                type: "category",
                name: "Localize Dict",
                children: nodes,
                expanded: true,
            });
        } catch (e) {
            console.error(e);
            alert(`Failed to load dictionary: ${e}`);
        }
    }

    onMount(() => {
        setupController();
        // Initialize Editor Config
        window.postMessage(
            {
                type: "setConfig",
                config: {
                    localize_dict: "",
                    isStoryView: true,
                    use_text_wrapper: false,
                },
            },
            "*",
        );

        // Custom Event Listeners
        window.addEventListener("open-story", handleOpenStory as any);
        window.addEventListener("open-mdb", handleOpenMdb as any);
        window.addEventListener("open-dict", handleOpenDict as any);
        window.addEventListener("open-lyrics", handleOpenLyrics as any);
        window.addEventListener("open-race-story", handleOpenRaceStory as any);
    });

    onDestroy(() => {
        window.removeEventListener("open-story", handleOpenStory as any);
        window.removeEventListener("open-mdb", handleOpenMdb as any);
        window.removeEventListener("open-dict", handleOpenDict as any);
        window.removeEventListener("open-lyrics", handleOpenLyrics as any);
        window.removeEventListener(
            "open-race-story",
            handleOpenRaceStory as any,
        );
    });
</script>

<div class="app-container">
    <Sidebar />
    <div class="editor-container">
        {#if $isLoading}
            <div class="loading-overlay">Loading...</div>
        {/if}
        {#if viewMode === "story"}
            <StoryEditorApp />
        {:else if viewMode === "lyrics"}
            <LyricsEditorApp />
        {:else if viewMode === "race-story"}
            <RaceStoryEditorApp />
        {:else}
            <CommonEditorApp />
        {/if}
    </div>
</div>

<style>
    .app-container {
        display: flex;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        background-color: var(--vscode-editor-background);
        color: var(--vscode-editor-foreground);
    }
    .editor-container {
        flex: 1;
        overflow: hidden;
        position: relative;
    }
    .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100;
        font-size: 16px;
    }
</style>
