<script lang="ts">
    import { currentPath, currentTextSlots } from "../stores";
    import type { IPanelAction } from "../types";
    import TextSlot from "../lib/TextSlot.svelte";
    import GenericSlots from "../lib/GenericSlots.svelte";
    import StorySplitView from "./StorySplitView.svelte";
    import { originalPreview } from "./stores";
    import { bridge } from "../bridge";
    import { get } from "svelte/store";

    const preview = originalPreview;
    export const actions: (IPanelAction | null)[] = [
        {
            icon: "run-all",
            tooltip: "Goto block (IPC - in game)",
            onClick: () => {
                const path = get(currentPath);
                if (!isNaN(+path[0])) {
                    bridge.postMessage({
                        type: "callHachimiIpc",
                        command: {
                            type: "StoryGotoBlock",
                            block_id: +path[0] + 1,
                            incremental: true,
                        },
                    });
                }
            },
        },
        {
            icon: "unmute",
            tooltip: "Play voice clip",
            onClick: () => {
                bridge.postMessage({ type: "loadVoice" });
            },
        },

        null,

        {
            icon: "comment",
            tooltip: "Dialogue preview",
            onClick: () =>
                originalPreview.set(
                    get(originalPreview) == "dialogue" ? null : "dialogue",
                ),
        },
        {
            icon: "book",
            tooltip: "Story preview",
            onClick: () =>
                originalPreview.set(
                    get(originalPreview) == "story" ? null : "story",
                ),
        },
    ];
</script>

<StorySplitView preview={$preview}>
    <GenericSlots>
        {#each $currentTextSlots as slot}
            <TextSlot readonly {...slot} />
        {/each}
    </GenericSlots>
</StorySplitView>
