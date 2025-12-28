<script lang="ts">
    import TextSlot from "../lib/TextSlot.svelte";
    import { currentPath, currentTextSlots } from "../stores";
    import { voiceMap } from "./stores";
    import { translatedSlotProps } from "../utils";
    import DialogueTextFrameContent from "./DialogueTextFrameContent.svelte";
    import DialogueTextFrameName from "./DialogueTextFrameName.svelte";
    import { userData } from "../stores";
    import { get } from "svelte/store";

    export let translated: boolean = false;

    // Audio Playback Logic
    let audio: HTMLAudioElement;

    function playVoice() {
        const path = get(currentPath);
        if (!path) return;

        const pathStr = path.join("/");
        const parts = pathStr.split("/");
        let node: any = get(userData);
        if (node.id === parts[0]) {
            for (let i = 1; i < parts.length; i++) {
                if (node.children) {
                    node = node.children.find((c: any) => c.id === parts[i]);
                } else {
                    node = null;
                    break;
                }
                if (!node) break;
            }
        }

        if (node && node.data && node.data.cueId) {
            const cueId = node.data.cueId;
            const uri = get(voiceMap)[cueId];
            if (uri) {
                if (!audio) audio = new Audio();
                audio.src = uri;
                audio.volume = 0.5; // Default volume
                audio
                    .play()
                    .catch((e) => console.error("Audio play failed", e));
            }
        }
    }

    // Trigger on path change (new block selected)
    $: $currentPath, playVoice();
</script>

<div class="text-frame">
    {#if $currentTextSlots.length >= 2}
        {#if translated}
            <TextSlot
                inner={DialogueTextFrameName}
                {...translatedSlotProps($currentTextSlots[0])}
                index={0}
                entryPath={$currentPath}
            />
            <TextSlot
                inner={DialogueTextFrameContent}
                {...translatedSlotProps($currentTextSlots[1])}
                index={1}
                entryPath={$currentPath}
            />
        {:else}
            <TextSlot
                inner={DialogueTextFrameName}
                readonly
                {...$currentTextSlots[0]}
            />
            <TextSlot
                inner={DialogueTextFrameContent}
                readonly
                {...$currentTextSlots[1]}
            />
        {/if}
    {/if}
</div>

<style>
    .text-frame {
        padding: 2.22%;
        margin-top: 2%;
        position: relative;
        aspect-ratio: 43/13;
        container-type: size;
    }
</style>
