import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Edge, Node } from "reactflow";

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  actions: {
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
    addNode: (node: Node) => void;
    removeNode: (id: string) => void;
    updateNode: (id: string, updates: Partial<Node>) => void;
    addEdge: (edge: Edge) => void;
    removeEdge: (id: string) => void;
    updateEdge: (id: string, updates: Partial<Edge>) => void;
    clearWorkflow: () => void;
  };
}

const useWorkflowStore = create<WorkflowState>()(
  devtools(
    (set) => ({
      nodes: [],
      edges: [],
      actions: {
        setNodes: (nodes) =>
          set({
            nodes,
          }),
        setEdges: (edges) =>
          set({
            edges,
          }),
        addNode: (node) =>
          set((state) => ({
            nodes: [...state.nodes, node],
          })),
        removeNode: (id) =>
          set((state) => ({
            nodes: state.nodes.filter((node) => node.id !== id),
            edges: state.edges.filter(
              (edge) => edge.source !== id && edge.target !== id
            ),
          })),
        updateNode: (id, updates) =>
          set((state) => ({
            nodes: state.nodes.map((node) =>
              node.id === id ? { ...node, ...updates } : node
            ),
          })),
        addEdge: (edge) =>
          set((state) => ({
            edges: [...state.edges, edge],
          })),
        removeEdge: (id) =>
          set((state) => ({
            edges: state.edges.filter((edge) => edge.id !== id),
          })),
        updateEdge: (id, updates) =>
          set((state) => ({
            edges: state.edges.map((edge) =>
              edge.id === id ? { ...edge, ...updates } : edge
            ),
          })),
        clearWorkflow: () =>
          set({
            nodes: [],
            edges: [],
          }),
      },
    }),
    {
      name: "workflow-store",
    }
  )
);

export default useWorkflowStore; 