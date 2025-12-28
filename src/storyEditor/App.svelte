<script lang="ts">
    import Workspace from "../lib/Workspace.svelte";
    import type { StoryEditorControllerMessage } from "../sharedTypes";
    import {
        config,
        originalPreview,
        translatedPreview,
        voiceMap,
    } from "./stores";
    import { get } from "svelte/store";
    import WorkspaceInner from "./WorkspaceInner.svelte";

    function onMessage(e: MessageEvent<StoryEditorControllerMessage>) {
        const message = e.data;
        switch (message.type) {
            case "setConfig":
                config.set(message.config);
                const defaultPreview = message.config.isStoryView
                    ? "story"
                    : "dialogue";
                if (get(originalPreview) === undefined) {
                    originalPreview.set(defaultPreview);
                }
                if (get(translatedPreview) === undefined) {
                    translatedPreview.set(defaultPreview);
                }
                break;
            case "loadVoice":
                // @ts-ignore
                if (message.uris) {
                    // @ts-ignore
                    voiceMap.update((m) => ({ ...m, ...message.uris }));
                }
                break;
        }
    }
</script>

<svelte:window on:message={onMessage} />

<Workspace inner={WorkspaceInner} />
