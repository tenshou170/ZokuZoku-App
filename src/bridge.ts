import { invoke } from "@tauri-apps/api/core";
import type { ControllerMessage, EditorMessage } from "./sharedTypes";
import type { WorkspaceState } from "./stores";



export const bridge = {
    postMessage(message: EditorMessage) {
        console.log("Sending to Tauri:", message);

        window.dispatchEvent(new CustomEvent("bridge-message", { detail: message }));

        // We can ignore the promise result here as postMessage is void
        invoke("handle_frontend_message", { message }).catch(err => {
            console.error("Tauri IPC error:", err);
        });
    },
    getState(): WorkspaceState {
        // Implement local storage persistence if needed, or return empty for now
        return {} as WorkspaceState;
    },
    setState(state: WorkspaceState) {
        // Implement local storage persistence
        console.log("Set state:", state);
    },
    showInputBox(id: string, placeholder: string): Promise<string | undefined> {
        // Fallback to window.prompt for now until we have a custom UI or Tauri dialog
        console.warn("showInputBox is using window.prompt fallback");
        return Promise.resolve(window.prompt(placeholder) || undefined);
    }
};

// Listen for backend messages and dispatch them to window to mimic VSCode webview messaging
import { listen } from "@tauri-apps/api/event";

// Setup global listener once
listen<ControllerMessage>('params_to_frontend', (event) => {
    // Dispatch as a window 'message' event so existing Svelte code picks it up
    window.dispatchEvent(new MessageEvent('message', { data: event.payload }));
});
