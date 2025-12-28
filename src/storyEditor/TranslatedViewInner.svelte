<script lang="ts">
    import { currentPath, currentTextSlots } from "../stores";
    import type { IPanelAction } from "../types";
    import { translatedSlotProps } from "../utils";
    import TextSlot from "../lib/TextSlot.svelte";
    import GenericSlots from "../lib/GenericSlots.svelte";
    import StorySplitView from "./StorySplitView.svelte";
    import { translatedPreview } from "./stores";
    import { get } from "svelte/store";

    const preview = translatedPreview;
    export const actions: IPanelAction[] = [
        {
            icon: "comment",
            tooltip: "Dialogue preview",
            onClick: () =>
                translatedPreview.set(
                    get(translatedPreview) == "dialogue" ? null : "dialogue",
                ),
        },
        {
            icon: "book",
            tooltip: "Story preview",
            onClick: () =>
                translatedPreview.set(
                    get(translatedPreview) == "story" ? null : "story",
                ),
        },
    ];

    const placeholder = "Type your translation here...";
</script>

<StorySplitView preview={$preview} translated>
    <GenericSlots>
        {#key $currentTextSlots}
            {#each $currentTextSlots as slot, index}
                <TextSlot
                    {...translatedSlotProps(slot)}
                    {index}
                    entryPath={$currentPath}
                    {placeholder}
                />
            {/each}
        {/key}
    </GenericSlots>
</StorySplitView>
