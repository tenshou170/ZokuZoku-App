<script lang="ts">
    import { onMount } from "svelte";
    import type { LyricItem } from "../lyricsController";
    import * as lyricsController from "../lyricsController";

    let item: LyricItem;
    let content: string = "";
    let loading = false;
    let error = "";

    function onMessage(e: MessageEvent) {
        if (e.data.type === "open-lyrics" && e.data.item) {
            item = e.data.item;
            load(item);
        }
    }

    async function load(item: LyricItem) {
        loading = true;
        error = "";
        content = "";
        try {
            content = await lyricsController.openLyrics(item.index, item.path);
        } catch (e) {
            error = String(e);
        } finally {
            loading = false;
        }
    }
</script>

<svelte:window on:message={onMessage} />

<div class="container">
    {#if !item}
        <div class="placeholder">
            Select a song from the sidebar to view lyrics.
        </div>
    {:else}
        <div class="header">
            <h2>{item.label} <span class="id">({item.id})</span></h2>
        </div>
        {#if loading}
            <div class="loading">Loading...</div>
        {:else if error}
            <div class="error">Error: {error}</div>
        {:else}
            <div class="content">
                <pre>{content}</pre>
            </div>
        {/if}
    {/if}
</div>

<style>
    .container {
        height: 100%;
        display: flex;
        flex-direction: column;
        color: var(--vscode-editor-foreground);
        background-color: var(--vscode-editor-background);
        padding: 20px;
        box-sizing: border-box;
        overflow: hidden;
    }
    .placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--vscode-descriptionForeground);
    }
    .header {
        margin-bottom: 20px;
        border-bottom: 1px solid var(--vscode-editorGroup-border);
        padding-bottom: 10px;
    }
    h2 {
        margin: 0;
        font-size: 1.5em;
    }
    .id {
        font-size: 0.8em;
        color: var(--vscode-descriptionForeground);
        font-weight: normal;
    }
    .content {
        flex: 1;
        overflow: auto;
        background-color: var(
            --vscode-editor-inactiveSelectionBackground
        ); /* Slight background */
        padding: 10px;
        border-radius: 4px;
    }
    pre {
        margin: 0;
        font-family: var(--vscode-editor-font-family);
        font-size: var(--vscode-editor-font-size);
        white-space: pre-wrap;
    }
    .error {
        color: var(--vscode-errorForeground);
    }
</style>
