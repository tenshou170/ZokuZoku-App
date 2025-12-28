import { derived, writable } from "svelte/store";
import type { ITextSlot, ITreeNode, TreeNodeId } from "./sharedTypes";
import { bridge } from "./bridge";

/**** Workspace stores ****/

export interface WorkspaceState {
    currentPath: TreeNodeId[];
    explorerScrollTop: number;
    nodeStates: {[key: string]: NodeState};
    selectedNodes: {[key: string]: number}; // value is the content count
    copyingNodes: {[key: string]: number};
    userData: unknown;
}

export interface NodeState {
    open: boolean,
    childrenStart: number
}

const initWsState = bridge.getState();
export const currentPath = writable<TreeNodeId[]>(initWsState?.currentPath ?? []);
export const explorerScrollTop = writable<number>(initWsState?.explorerScrollTop ?? 0);
export const nodeStates = writable<{[key: string]: NodeState}>(initWsState?.nodeStates ?? {});
export const selectedNodes = writable<{[key: string]: number}>(initWsState?.selectedNodes ?? {});
export const copyingNodes = writable<{[key: string]: number}>(initWsState?.copyingNodes ?? {});
export const userData = writable(initWsState?.userData);

const workspaceState = derived(
    [currentPath, explorerScrollTop, nodeStates, selectedNodes, copyingNodes, userData],
    ([currentPath, explorerScrollTop, nodeStates, selectedNodes, copyingNodes, userData]) => ({
        currentPath,
        explorerScrollTop,
        nodeStates,
        selectedNodes,
        copyingNodes,
        userData
    })
);
workspaceState.subscribe(state => bridge.setState(state));


/**** Session stores ****/

export const currentTextSlots = writable<ITextSlot[]>([]);
export const currentNav = writable<{
    next?: TreeNodeId,
    prev?: TreeNodeId
}>({});
export const currentSiblings = writable<ITreeNode[]>([]);