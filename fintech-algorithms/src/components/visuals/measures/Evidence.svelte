<script lang="ts">
  import { untrack } from 'svelte';
  import type { Givens } from '../../../engine/types';
  import { average, adjustedRand, fmt, pct, ndcg, total } from '../../../engine/visual-math';
  let {
    number,
    givens,
    exerciseId,
    focusStep,
  }: { number: number; givens?: Givens; exerciseId?: string; focusStep?: string } = $props();
  const val = (key: string, n: number) =>
    typeof givens?.[key] === 'number' ? (givens[key] as number) : n;
  let tab = $state(untrack(() => (exerciseId === 'M27b' || exerciseId === 'M29b' ? 1 : 0))),
    customer = $state(3),
    k = $state(4),
    relabel = $state(false),
    changed = $state(false),
    retrievalK = $state(5),
    selected = $state(0),
    repaired = $state(false);
  const own = [1, 5],
    other = [7, 9];
  let a = $derived(average(own.map((p) => Math.abs(p - customer)))!),
    b = $derived(average(other.map((p) => Math.abs(p - customer)))!);
  const membership = [0, 0, 0, 1, 1, 1];
  let rerun = $derived(
    (changed ? [0, 0, 1, 0, 1, 1] : membership).map((v) => (relabel ? 1 - v : v)),
  );
  const source = [
    'A: 2024 revenue $100m',
    'B: 2025 revenue $120m',
    'C: office lease details',
    'D: unrelated marketing report',
    'E: 2023 archived forecast',
  ];
  const order = [0, 2, 3, 1, 4];
  let hits = $derived(order.slice(0, retrievalK).filter((i) => i < 2).length);
  let firstRanks = $derived(changed ? [1, 1, 5, 0] : [1, 2, 5, 0]);
  let grades = $derived(changed ? [3, 1, 0] : [1, 3, 0]);
  let auditCounts = $derived([
    { label: 'Claims', total: val('claims', 5), correct: val('supported', 4) },
    { label: 'Citation pairs', total: val('citations', 4), correct: val('correctCitations', 3) },
    { label: 'Figures', total: val('figures', 8), correct: val('correctFigures', 7) },
  ]);
  const claimItems = [
    ['2025 revenue was $120m. [A]', 'A: 2025 revenue $120m'],
    ['Revenue grew 20%. [A]', 'A: (120 − 100) / 100 = 20%'],
    ['Net profit was $12m. [C]', 'B supports the claim; C is the wrong attached citation'],
    ['Debt $40m, cash $15m, expense $108m, assets $200m. [C]', 'C contains all four figures'],
    ['2025 revenue was $200m. No citation.', 'A reports revenue of $120m, not $200m'],
  ];
  const citationItems = [
    ['Revenue $120m → A', 'A reports 2025 revenue $120m'],
    ['Growth 20% → A', 'A provides both revenue periods'],
    ['Four balance-sheet and expense figures → C', 'C provides all four values'],
    ['Profit $12m → C', 'C reports other quantities; B is the supporting source'],
  ];
  const figureItems = [
    ['Revenue $120m', 'A: revenue $120m'],
    ['Revenue growth 20%', 'A: (120 − 100) / 100'],
    ['Profit $12m', 'B: profit $12m'],
    ['Debt $40m', 'C: debt $40m'],
    ['Cash $15m', 'C: cash $15m'],
    ['Expense $108m', 'C: expense $108m'],
    ['Assets $200m', 'C: assets $200m'],
    ['Revenue $200m', 'A: revenue is $120m; the amount was confused with assets'],
  ];
  let auditItems = $derived([claimItems, citationItems, figureItems][tab]);
  let audit = $derived(auditCounts[tab]);
  let good = $derived(Math.min(audit.total, audit.correct + (repaired ? 1 : 0)));
</script>

{#if number === 26}
  <label class="vm-control"
    >Selected customer position (scaled feature units) <input
      type="range"
      min="0"
      max="10"
      step=".25"
      bind:value={customer}
    /><output>{customer}</output></label
  >
  <svg
    class="vm-plot"
    viewBox="0 0 500 245"
    role="img"
    aria-label="Distances from one customer to members of own and alternative clusters"
    ><line x1="35" y1="175" x2="465" y2="175" class="vm-axis" />{#each own as p}<line
        x1={35 + 43 * customer}
        y1="65"
        x2={35 + 43 * p}
        y2="145"
        class="vm-line"
      /><circle cx={35 + 43 * p} cy="145" r="8" class="vm-dot" /><text x={25 + 43 * p} y="198"
        >{p}</text
      >{/each}{#each other as p}<line
        x1={35 + 43 * customer}
        y1="65"
        x2={35 + 43 * p}
        y2="145"
        class="vm-line vm-secondary"
      /><rect x={29 + 43 * p} y="139" width="12" height="12" class="vm-square" /><text
        x={25 + 43 * p}
        y="198">{p}</text
      >{/each}<circle cx={35 + 43 * customer} cy="65" r="11" class="vm-dot" /><text x="70" y="30"
      >Selected customer → all members, not just nearest neighbor</text
    ><text x="45" y="230">Circles: own cluster · squares: alternative cluster</text></svg
  >
  <div class="visual-readouts">
    <div><span>Mean own distance a</span><strong>{fmt(a, 2)}</strong></div>
    <div><span>Mean alternative distance b</span><strong>{fmt(b, 2)}</strong></div>
    <div><span>(b − a) / max(a,b)</span><strong>{fmt((b - a) / Math.max(a, b), 3)}</strong></div>
  </div>
  <p>
    Starting at 3 gives a = 2 and b = 5, matching the lesson. Membership is held fixed while the
    selected customer moves.
  </p>
{:else if number === 27}
  <div class="visual-tabs">
    <button aria-pressed={tab === 0} onclick={() => (tab = 0)}>Inertia</button><button
      aria-pressed={tab === 1}
      onclick={() => (tab = 1)}>Stability · adjusted Rand index</button
    >
  </div>
  {#if tab === 0}<label class="vm-control"
      >Number of clusters <input type="range" min="3" max="5" step="1" bind:value={k} /><output
        >{k}</output
      ></label
    ><svg
      class="vm-plot"
      viewBox="0 0 500 270"
      role="img"
      aria-label="Elbow curve: inertia at three, four, five clusters"
      ><path d="M40 25V220H460" class="vm-axis" /><polyline
        points="80,40 240,100 400,115"
        class="vm-line"
      />{#each [1200, 800, 700] as v, i}<circle
          cx={80 + i * 160}
          cy={220 - v * 0.15}
          r={k === i + 3 ? 9 : 5}
          class="vm-dot"
        /><text x={60 + i * 160} y={207 - v * 0.15}>{v}</text><text x={45 + i * 160} y="250"
          >{i + 3} clusters</text
        >{/each}<text x="50" y="20">Sum of squared distances (inertia)</text></svg
    >
    <p class="vm-equation">K = {k} → inertia {[1200, 800, 700][k - 3]}</p>
    <p>
      Going from 3 to 4 removes 400 squared units; from 4 to 5 removes only 100. This supplied elbow
      suggests a candidate, not a proof.
    </p>
  {:else}<label class="vm-check"
      ><input type="checkbox" bind:checked={changed} /> Move customers 3 and 4 between groups</label
    ><label class="vm-check"
      ><input type="checkbox" bind:checked={relabel} /> Rename X ↔ Y without changing membership</label
    >
    <div class="vm-table-wrap">
      <table>
        <thead
          ><tr
            ><th>Customer</th>{#each membership as _, i}<th>{i + 1}</th>{/each}</tr
          ></thead
        ><tbody
          ><tr
            ><th>Original</th>{#each membership as group}<td>{group ? 'B' : 'A'}</td>{/each}</tr
          ><tr
            ><th>Rerun</th>{#each rerun as group}<td>{group ? 'Y' : 'X'}</td>{/each}</tr
          ></tbody
        >
      </table>
    </div>
    <p class="vm-equation">Adjusted Rand index = {fmt(adjustedRand(membership, rerun), 4)}</p>
    <div class="vm-matrix">
      {#each [0, 1] as row}{#each [0, 1] as col}<div>
            <span>{row ? 'B' : 'A'} ∩ {col ? 'Y' : 'X'}</span><strong
              >{membership.filter((v, i) => v === row && rerun[i] === col).length}</strong
            >
          </div>{/each}{/each}
    </div>
    <p>
      The overlap counts compare the same customer identities. Arbitrary names do not affect ARI.
    </p>{/if}
{:else if number === 28}
  <div class="visual-tabs">
    <button aria-pressed={tab === 0} onclick={() => (tab = 0)}>Retrieval recall</button><button
      aria-pressed={tab === 1}
      onclick={() => (tab = 1)}>Context precision</button
    >
  </div>
  <p>
    Lesson benchmark: 16 of 20 questions with one required passage succeed at K = 5, giving mean
    recall 80%. The separate two-source question below illustrates context precision and evidence
    completeness.
  </p>
  <label class="vm-control"
    >Retrieved passages K <input
      type="range"
      min="1"
      max="5"
      step="1"
      bind:value={retrievalK}
    /><output>{retrievalK}</output></label
  >
  <div class="vm-tray">
    <div class="vm-node">
      <strong>Required evidence</strong><span>A · 2024 revenue</span><span>B · 2025 revenue</span>
    </div>
    <span>→</span>
    <div class="vm-node">
      <strong>Retrieved tray</strong>{#each order.slice(0, retrievalK) as index}<span
          class:vm-highlight={index < 2}
          >{index < 2 ? '✓ relevant' : '○ unrelated'} · {source[index]}</span
        >{/each}
    </div>
  </div>
  <div class="visual-readouts">
    <div class:vm-highlight={tab === 0}>
      <span>Selected-question recall</span><strong>{hits} / 2 = {pct(hits / 2)}</strong>
    </div>
    <div class:vm-highlight={tab === 1}>
      <span>Context precision</span><strong>{hits} / {retrievalK} = {pct(hits / retrievalK)}</strong
      >
    </div>
  </div>
  <p>
    {hits < 2
      ? 'The revenue comparison is incomplete: B is still missing.'
      : 'Both periods are available. Irrelevant passages still dilute the context.'} These retrieval scores
    do not verify a generated answer.
  </p>
{:else if number === 29}
  <div class="visual-tabs">
    <button aria-pressed={tab === 0} onclick={() => (tab = 0)}>MRR</button><button
      aria-pressed={tab === 1}
      onclick={() => (tab = 1)}>nDCG</button
    >
  </div>
  <label class="vm-check"
    ><input type="checkbox" bind:checked={changed} />{tab === 0
      ? 'Move Q2’s first useful result to rank 1'
      : 'Move grade-3 passage to rank 1'}</label
  >
  {#if tab === 0}<div class="vm-card-grid">
      {#each firstRanks as rank, i}<div class="vm-node">
          <strong>Question {i + 1}</strong><span
            >{rank ? `First useful rank ${rank}` : 'No useful result'}</span
          ><strong>{rank ? `1/${rank} = ${fmt(1 / rank, 2)}` : '0'}</strong>
        </div>{/each}
    </div>
    <p class="vm-equation">
      MRR = sum of reciprocal ranks / 4 = {fmt(average(firstRanks.map((r) => (r ? 1 / r : 0))), 3)}
    </p>
  {:else}<div class="vm-tray">
      {#each grades as grade, i}<div class="vm-node">
          <span>Rank {i + 1}</span><strong>Relevance {grade}</strong><span
            >Gain {2 ** grade - 1} ÷ log₂({i + 2})</span
          ><span>= {fmt((2 ** grade - 1) / Math.log2(i + 2), 3)}</span>
        </div>{/each}
    </div>
    <p class="vm-equation">nDCG@3 = DCG / ideal DCG = {fmt(ndcg(grades), 4)}</p>
    <p>
      The ideal ordering is [3,1,0]. A zero relevance grade contributes no gain; higher ranks
      receive less discount.
    </p>{/if}
{:else}
  <div class="visual-tabs">
    {#each ['Faithfulness', 'Citation correctness', 'Numerical accuracy'] as label, i}<button
        aria-pressed={tab === i}
        onclick={() => {
          tab = i;
          selected = 0;
          repaired = false;
        }}>{label}</button
      >{/each}
  </div>
  <p class="visual-caption">
    {givens
      ? `Counts from ${exerciseId ?? 'the exercise'}.`
      : 'Starting audit: 4 of 5 claims, 3 of 4 citation pairs, 7 of 8 figures.'} Cards show examples of
    each support rule.
  </p>
  <div class="vm-card-grid">
    <div class="vm-node">
      <strong>Source A · revenue</strong><span>2024 $100m → 2025 $120m</span>
    </div>
    <div class="vm-node"><strong>Source B · earnings</strong><span>2025 net profit $12m</span></div>
    <div class="vm-node">
      <strong>Source C · 2025 amounts</strong><span>Debt $40m · cash $15m</span><span
        >Expense $108m · assets $200m</span
      >
    </div>
  </div>
  <div class="vm-audit">
    {#each Array.from({ length: audit.total }) as _, i}<button
        aria-pressed={selected === i}
        onclick={() => (selected = i)}
        class:vm-highlight={selected === i}
        >{tab === 0 ? 'Claim' : tab === 1 ? 'Citation pair' : 'Figure'}
        {i + 1}<strong>{i < good ? '✓ verified' : '× needs correction'}</strong></button
      >{/each}
  </div>
  <div class="vm-tray">
    <div class="vm-node">
      <strong>{auditItems[selected]?.[0] ?? `Selected item ${selected + 1}`}</strong><span
        >{repaired && selected >= audit.correct
          ? 'Hypothetical correction applied to this audit item.'
          : auditItems[selected]?.[1]}</span
      >
    </div>
    <span>↔</span>
    <div class="vm-node">
      <strong>Verification rule</strong><span
        >{tab === 0
          ? 'Any retrieved evidence must support the entire claim.'
          : tab === 1
            ? 'The attached source must support this claim.'
            : 'Compare the financial figure and arithmetic with the stated source.'}</span
      >
    </div>
  </div>
  <button onclick={() => (repaired = !repaired)}
    >{repaired ? 'Restore original audit' : 'Correct one failing item'}</button
  >
  <p class="vm-equation">
    {good} / {audit.total}
    {audit.label.toLowerCase()} = {pct(good / audit.total)}
  </p>
  <p>
    {tab === 0
      ? 'A claim must match the source’s quantity and period; a plausible number from a different line item is insufficient.'
      : tab === 1
        ? 'A true claim may still cite the wrong document.'
        : 'A copied figure may be correct while the conclusion containing it is unsupported.'} Correcting
    one audit category leaves the other categories unchanged.
  </p>
{/if}
