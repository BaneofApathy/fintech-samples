<script lang="ts">
  const items = [
    {
      q: 'What does a hat in ŷ or p̂ indicate?',
      choices: ['A prediction or estimate', 'The observed outcome', 'The average input value'],
      answer: 0,
      why: 'A hat marks an estimate: ŷ is a predicted outcome, while p̂ is an estimated probability.',
    },
    {
      q: 'This loan model records DTI in percentage points. How should a 35% DTI be entered?',
      choices: ['35', '0.35', '3,500'],
      answer: 0,
      why: 'Enter 35. The model uses percentage points, so 35% is represented by 35 rather than 0.35.',
    },
    {
      q: 'A model outputs p = 0.10. What determines the action?',
      choices: [
        'A threshold tied to policy and cost',
        'A fixed 50% cutoff for every decision',
        'The average probability in the training set',
      ],
      answer: 0,
      why: 'The model estimates probability. A policy chooses the action using a threshold tied to error costs and operating constraints.',
    },
  ];
  let answers = $state<Record<number, number>>({});
</script>

<div class="exercise-card">
  <div class="exercise-head">
    <h3>Three checks before you begin</h3>
    <span class="tag">Notation & decisions</span>
  </div>
  <div class="exercise-content">
    {#each items as item, i}<fieldset style="border:0;padding:.7rem 0;margin:0">
        <legend class="small"><b>{i + 1}. {item.q}</b></legend
        >{#each item.choices as choice, j}<label
            style="display:block;font-size:.9rem;margin:.4rem 0"
            ><input
              type="radio"
              name={`notation-${i}`}
              checked={answers[i] === j}
              onchange={() => (answers[i] = j)}
            />
            {choice}</label
          >{/each}{#if answers[i] !== undefined}<p
            class="feedback"
            class:correct={answers[i] === item.answer}
            role="status"
          >
            {item.why}
          </p>{/if}
      </fieldset>{/each}
  </div>
</div>
