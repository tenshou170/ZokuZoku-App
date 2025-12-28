<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { openRaceStory } from "../raceStoryController";
    import { fade } from "svelte/transition";

    let raceStoryData: any = null;
    let loading = false;
    let error = "";
    let lyrics: string[] = []; // Maybe race story has lyrics too? Or just script?
    // Usually Race Story has a script/text area.

    function handleMessage(event: MessageEvent) {
        const message = event.data;
        if (message.type === "open-race-story") {
            loadRaceStory(message.item);
        }
    }

    async function loadRaceStory(item: any) {
        loading = true;
        error = "";
        raceStoryData = null;
        try {
            raceStoryData = await openRaceStory(item.id, item.path);
            console.log("Loaded race story data:", raceStoryData);
        } catch (e) {
            console.error(e);
            error = `Failed to load race story: ${e}`;
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        window.addEventListener("message", handleMessage);
    });

    onDestroy(() => {
        window.removeEventListener("message", handleMessage);
    });
</script>

<div class="race-story-editor">
    {#if loading}
        <div class="status">Loading race story...</div>
    {:else if error}
        <div class="status error">{error}</div>
    {:else if raceStoryData}
        <div class="content" in:fade>
            <h2>Race Story: {raceStoryData.id || "Unknown"}</h2>
            <div class="json-view">
                <pre>{JSON.stringify(raceStoryData, null, 2)}</pre>
            </div>
        </div>
    {:else}
        <div class="status">Select a race story from the sidebar to view.</div>
    {/if}
</div>

<style>
    .race-story-editor {
        padding: 20px;
        height: 100%;
        overflow-y: auto;
        background-color: var(--vscode-editor-background);
        color: var(--vscode-editor-foreground);
    }
    .status {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        font-size: 1.2rem;
        color: #888;
    }
    .error {
        color: var(--vscode-errorForeground);
    }
    .json-view {
        background: rgba(0, 0, 0, 0.1);
        padding: 10px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
        white-space: pre-wrap;
    }
    h2 {
        margin-top: 0;
        border-bottom: 1px solid var(--vscode-editorGroup-border);
        padding-bottom: 10px;
    }
</style>
