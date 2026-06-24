/**
 * Processes hierarchical relationships from a list of parent-child edge strings.
 * 
 * Rules applied:
 * 1. Valid Format: X->Y (single uppercase letters, trimmed). Self-loops are invalid.
 * 2. Duplicate Edges: Subsequent occurrences of identical X->Y are marked as duplicates.
 * 3. Diamond Case: First parent wins. Subsequent parents for a child are silently discarded.
 * 4. Components: Nodes grouped into connected components using undirected edge relationships.
 * 5. Cycle Detection: Component is cyclic if the number of active edges equals the number of nodes.
 * 6. Tree Depth: Calculated as the number of nodes on the longest path from the root.
 * 
 * @param {string[]} data - Array of node relationship strings (e.g. ["A->B", "hello"])
 * @returns {object} Response containing hierarchies, invalid entries, duplicates, and summary
 */
function processHierarchy(data) {
  const invalid_entries = [];
  const duplicate_edges = [];
  const validEdges = [];
  const seenValidEdges = new Set();

  if (!data || !Array.isArray(data)) {
    return {
      hierarchies: [],
      invalid_entries: [],
      duplicate_edges: [],
      summary: { total_trees: 0, total_cycles: 0, largest_tree_root: "" }
    };
  }

  // 1. Parse and Validate Edges
  for (const entry of data) {
    if (typeof entry !== 'string') {
      invalid_entries.push(String(entry));
      continue;
    }
    const trimmed = entry.trim();

    // Regex check: single uppercase letter (A-Z) -> single uppercase letter (A-Z)
    const match = trimmed.match(/^([A-Z])->([A-Z])$/);
    if (!match) {
      invalid_entries.push(trimmed);
      continue;
    }

    const u = match[1];
    const v = match[2];

    // Self-loop check
    if (u === v) {
      invalid_entries.push(trimmed);
      continue;
    }

    const edgeStr = `${u}->${v}`;
    if (seenValidEdges.has(edgeStr)) {
      // Push subsequent occurrences once
      if (!duplicate_edges.includes(edgeStr)) {
        duplicate_edges.push(edgeStr);
      }
    } else {
      seenValidEdges.add(edgeStr);
      validEdges.push({ u, v, edgeStr });
    }
  }

  // 2. Parent Conflict Resolution (First Parent Wins)
  const activeEdges = [];
  const parentOf = new Map(); // child -> parent
  const adj = new Map(); // parent -> list of children
  const allNodes = new Set();

  for (const edge of validEdges) {
    const { u, v } = edge;

    if (parentOf.has(v)) {
      // Silently discard subsequent parent edges for this child
      continue;
    }

    parentOf.set(v, u);
    activeEdges.push(edge);
    allNodes.add(u);
    allNodes.add(v);
  }

  // Populate children adjacency list for trees
  for (const edge of activeEdges) {
    const { u, v } = edge;
    if (!adj.has(u)) {
      adj.set(u, []);
    }
    adj.get(u).push(v);
  }

  // 3. Find Connected Components (undirected)
  const undirAdj = new Map();
  for (const node of allNodes) {
    undirAdj.set(node, new Set());
  }
  for (const edge of activeEdges) {
    const { u, v } = edge;
    undirAdj.get(u).add(v);
    undirAdj.get(v).add(u);
  }

  const visited = new Set();
  const components = [];

  // Group nodes into components based on their discovery order in the active edges
  for (const edge of activeEdges) {
    const startNode = edge.u;
    if (!visited.has(startNode)) {
      const compNodes = [];
      const queue = [startNode];
      visited.add(startNode);

      while (queue.length > 0) {
        const curr = queue.shift();
        compNodes.push(curr);

        for (const neighbor of undirAdj.get(curr)) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
      components.push(compNodes);
    }
  }

  // 4. Classify Trees vs Cycles and Calculate Properties
  const hierarchies = [];
  let total_trees = 0;
  let total_cycles = 0;
  let largestTreeRoot = "";
  let largestTreeDepth = 0;

  for (const compNodes of components) {
    // Find active edges inside this component
    const compEdges = activeEdges.filter(e => compNodes.includes(e.u));
    const V = compNodes.length;
    const E = compEdges.length;

    // Component is cyclic if E === V (since max in-degree <= 1, E cannot be > V)
    const isCycle = (E === V);
    let rootNode = "";

    if (isCycle) {
      // Root of cycle is lexicographically smallest node
      compNodes.sort();
      rootNode = compNodes[0];

      hierarchies.push({
        root: rootNode,
        tree: {},
        has_cycle: true
      });
      total_cycles++;
    } else {
      // Find the unique root node (in-degree is 0)
      const roots = compNodes.filter(node => !parentOf.has(node));
      rootNode = roots[0] || compNodes[0]; // Math guarantees roots.length === 1

      // Recursive tree builder
      const buildTree = (node) => {
        const nodeObj = {};
        const children = adj.get(node) || [];
        // Sort children alphabetically
        const sortedChildren = [...children].sort();
        for (const child of sortedChildren) {
          nodeObj[child] = buildTree(child);
        }
        return nodeObj;
      };

      const treeObj = {
        [rootNode]: buildTree(rootNode)
      };

      // Recursive depth calculator
      const getDepth = (node) => {
        const children = adj.get(node) || [];
        if (children.length === 0) return 1;
        let maxSubDepth = 0;
        for (const child of children) {
          maxSubDepth = Math.max(maxSubDepth, getDepth(child));
        }
        return 1 + maxSubDepth;
      };

      const depth = getDepth(rootNode);

      hierarchies.push({
        root: rootNode,
        tree: treeObj,
        depth: depth
      });
      total_trees++;

      // Track the largest tree root (break tie breaker lexicographically)
      if (depth > largestTreeDepth) {
        largestTreeDepth = depth;
        largestTreeRoot = rootNode;
      } else if (depth === largestTreeDepth) {
        if (!largestTreeRoot || rootNode < largestTreeRoot) {
          largestTreeRoot = rootNode;
        }
      }
    }
  }

  return {
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees,
      total_cycles,
      largest_tree_root: largestTreeRoot
    }
  };
}

module.exports = {
  processHierarchy
};
