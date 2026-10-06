<script lang="ts">
  import type { Givens, Value } from '../../../engine/types';
  import {
    densityNeighborhoods,
    densityPoints,
    graphEdges,
    graphMetrics,
    graphNodes,
    kmeansFrames,
  } from '../../../data/algorithm-visuals';
  import { number as f } from './helpers';
  let {
    slug,
    g,
    values: v,
    step = 0,
    method = 0,
    choice = 0,
    term = '',
  }: {
    slug: string;
    g: Givens;
    values: Record<string, Value>;
    step?: number;
    method?: number;
    choice?: number;
    term?: string;
  } = $props();
  const points = $derived((g.points as number[]) ?? []);
  const frames = $derived(slug === 'k-means' ? kmeansFrames(points, g.centers as number[]) : []);
  const frame = $derived(frames[step === 3 ? frames.length - 1 : 0]);
  const centers = $derived(frame ? (step >= 2 ? frame.next : frame.centers) : []);
  const epsilon = $derived(choice ? 1.2 : 0.8);
  const density = $derived(densityNeighborhoods(epsilon));
  const selected = $derived(method === 7 ? 0 : ([0, 2, 4, 5][choice] ?? 0));
  const visibleEdges = $derived(
    method === 7 && choice === 0 ? graphEdges.filter((_, i) => i !== 2 && i !== 3) : graphEdges,
  );
  const graph = $derived(graphMetrics(selected, visibleEdges));
  const pathValues = $derived((g.paths as number[]) ?? []);
  const anomalyOrder = $derived(
    ((v.scores as number[]) ?? [])
      .map((score, i) => ({ score, index: i }))
      .sort((a, b) => b.score - a.score),
  );
  const selectedPaths = $derived(pathValues.slice(choice * 3, choice * 3 + 3));
  const maxPath = $derived(Math.max(1, ...pathValues));
  const nodeValues = [1, 0, 2, 0, 3, 1, 0];
  const neighborMessage = $derived(
    graph.neighbors[selected].reduce((s, i) => s + nodeValues[i], 0),
  );
</script>

<div class="algorithm-diagram">
  {#if slug === 'k-means'}
    {#if method === 1}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
      <div
        class="diagram-scroll"
        role="region"
        tabindex="0"
        aria-label="DBSCAN neighborhood diagram"
      >
        <svg
          viewBox="0 0 560 310"
          role="img"
          aria-label="Core, border, and noise points under a supplied density rule"
        >
          <text x="25" y="28" class="bold">DBSCAN · ε={epsilon}, min points=3 (including self)</text
          >
          {#each densityPoints as p, i}
            <circle
              cx={65 + p[0] * 65}
              cy={235 - p[1] * 65}
              r={epsilon * 65}
              fill="none"
              stroke="var(--av-c)"
              stroke-opacity={i === 2 ? 0.7 : 0.13}
              stroke-dasharray="4 4"
            />
            <circle
              cx={65 + p[0] * 65}
              cy={235 - p[1] * 65}
              r="8"
              class={density.labels[i] === 'core'
                ? 'a'
                : density.labels[i] === 'border'
                  ? 'b'
                  : 'c'}
            />
            <text x={79 + p[0] * 65} y={240 - p[1] * 65} class="tiny">{i + 1}</text>
          {/each}
          <text x="25" y="295" class="tiny"
            >Synthetic coordinates, separate from the savings-rate exercise</text
          >
        </svg>
      </div>
      <div class="diagram-metrics">
        {#each ['core', 'border', 'noise'] as status}<span
            >{status[0].toUpperCase() + status.slice(1)} points<strong
              >{density.labels
                .map((label, i) => (label === status ? i + 1 : null))
                .filter(Boolean)
                .join(', ') || 'None'}</strong
            ></span
          >{/each}
      </div>
      <p class="diagram-note">
        Green core points have at least three points in their ε-neighborhood including themselves.
        Gold border points touch a core neighborhood but lack enough neighbors themselves. Blue
        noise points satisfy neither condition. Changing ε can join or separate groups.
      </p>
    {:else if method === 2}
      <div class="process-cards">
        <div>
          <strong>Raw units</strong><span
            >Distance combines dollar differences of thousands with savings ratios below one. The
            dollars dominate.</span
          ><span>Δbalance = $1,000; Δsavings ratio = 0.10</span>
        </div>
        <div class="active">
          <strong>Training-set standardization</strong><span
            >Express each difference in its feature’s standard-deviation units.</span
          ><span>With SDs $2,000 and 0.20: differences = 0.5 and 0.5</span>
        </div>
      </div>
      <p class="diagram-note">
        Separate supplied scaling example: raw distance ≈ 1,000; standardized distance = √(0.5² +
        0.5²) ≈ 0.707. Fit scaling on the training/history window only. The main exercise below
        remains one-dimensional savings percentages.
      </p>
    {/if}
    {#if method !== 1}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
      <div
        class="diagram-scroll"
        role="region"
        tabindex="0"
        aria-label="K-means point assignments and center movement"
      >
        <svg
          viewBox="0 0 560 310"
          role="img"
          aria-label="Savings-rate points connect to their nearest centers and centers move to group means"
        >
          <text x="25" y="28" class="bold">Savings rate · percent</text><line
            x1="45"
            x2="515"
            y1="240"
            y2="240"
            class="axis"
          />
          {#each [0, 20, 40, 60, 80, 100] as tick}<text
              x={45 + tick * 4.7}
              y="261"
              text-anchor="middle"
              class="tiny">{tick}%</text
            >{/each}
          {#each points as p, i}
            {@const group = frame?.groups[i] ?? 0}
            {#if step >= 1}<line
                x1={45 + p * 4.7}
                x2={45 + centers[group] * 4.7}
                y1="104"
                y2="190"
                class={group ? 'link-gold' : 'link'}
              />{/if}
            <circle
              cx={45 + p * 4.7}
              cy="104"
              r="9"
              class={group ? 'b' : 'a'}
              class:selected={term === 'points' || term === 'distance'}
            /><text x={45 + p * 4.7} y="83" text-anchor="middle">{f(p)}%</text>
          {/each}
          {#each centers as c, i}
            <rect
              x={45 + c * 4.7 - 10}
              y="180"
              width="20"
              height="20"
              class={i ? 'b' : 'a'}
              class:selected={term === 'centers' || term === 'mean'}
            />
            <text x={45 + c * 4.7} y="224" text-anchor="middle">μ{i + 1}={f(c)}</text>
            {#if step >= 2 && frame.centers[i] !== c}<path
                d={`M${45 + frame.centers[i] * 4.7},164 L${45 + c * 4.7},164`}
                class="link dash"
              /><circle cx={45 + frame.centers[i] * 4.7} cy="164" r="3" class="c" />{/if}
          {/each}
          {#if step === 4}<path
              d={`M${45 + Number(g.newPoint) * 4.7},125 l10,12 l-10,12 l-10,-12 Z`}
              class="c"
            /><text x={45 + Number(g.newPoint) * 4.7} y="163" text-anchor="middle" class="tiny"
              >New: {g.newPoint}%</text
            >{/if}
          <text x="25" y="293" class="tiny"
            >Circles: customers · squares: centers · diamond: new customer</text
          >
        </svg>
      </div>
      <div class="diagram-metrics">
        <span>First updated centers<strong>{f(v.c1)}% and {f(v.c2)}%</strong></span><span
          >First-update inertia<strong>{f(v.inertia)} percentage-points²</strong></span
        ><span
          >New customer distances<strong>{f(v.d1)} and {f(v.d2)} pp → group {v.group}</strong></span
        >
      </div>
      {#if step === 3}<p class="diagram-note">
          Updates through convergence: {frames
            .map(
              (x, i) =>
                `${i + 1}: centers (${x.next.map((n) => f(n)).join(', ')}), inertia ${f(x.inertia)}`,
            )
            .join(' → ')}. The exercise readouts retain the first update so calculations stay
          consistent.
        </p>{/if}
    {/if}
  {:else if slug === 'isolation-forest'}
    {#if method === 1}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
      <div
        class="diagram-scroll"
        role="region"
        tabindex="0"
        aria-label="Illustrative random isolation cuts"
      >
        <svg
          viewBox="0 0 560 320"
          role="img"
          aria-label="A vertical then horizontal cut isolate a point in a separate synthetic scatterplot"
        >
          <text x="25" y="28" class="bold"
            >Separate two-cut illustration · not A05’s fitted trees</text
          >
          <rect x="35" y="50" width="480" height="225" class="node" />
          {#if step >= 1}<line x1="280" x2="280" y1="50" y2="275" class="link-gold" /><text
              x="290"
              y="270"
              class="tiny">cut 1</text
            >{/if}
          {#if step >= 2}<line x1="280" x2="515" y1="150" y2="150" class="link-gold" /><text
              x="465"
              y="142"
              class="tiny">cut 2</text
            ><rect
              x="280"
              y="50"
              width="235"
              height="100"
              fill="var(--green-soft,#edf5ee)"
              opacity=".7"
            />{/if}
          {#each [[90, 200], [130, 225], [180, 190], [210, 235], [425, 220], [450, 90]] as p, i}<circle
              cx={p[0]}
              cy={p[1]}
              r="8"
              class={i === 5 ? 'c' : 'a'}
            />{/each}
          <text x="466" y="86">A</text><text x="45" y="302" class="tiny"
            >Random cut locations; shorter paths can isolate unusual points.</text
          >
        </svg>
      </div>
    {:else}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
      <div
        class="diagram-scroll"
        role="region"
        tabindex="0"
        aria-label="Isolation paths from supplied exercise values"
      >
        <svg
          viewBox="0 0 560 310"
          role="img"
          aria-label={`Three supplied tree paths for transaction ${String.fromCharCode(65 + choice)}`}
        >
          <text x="25" y="28" class="bold"
            >Transaction {String.fromCharCode(65 + choice)} · follow each path</text
          >
          {#each selectedPaths as length, row}
            <text x="20" y={80 + row * 70}>Tree {row + 1}</text><line
              x1="103"
              x2={103 + (length / maxPath) * 350}
              y1={75 + row * 70}
              y2={75 + row * 70}
              class="link"
            />
            {#each Array.from({ length: Math.floor(length) }, (_, i) => i) as i}<circle
                cx={103 + ((i + 1) / maxPath) * 350}
                cy={75 + row * 70}
                r="9"
                class={i < step + 1 ? 'a' : 'node'}
              />{/each}
            <text x="477" y={80 + row * 70}>{f(length)} cuts</text>
          {/each}
          <text x="30" y="288"
            >Average {f((v.means as number[])[choice])} → 2^(−mean/{g.c}) → score {f(
              (v.scores as number[])[choice],
              3,
            )}</text
          >
        </svg>
      </div>
    {/if}
    <div class="diagram-table">
      <table>
        <caption>Queue from the exercise’s supplied paths</caption><thead
          ><tr
            ><th>Rank</th><th>Transaction</th><th>Mean path</th><th>Anomaly score</th><th
              >Review status</th
            ></tr
          ></thead
        ><tbody
          >{#each anomalyOrder as item, i}<tr class:emphasis={i === 0}
              ><td>{i + 1}</td><td>{String.fromCharCode(65 + item.index)}</td><td
                >{f((v.means as number[])[item.index])}</td
              ><td>{f(item.score, 3)}</td><td
                >{method === 2 && i > 0
                  ? 'Outside one-case budget'
                  : i === 0
                    ? 'First for investigation'
                    : 'Next in queue'}</td
              ></tr
            >{/each}</tbody
        >
      </table>
    </div>
    <p class="diagram-note">
      Scores rank unusualness, not confirmed fraud. A legitimate large payment may rank highly.
      Changing the contamination cutoff does not itself reorder the supplied anomaly scores.
    </p>
  {:else}
    {#if method === 3}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
      <div
        class="diagram-scroll"
        role="region"
        tabindex="0"
        aria-label="Community structure illustration"
      >
        <svg
          viewBox="0 0 560 280"
          role="img"
          aria-label="Two densely connected triangles joined by one bridge form one component but two apparent communities"
        >
          <text x="25" y="27" class="bold">One connected component; two dense communities</text>
          <ellipse cx="145" cy="145" rx="95" ry="89" fill="var(--green-soft,#edf5ee)" /><ellipse
            cx="410"
            cy="145"
            rx="95"
            ry="89"
            fill="var(--gold-soft,#f8ebcc)"
          />
          <path
            d="M95,180 L145,83 L205,180 Z M355,180 L410,83 L465,180 Z M205,180 L355,180"
            class="link"
          />
          {#each [[95, 180], [145, 83], [205, 180], [355, 180], [410, 83], [465, 180]] as p, i}<circle
              cx={p[0]}
              cy={p[1]}
              r="13"
              class={i < 3 ? 'a' : 'b'}
            /><text x={p[0]} y={p[1] + 34} text-anchor="middle" class="tiny">{i + 1}</text>{/each}
          <text x="280" y="252" text-anchor="middle" class="tiny"
            >Separate synthetic illustration; community labels do not establish fraud.</text
          >
        </svg>
      </div>
    {:else if method === 5}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
      <div
        class="diagram-scroll"
        role="region"
        tabindex="0"
        aria-label="Temporal money transfer motif"
      >
        <svg
          viewBox="0 0 560 280"
          role="img"
          aria-label="Three accounts send funds to a hub, which passes them on shortly afterwards"
        >
          <text x="25" y="27" class="bold">Separate timestamped transfer example</text>
          {#each [0, 1, 2] as i}<circle cx="70" cy={75 + i * 70} r="20" class="node" /><text
              x="70"
              y={80 + i * 70}
              text-anchor="middle">{i + 1}</text
            ><line x1="91" x2="249" y1={75 + i * 70} y2="145" class="link" /><text
              x="135"
              y={70 + i * 64}
              class="tiny">10:0{i} →</text
            >{/each}
          <circle cx="280" cy="145" r="30" class="gold-node" /><text
            x="280"
            y="151"
            text-anchor="middle">Hub</text
          ><path d="M310,145 L455,145" class="link" /><text x="363" y="125">10:03 →</text><circle
            cx="485"
            cy="145"
            r="26"
            class="node"
          /><text x="485" y="151" text-anchor="middle">End</text>
          <text x="30" y="265" class="tiny"
            >Fan-in and rapid pass-through describe timing; investigate legitimate explanations.</text
          >
        </svg>
      </div>
    {:else}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
      <div class="diagram-scroll" role="region" tabindex="0" aria-label="Typed entity network">
        <svg
          viewBox="0 0 560 325"
          role="img"
          aria-label={method === 7 && choice === 0
            ? 'Only device links are known; A and C are not connected at this cutoff'
            : 'Accounts, devices, and merchant form two components with four edges from A to C'}
        >
          {#each visibleEdges as [a, b], i}
            {@const active =
              method === 2
                ? i < 4 && (step >= 3 || i < step + 1)
                : method === 6 || step === 1
                  ? a === selected || b === selected
                  : graph.component.includes(a)}
            <line
              x1={graphNodes[a].x}
              x2={graphNodes[b].x}
              y1={graphNodes[a].y}
              y2={graphNodes[b].y}
              class="link"
              class:selected={active}
              class:faded={!active}
            />
            <text
              x={(graphNodes[a].x + graphNodes[b].x) / 2}
              y={graphNodes[a].y - 24}
              text-anchor="middle"
              class="tiny">{(a === 2 && b === 3) || (a === 3 && b === 4) ? 'pays' : 'uses'}</text
            >
          {/each}
          {#each graphNodes as node, i}
            {@const radius = method === 4 ? 13 + graph.ranks[i] * 70 : 17}
            {#if node.kind === 'account'}<circle
                cx={node.x}
                cy={node.y}
                r={radius}
                class="node"
                class:selected={i === selected || term === 'nodes'}
              />{:else if node.kind === 'device'}<rect
                x={node.x - 17}
                y={node.y - 17}
                width="34"
                height="34"
                class="gold-node"
              />{:else}<path
                d={`M${node.x},${node.y - 23} l23,23 l-23,23 l-23,-23 Z`}
                class="gold-node"
              />{/if}
            <text x={node.x} y={node.y + 43} text-anchor="middle" class="tiny">{node.id}</text>
            {#if method === 4}<text x={node.x} y={node.y + 65} text-anchor="middle" class="tiny"
                >{f(graph.ranks[i], 3)}</text
              >{/if}
            {#if method === 6}<text x={node.x} y={node.y + 5} text-anchor="middle"
                >{nodeValues[i]}</text
              >{/if}
          {/each}
          <text x="25" y="306" class="tiny"
            >Circle: account · square: device · diamond: merchant</text
          >
        </svg>
      </div>
    {/if}
    <div class="diagram-metrics">
      <span>Account {graphNodes[selected].id}<strong>Degree {graph.degree}</strong></span><span
        >Reachable component<strong
          >{graph.component.map((i) => graphNodes[i].id).join(' → ')}</strong
        ></span
      ><span
        >A to C<strong
          >{method === 7 && choice === 0
            ? 'No known path at day 1'
            : '4 edges · 5 visited nodes'}</strong
        ></span
      >
    </div>
    {#if method === 1}<p class="diagram-note">
        The exercise edges are unweighted relationships, so their degree counts links. Separate
        weighted-degree example: transfers of $100 and $400 give degree 2 but outgoing weighted
        degree $500. Never silently add dollars to device-sharing edges.
      </p>{/if}
    {#if method === 4}<p class="diagram-note">
        PageRank uses damping 0.85 and a uniform restart probability on this undirected teaching
        graph. Node area here is not a risk probability. Account {graphNodes[selected].id} has rank {f(
          graph.ranks[selected],
          4,
        )} and divides its transferable mass among {graph.degree} neighbors.
      </p>{/if}
    {#if method === 6}<p class="method-context">
        One supplied scalar GNN layer: own value {nodeValues[selected]} + neighbor sum {neighborMessage}
        → ReLU → <strong>{Math.max(0, nodeValues[selected] + neighborMessage)}</strong>. Here both
        weights equal 1 and aggregation is a sum. These are teaching values, not a trained fraud
        model.
      </p>{/if}
    {#if method === 7}<p class="method-context">
        Separate timestamp assumption on the teaching network: device links are known on day 1; the
        B–merchant and merchant–C links arrive on day 2. At the day-1 cutoff, those future links
        cannot contribute to an alert or a model feature. The original A07 calculation uses all five
        displayed links at its stated cutoff.
      </p>{/if}
    <p class="diagram-note">
      The numerical A07 network is fixed. All displayed edges are assumed known at the decision
      cutoff; later links would be leakage. Community and transfer-motif views are separately
      labeled teaching networks.
    </p>
  {/if}
</div>
