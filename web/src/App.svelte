<script>
  import { onMount } from "svelte";
  import Graph from "graphology";
  import Sigma from "sigma";

  let canvas;
  let sigma;
  let graph;
  let generation = 0;
  let activeLevel = "file";
  let zoomValue = 0.5;
  let searchQuery = "";
  let searchResults = [];
  let source = "No source selected.";
  let status = "Loading graph...";
  let truncated = false;
  let maxVisible = 500;
  let focus = "";
  let focusedNode = "";
  let selectedRole = "";
  let healthTimer;
  let loadTimer;

  const ROLE_COLORS = {
    test: "#f472b6",
    leaf: "#a3e635",
    function: "#f59e0b",
    file_module: "#22d3ee",
    structural_region: "#8b5cf6",
  };
  const ROLE_LABELS = {
    test: "test script / test",
    leaf: "leaf node",
    function: "function / method",
    file_module: "file / module",
    structural_region: "structural region",
  };

  const levelLabel = {
    region: "regions",
    file: "files / modules",
    function: "functions",
  };

  function levelForRatio(ratio) {
    if (ratio >= 1.35) return "region";
    if (ratio >= 0.7) return "file";
    return "function";
  }

  function valueForRatio(ratio) {
    return Math.max(0, Math.min(1, (2.2 - ratio) / 1.9));
  }

  function ratioForValue(value) {
    return Math.max(0.3, Math.min(2.2, 2.2 - value * 1.9));
  }

  function colorForRole(role) {
    return ROLE_COLORS[role] || ROLE_COLORS.file_module;
  }

  function scheduleLoad(level, center = focus) {
    clearTimeout(loadTimer);
    loadTimer = setTimeout(() => loadGraph(level, center), 140);
  }

  async function loadGraph(level = activeLevel, center = focus) {
    if (!sigma) return;
    const params = new URLSearchParams({ level, limit: String(maxVisible) });
    if (center) params.set("center", center);
    try {
      const response = await fetch(`/api/subgraph?${params}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "graph request failed");
      const camera = sigma.getCamera().getState();
      activeLevel = payload.level;
      generation = payload.graph_generation;
      truncated = payload.truncated;
      graph.clear();
      const count = payload.nodes.length;
      payload.nodes.forEach((node, index) => {
        const angle = count ? (index / count) * Math.PI * 2 : 0;
        const radius = count > 1 ? 0.18 + (index % 5) * 0.045 : 0;
        const role = node.role || (activeLevel === "region" ? "structural_region" : activeLevel === "file" ? "file_module" : "function");
        graph.addNode(node.id, {
          label: node.label,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          size: activeLevel === "region" ? 10 : activeLevel === "file" ? 7 : 5,
          color: colorForRole(role),
          borderColor: colorForRole(role),
          role,
          roleLabel: ROLE_LABELS[role] || role,
          node_ids: node.node_ids,
          source_paths: node.source_paths,
          member_count: node.member_count,
        });
      });
      if (center) {
        const selected = payload.nodes.find(
          (node) => node.id === center || (node.node_ids || []).includes(center)
        );
        focusedNode = selected ? selected.id : center;
        selectedRole = selected ? selected.role : selectedRole;
      }
      payload.edges.forEach((edge, index) => {
        if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) return;
        graph.addDirectedEdgeWithKey(`edge-${index}-${edge.source}-${edge.target}`, edge.source, edge.target, {
          type: "arrow",
          label: activeLevel === "function" ? `${edge.label}${edge.count > 1 ? ` ×${edge.count}` : ""}` : "",
          size: Math.min(4, 0.7 + Math.log2(edge.count + 1)),
          color: activeLevel === "function" ? "#64748b" : "#334155",
        });
      });
      sigma.refresh();
      sigma.getCamera().setState(camera);
      status = `${levelLabel[activeLevel]} · ${payload.nodes.length} nodes · ${payload.edges.length} calls${truncated ? " · capped" : ""}`;
    } catch (error) {
      status = `Graph error: ${error.message}`;
    }
  }

  async function loadHealth() {
    try {
      const response = await fetch("/api/health");
      const health = await response.json();
      if (!response.ok) throw new Error(health.error || "health request failed");
      if (generation && health.generation !== generation) {
        await loadGraph(activeLevel, focus);
      }
    } catch (error) {
      status = `Reload check failed: ${error.message}`;
    }
  }

  function handleCamera() {
    const ratio = sigma.getCamera().getState().ratio;
    zoomValue = valueForRatio(ratio);
    const nextLevel = levelForRatio(ratio);
    if (nextLevel !== activeLevel) scheduleLoad(nextLevel);
  }

  function setZoom(event) {
    const ratio = ratioForValue(Number(event.currentTarget.value));
    const state = sigma.getCamera().getState();
    sigma.getCamera().setState({ ...state, ratio });
    handleCamera();
  }

  async function inspect(nodeId) {
    focus = nodeId;
    focusedNode = nodeId;
    const attrs = graph.getNodeAttributes(nodeId);
    selectedRole = attrs.role;
    sigma.refresh();
    const path = attrs.source_paths && attrs.source_paths[0];
    if (!path) {
      source = "No source path in Graphify data.";
      return;
    }
    try {
      const response = await fetch(`/api/source?path=${encodeURIComponent(path)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "source request failed");
      source = `${payload.path}${payload.truncated ? " (truncated)" : ""}\n\n${payload.content}`;
    } catch (error) {
      source = `Source error: ${error.message}`;
    }
  }

  async function search() {
    const query = searchQuery.trim();
    if (!query) {
      searchResults = [];
      return;
    }
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=40`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "search request failed");
      searchResults = payload;
      status = `${payload.length} search result${payload.length === 1 ? "" : "s"}`;
    } catch (error) {
      status = `Search error: ${error.message}`;
    }
  }

  async function focusResult(result) {
    focus = result.id;
    focusedNode = result.id;
    selectedRole = result.role || "";
    sigma.refresh();
    loadGraph(activeLevel, focus);
    if (!result.source_path) return;
    try {
      const response = await fetch(`/api/source?path=${encodeURIComponent(result.source_path)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "source request failed");
      source = `${payload.path}${payload.truncated ? " (truncated)" : ""}\n\n${payload.content}`;
    } catch (error) {
      source = `Source error: ${error.message}`;
    }
  }
  onMount(() => {
    graph = new Graph({ type: "directed", multi: true });
    sigma = new Sigma(graph, canvas, {
      renderEdgeLabels: true,
      defaultNodeColor: "#22d3ee",
      defaultEdgeColor: "#334155",
      labelDensity: 0.08,
      labelGridCellSize: 80,
      zIndex: true,
      nodeReducer: (node, attrs) => {
        const selected = node === focusedNode;
        return {
          ...attrs,
          color: attrs.color,
          size: selected ? attrs.size + 3 : attrs.size,
          highlighted: selected,
          borderColor: selected ? "#f8fafc" : attrs.borderColor,
          borderSize: selected ? 3 : 1,
          label: selected ? `[selected] ${attrs.label}` : attrs.label,
          forceLabel: selected,
        };
      },
    });
    sigma.on("clickNode", ({ node }) => inspect(node));
    sigma.getCamera().on("updated", handleCamera);
    loadGraph();
    healthTimer = setInterval(loadHealth, 2000);
    return () => {
      clearInterval(healthTimer);
      clearTimeout(loadTimer);
      sigma.kill();
    };
  });
</script>

<svelte:head>
  <meta name="description" content="Persistent zoom-aware Graphify navigation" />
</svelte:head>

<div class="app-shell">
  <header class="toolbar">
    <div class="brand">
      <span class="eyebrow">GRAPHIFY</span>
      <h1>Code navigation</h1>
    </div>
    <form class="search" on:submit|preventDefault={search}>
      <input bind:value={searchQuery} aria-label="Search graph" placeholder="Search labels or source paths" />
      <button type="submit">Search</button>
    </form>
    <label class="zoom-control">
      <span>Zoom</span>
      <input aria-label="Zoom level" type="range" min="0" max="1" step="0.01" value={zoomValue} on:input={setZoom} />
    </label>
    <div class="status" aria-live="polite">{status}</div>
  </header>

  <main class="workspace">
    <section class="graph-panel" aria-label="Graph canvas">
      <div class="canvas" bind:this={canvas}></div>
      <div class="legend" aria-label="Node role legend">
        <span><i class="test"></i>test script / test</span>
        <span><i class="leaf"></i>leaf node</span>
        <span><i class="function"></i>function / method</span>
        <span><i class="file"></i>file / module</span>
        <span><i class="region"></i>structural region</span>
        <span class="selection-marker"><i></i>[selected] neutral ring</span>
        <span>Wheel to zoom · click a node to inspect</span>
      </div>
    </section>

    <aside class="inspector">
      <section>
        <div class="section-heading"><h2>Search results</h2><span>{searchResults.length}</span></div>
        {#if searchResults.length}
          <div class="results">
            {#each searchResults as result}
              <button class="result" on:click={() => focusResult(result)}>
                <strong>{result.label}</strong>
                <small>{result.source_path || result.region || result.id}</small>
              </button>
            {/each}
          </div>
        {:else}
          <p class="muted">Search the graph to jump to a node.</p>
        {/if}
      </section>
      <section class="source-section">
        <div class="section-heading"><h2>Source inspection</h2>{#if selectedRole}<span class={`role-chip role-${selectedRole}`}>{ROLE_LABELS[selectedRole]}</span>{/if}{#if focus}<span class="mono">{focus}</span>{/if}</div>
        <pre>{source}</pre>
      </section>
    </aside>
  </main>
</div>

<style>
  :global(*) { box-sizing: border-box; }
  :global(body) { margin: 0; background: #08111f; color: #e2e8f0; font: 14px/1.4 Inter, ui-sans-serif, system-ui, sans-serif; }
  :global(button), :global(input) { font: inherit; }
  .app-shell { min-height: 100vh; display: flex; flex-direction: column; }
  .toolbar { min-height: 76px; display: flex; align-items: center; gap: 18px; padding: 12px 18px; background: #0d1728; border-bottom: 1px solid #1e293b; }
  .brand { min-width: 180px; }
  .eyebrow { color: #22d3ee; font-size: 10px; letter-spacing: .18em; }
  h1, h2, p { margin: 0; }
  h1 { font-size: 17px; font-weight: 650; }
  .search { display: flex; flex: 1; max-width: 560px; gap: 8px; }
  input { min-width: 0; border: 1px solid #334155; border-radius: 7px; background: #111c2d; color: #f8fafc; padding: 9px 11px; outline: none; }
  input:focus { border-color: #22d3ee; }
  button { border: 1px solid #334155; border-radius: 7px; background: #162337; color: #dbeafe; padding: 8px 11px; cursor: pointer; }
  button:hover { border-color: #22d3ee; background: #1b334b; }
  .zoom-control { display: flex; align-items: center; gap: 9px; white-space: nowrap; color: #94a3b8; }
  .zoom-control input { width: 110px; padding: 0; accent-color: #22d3ee; }
  .status { min-width: 170px; margin-left: auto; color: #94a3b8; font-size: 12px; text-align: right; }
  .workspace { min-height: 0; flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) 340px; }
  .graph-panel { position: relative; min-height: 620px; background: radial-gradient(circle at 50% 45%, #12253b, #08111f 70%); }
  .canvas { position: absolute; inset: 0; }
  .legend { position: absolute; left: 18px; bottom: 18px; display: flex; gap: 14px; flex-wrap: wrap; padding: 9px 11px; border: 1px solid #1e293b; border-radius: 8px; background: #0d1728df; color: #94a3b8; font-size: 11px; pointer-events: none; }
  .legend span { display: inline-flex; align-items: center; gap: 5px; }
  .legend i { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  .legend .test { background: #f472b6; }
  .legend .leaf { background: #a3e635; }
  .legend .function { background: #f59e0b; }
  .legend .file { background: #22d3ee; }
  .legend .region { background: #8b5cf6; }
  .legend .selection-marker i { width: 9px; height: 9px; border: 2px solid #f8fafc; border-radius: 2px; background: transparent; }
  .inspector { overflow: auto; border-left: 1px solid #1e293b; background: #0b1524; padding: 17px; }
  .inspector section + section { margin-top: 24px; }
  .section-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 9px; }
  h2 { color: #cbd5e1; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
  .section-heading span { color: #64748b; font-size: 11px; }
  .results { display: grid; gap: 6px; }
  .role-chip.role-test { color: #f472b6; }
  .role-chip.role-leaf { color: #a3e635; }
  .role-chip.role-function { color: #f59e0b; }
  .role-chip.role-file_module { color: #22d3ee; }
  .role-chip.role-structural_region { color: #8b5cf6; }
  .result { display: grid; gap: 2px; width: 100%; text-align: left; }
  .result strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .result small, .muted { color: #64748b; }
  .muted { font-size: 12px; }
  .source-section { min-height: 260px; }
  .source-section pre { max-height: calc(100vh - 220px); overflow: auto; margin: 0; padding: 12px; border: 1px solid #1e293b; border-radius: 7px; background: #07101c; color: #cbd5e1; font: 11px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; overflow-wrap: anywhere; }
  .mono { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 10px ui-monospace, monospace; }
  @media (max-width: 900px) {
    .toolbar { flex-wrap: wrap; }
    .search { order: 3; flex-basis: 100%; max-width: none; }
    .status { margin-left: 0; }
    .workspace { grid-template-columns: 1fr; }
    .graph-panel { min-height: 520px; }
    .inspector { max-height: 460px; border-left: 0; border-top: 1px solid #1e293b; }
    .source-section pre { max-height: 280px; }
  }
</style>
