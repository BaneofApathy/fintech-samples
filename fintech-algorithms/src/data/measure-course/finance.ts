import { c, f, type MeasureSeed } from './authoring';
const risk = ['notation', 'probability', 'variance'];
export const financeSeeds: MeasureSeed[] = [
  {
    number: 31,
    slug: 'sharpe-and-sortino-ratios',
    title: 'Sharpe and Sortino Ratios',
    definition:
      'Sharpe measures excess return per unit of total return variability. Sortino compares return above a target with downside variability.',
    precise:
      'Sharpe=(mean return−risk-free return)/return SD; Sortino=(mean return−target)/downside deviation. Periods and downside conventions must match.',
    prerequisites: risk,
    terms: [
      [
        'Excess return',
        'Mean return minus the reference risk-free return for the same period.',
        '9%−3%=6 percentage points.',
      ],
      ['Volatility', 'Standard deviation of returns.', '12% annual SD.'],
      [
        'Downside deviation',
        'Root mean squared shortfall below a target, using all observations in this course.',
        'Non-shortfall periods contribute zero but remain in the denominator.',
      ],
      ['Target return', 'The benchmark used to define downside shortfall.', 'A 0% monthly target.'],
    ],
    mechanics: [
      'Match return frequency, risk-free rate/target and volatility horizon. Divide the excess-return fraction by the corresponding deviation fraction; percentages must use the same scale.',
      'Sharpe penalizes upside and downside variability through SD. Sortino’s downside calculation uses min(r_t−target,0), squares it, averages over all n periods, then roots.',
      'Ratios are unitless, can be negative, and have no fixed finite upper bound when risk is very small. With comparable references and horizons, larger ratios mean more return per measured risk; they do not guarantee better future outcomes. The course uses sample SD (n−1) for observed return volatility and all-period denominator n for downside.',
    ],
    formulas: [
      f(
        'Sharpe=\\frac{\\bar r-r_f}{s_r},\\quad Sortino=\\frac{\\bar r-target}{d_r}',
        'Compare both numerator and denominator on the same time scale. A negative numerator means return is below the specified reference.',
        ['\\bar r', 'Mean periodic return.'],
        ['r_f', 'Risk-free return over that period.'],
        ['s_r', 'Sample SD of returns.'],
        ['target', 'Periodic downside target.'],
        ['d_r', 'Downside deviation relative to target.'],
      ),
      f(
        's_r=\\sqrt{\\frac{\\sum_t(r_t-\\bar r)^2}{n-1}},\\quad d_r=\\sqrt{\\frac1n\\sum_t\\min(r_t-target,0)^2}',
        'Sample volatility divides by n−1; downside here divides by every period n, including non-shortfalls as zero. These conventions are not interchangeable.',
        ['r_t', 'Return in period t.'],
        ['\\bar r', 'Mean of those returns.'],
        ['n', 'Return observations.'],
        ['target', 'Declared return target.'],
      ),
    ],
    trace: [
      ['Portfolio A', 'Mean 9%, risk-free 3%, vol 12%, downside 6%', 'Comparable annual inputs.'],
      [
        'A ratios',
        'Sharpe=(.09−.03)/.12=.5; Sortino=(.09−.03)/.06=1',
        'Uses 3% as downside target in this comparison.',
      ],
      [
        'Portfolio B',
        'Mean 11%, vol 20%, downside 8%: Sharpe=.08/.20=.4; Sortino=.08/.08=1',
        'More return but more total variability.',
      ],
      [
        'Downside mechanics',
        'Returns [−.02,.04], target 0: shortfalls [−.02,0]; d=√(.0004/2)≈.01414',
        'Positive period stays in the denominator.',
      ],
      [
        'Sample SD mechanics',
        'Mean=.01; SD=√((.0009+.0009)/(2−1))≈.04243',
        'Sample rather than population SD.',
      ],
    ],
    interpretation:
      'Portfolio B’s higher raw return does not outperform A per unit of total volatility; their supplied Sortino ratios tie because upside variability is treated differently.',
    comparison:
      'Compare with drawdown, tail losses and costs. Annualizing SD by a square-root rule assumes an appropriate return process; keep periodic calculations explicit rather than automatically mixing horizons.',
    boundaries:
      'Zero volatility/downside makes the corresponding raw ratio undefined; fewer than two periods cannot estimate sample SD. A finite historical ratio does not guarantee future return, and repeated backtest selection can inflate it.',
    mechanismChecks: [
      c(
        'What distinguishes Sharpe’s denominator from Sortino’s?',
        'Total SD versus target-relative downside deviation',
        'Sharpe counts variability in both directions; Sortino uses below-target deviations.',
        'Total profit versus total revenue|Profit and revenue are monetary totals; these ratios normalize excess return by return dispersion.',
        'They always have identical denominators.|Sharpe includes all return deviations, while Sortino uses below-target deviations, so their denominators can differ.',
      ),
      c(
        'How does this course compute downside deviation?',
        'Average squared shortfalls over all periods, including zero contributions.',
        'Only negative deviations enter the sum, but n includes every period.',
        'Divide only by the number of negative periods.|This course divides downside squared deviations by all periods; dividing only by negative periods defines another convention.',
        'Use signed errors without squaring.|Signed below-target errors can cancel or remain negative; downside deviation squares them before averaging and rooting.',
      ),
      c(
        'What units do these ratios have?',
        'Unitless, when matching-period return fractions are divided',
        'Mixing annual numerator with monthly denominator changes interpretation.',
        'Dollars|Return divided by return deviation cancels units, so the result is not a dollar amount.',
        'Guaranteed annual percent return|A historical ratio is dimensionless and cannot guarantee a future annual return percentage.',
      ),
    ],
    calculations: [
      c(
        'Mean return 9%, risk-free 3%, volatility 12%. What is Sharpe?',
        '0.5',
        '(.09−.03)/.12=.06/.12=.5.',
        '0.75|This omits risk-free subtraction.',
        '6|Six is percentage-point excess, not the ratio.',
      ),
      c(
        'Mean return 9%, target 3%, downside 6%. What is Sortino?',
        '1',
        '(.09−.03)/.06=1.',
        '0.5|This uses 12% total volatility instead.',
        '1.5|This omits target subtraction.',
      ),
      c(
        'Returns [−.02,.04], target 0. What is downside deviation using all periods?',
        'About 0.01414',
        '√((.0004+0)/2)=√.0002≈.01414.',
        '0.02|This divides only by the negative period.',
        '0.04243|This is sample total SD.',
      ),
    ],
    applications: [
      c(
        'B returns more but has lower Sharpe than A. What follows?',
        'B has less excess return per unit of supplied total volatility.',
        'Raw return alone does not settle risk-adjusted comparison.',
        'B must have lower total return.|B has the larger stated return; its lower ratio comes from larger dispersion relative to excess return.',
        'A is guaranteed to outperform next year.|A better historical risk-adjusted score supplies no guarantee about next year’s realized performance.',
      ),
      c(
        'Why can Sortino rankings differ from Sharpe rankings?',
        'They penalize different parts of return variability.',
        'Upside volatility enters Sharpe but not downside shortfall calculation.',
        'Sortino ignores the return numerator.|Sortino still has a return-above-target numerator; changing the downside denominator can change the ranking.',
        'Sharpe directly counts defaults.|Sharpe uses return dispersion rather than a count of borrower defaults.',
      ),
      c(
        'There are no below-target observations, so downside deviation is zero. How should Sortino be treated?',
        'The raw ratio is undefined; report the boundary and sample limits.',
        'A zero denominator does not support an ordinary finite ratio or a risk-free guarantee.',
        'Automatically zero|Zero downside deviation makes the raw denominator zero; it does not make the ratio zero.',
        'A guaranteed infinitely safe investment|No observed downside in the sample does not prove future safety or justify an ordinary finite ratio.',
      ),
    ],
  },
  {
    number: 32,
    slug: 'maximum-drawdown-turnover-tracking-error',
    title: 'Maximum Drawdown, Turnover, Tracking Error',
    definition:
      'Maximum drawdown measures the worst peak-to-trough loss; turnover measures portfolio rebalancing; tracking error measures active-return variability.',
    precise:
      'MDD=max_t(H_t−V_t)/H_t with running peak H_t. Turnover=½Σ|Δw_i|. Tracking error is sample SD of fund-minus-benchmark returns.',
    prerequisites: risk,
    terms: [
      [
        'Running peak',
        'Highest portfolio value observed up to the current time.',
        'After values 100,120,90, the peak is 120.',
      ],
      ['Drawdown', 'Loss from the running peak as a fraction of that peak.', '(120−90)/120=25%.'],
      [
        'One-way turnover',
        'Half the sum of absolute fully invested weight changes.',
        'Selling 20% and buying 20% gives 20% turnover.',
      ],
      [
        'Active return',
        'Fund return minus benchmark return in the same period.',
        '3% fund−2% benchmark=1%.',
      ],
      [
        'Tracking error',
        'Standard deviation of active returns.',
        'Variation around the active-return mean, not its level.',
      ],
    ],
    mechanics: [
      'For drawdown update the historical peak before dividing the current shortfall by that peak. Future highs cannot serve as past peaks.',
      'For turnover calculate new−old weights, sum absolute changes and halve. For a fully invested portfolio, gross buys+sells dollars=2V×turnover; charges on gross traded value apply to that amount.',
      'For tracking error compute every active return, its mean, squared deviations and sample SD with n−1. The course monthly-to-annual example multiplies by√12. Drawdown and turnover are fractions; tracking error has return-fraction units. Lower turnover reduces trading under a fixed cost model; lower tracking error means closer return tracking, which is desirable when benchmark replication is the objective.',
    ],
    formulas: [
      f(
        'H_t=\\max_{u\\le t}V_u,\\quad MDD=\\max_t\\frac{H_t-V_t}{H_t}',
        'A running peak uses only values already observed. With positive portfolio values, drawdown ranges 0 to 1 and lower means a shallower realized decline.',
        ['V_t', 'Portfolio value at time t.'],
        ['H_t', 'Running highest portfolio value.'],
        ['t', 'Observation time.'],
      ),
      f(
        'Turnover=\\frac12\\sum_i|w_i^{new}-w_i^{old}|,\\quad Gross=2V\\,Turnover,\\quad Cost=Gross\\,c',
        'For fully invested long-only weights, turnover is one-way traded fraction while Gross counts both buys and sells. Transaction cost c is dollars per traded dollar.',
        ['w_i^{new}', 'New weight for asset i.'],
        ['w_i^{old}', 'Old asset weight.'],
        ['V', 'Portfolio dollars.'],
        ['c', 'Cost fraction of gross traded dollars.'],
      ),
      f(
        'a_t=r_{fund,t}-r_{bench,t},\\quad TE=\\sqrt{\\frac{\\sum_t(a_t-\\bar a)^2}{n-1}},\\quad TE_{annual}=TE_{monthly}\\sqrt{12}',
        'Subtract the benchmark before measuring variability. The square-root annualization is the convention for the stated monthly example.',
        ['a_t', 'Active return for period t.'],
        ['r_{fund,t}', 'Fund return.'],
        ['r_{bench,t}', 'Benchmark return.'],
        ['\\bar a', 'Mean active return.'],
        ['n', 'Return observations.'],
      ),
    ],
    trace: [
      [
        'Drawdown path',
        'Values 100,120,90,125; peaks 100,120,120,125; drawdowns 0,0,.25,0',
        'MDD remains 25% despite final 25% gain.',
      ],
      [
        'Weight changes',
        'Old [.6,.4], new [.4,.6]: changes [−.2,+.2]',
        'A20% sale and 20% purchase.',
      ],
      [
        'Turnover and cost',
        '(.2+.2)/2=.2; V=$1m; gross=$400k; c=.001 gives $400',
        'The half factor and gross factor offset.',
      ],
      [
        'Tracking observations',
        'Active [.01,−.01,.01,−.01]; mean 0; square sum .0004',
        'Active returns fluctuate around zero.',
      ],
      [
        'Tracking error',
        '√(.0004/3)=.011547 monthly; ×√12=.04 annual',
        'Sample SD and stated annualization.',
      ],
    ],
    interpretation:
      'A portfolio can recover and finish profitably after a deep drawdown, trade expensively to maintain weights, or deviate substantially from a benchmark. Each requires a distinct risk/implementation check.',
    comparison:
      'Final return is not maximum drawdown. Turnover is not cost until a transaction-cost model is supplied. Tracking error measures benchmark-relative variability, not overall portfolio volatility or mean outperformance.',
    boundaries:
      'Zero/nonpositive peaks need a different drawdown convention. Leverage, cash flows and changing portfolio values complicate turnover interpretation. Tracking error needs at least two periods; square-root annualization is not universally valid under serial dependence.',
    mechanismChecks: [
      c(
        'Why does later recovery not erase maximum drawdown?',
        'MDD records the largest historical peak-to-trough fraction.',
        'The worst observed decline remains part of the path even after a new peak.',
        'MDD equals only final return.|Final return compares start and finish; maximum drawdown records the largest earlier peak-to-trough fall.',
        'MDD is the current portfolio balance.|A balance is a monetary level; maximum drawdown is a historical fraction of a running peak.',
      ),
      c(
        'Why does turnover use a half factor?',
        'It avoids counting the same reallocation as both a sale and a purchase.',
        'A fully invested 20% transfer has 40% gross weight movement but 20% one-way turnover.',
        'It assumes every trade costs 50%.|The half factor avoids counting both the sell and buy legs as separate one-way turnover; it is not a 50% fee assumption.',
        'It removes all transaction costs.|Turnover measures weight movement; transaction costs require a separate charge rate and trading-value convention.',
      ),
      c(
        'What does tracking error measure?',
        'Variability of fund-minus-benchmark returns around their mean',
        'Constant outperformance can have zero tracking error; mean active return is separate.',
        'The fund’s total revenue|Tracking error measures dispersion of fund-minus-benchmark returns, not revenue.',
        'The maximum drawdown only|Drawdown follows the wealth path’s peaks and troughs; tracking error follows active return variability.',
      ),
    ],
    calculations: [
      c(
        'Portfolio peak 120 falls to 90. What is drawdown?',
        '25%',
        '(120−90)/120=30/120=.25.',
        '33.33%|This divides by the trough instead of peak.',
        '30%|Thirty is the value decline.',
      ),
      c(
        'Weights change [.6,.4] to [.4,.6]. What is turnover?',
        '20%',
        '½(|−.2|+|.2|)=.2.',
        '40%|This is gross absolute movement.',
        '0%|Signed changes cancel but trades occurred.',
      ),
      c(
        'Monthly active returns ±.01 over 4 periods have mean 0 and square sum .0004. What is annual TE?',
        '4%',
        'Monthly√(.0004/3)=.011547; annual×√12=.04.',
        '2%|This understates variability after the sample-SD calculation and twelve-period annualization.',
        '1%|This is individual active magnitude.',
      ),
    ],
    applications: [
      c(
        'A portfolio ends up 25% but suffered 25% drawdown. Which report is appropriate?',
        'Report both final return and the adverse path.',
        'Investors experienced the interim loss even though the portfolio recovered.',
        'Report no risk because it finished higher.|A positive final return does not remove the substantial interim loss a student or investor had to withstand.',
        'Treat drawdown as negative final return.|The peak-to-trough loss and start-to-finish gain can both be 25%; they are distinct path summaries.',
      ),
      c(
        'Turnover 20% on $1m, with costs on gross trade value. What spend base is relevant?',
        '$400,000 gross traded dollars',
        '2×$1m×.2 counts sales and purchases.',
        '$200,000 only without stating a one-way charge convention|The 20% one-way turnover corresponds to both $200,000 sold and $200,000 bought; the stated gross-charge base is $400,000.',
        '$1m regardless of trades|Costs charged on traded value do not apply to untouched holdings; the whole portfolio is not the stated gross trade amount.',
      ),
      c(
        'A fund beats its benchmark by exactly 1% every month. What can tracking error be?',
        'Zero despite positive mean active return',
        'Tracking error measures variation around the active mean, which is zero for a constant series.',
        'Necessarily 1%|A constant 1% active return has a 1% mean but zero deviation around that mean, hence zero tracking error.',
        'Necessarily its Sharpe ratio|Sharpe normalizes excess fund return by total volatility; tracking error is the volatility of active returns.',
      ),
    ],
  },
  {
    number: 33,
    slug: 'value-at-risk-and-expected-shortfall',
    title: 'Value at Risk and Expected Shortfall',
    definition:
      'VaR is a loss quantile at a stated horizon and confidence. Expected shortfall averages the worst tail losses under the stated convention.',
    precise:
      'The course uses nearest-rank VaR=L_(ceil(pN)) in ascending losses, and ES as the mean of the worst (1−p)N losses for its integer-tail examples.',
    prerequisites: risk,
    terms: [
      [
        'Loss quantile',
        'A cutoff in the ordered distribution of losses.',
        '80 th-percentile loss.',
      ],
      ['Nearest rank', 'The one-based rank ceil(pN).', 'For p=.8, N=10, select rank 8.'],
      [
        'Expected shortfall',
        'Average of the losses in the specified worst tail.',
        'Worst two losses 10 and 20 average 15.',
      ],
      [
        'Exceedance',
        'A loss strictly above VaR under this course convention.',
        'A loss equal to VaR is not an exceedance.',
      ],
    ],
    mechanics: [
      'State horizon, confidence p, loss sign convention and quantile method. Sort losses ascending and select the nearest-rank one-based index.',
      'For the integer tail in this example choose the largest(1−p)N values and average them. Alternative fractional-tail/tie conventions require explicit documentation.',
      'VaR and ES have monetary loss units, not probabilities. Lower means a smaller reported loss level for otherwise comparable cases; losses can be negative if gains are represented as negative loss.',
    ],
    formulas: [
      f(
        'VaR_p=L_{(\\lceil pN\\rceil)},\\quad ES_p=\\frac1m\\sum_{j=N-m+1}^{N}L_{(j)},\\quad m=(1-p)N',
        'The tail average here assumes m is a positive integer. The order statistic is one-based, and the worst losses are the largest values.',
        ['p', 'Confidence fraction.'],
        ['N', 'Loss observations or simulation draws.'],
        ['L_{(j)}', 'jth ascending ordered loss.'],
        ['m', 'Integer number of worst-tail losses.'],
      ),
    ],
    trace: [
      ['Sort', '[0,1,2,3,4,5,6,7,10,20]', 'Losses in $thousands.'],
      ['VaR rank', 'ceil(.8×10)=8; L_(8)=7', '80% nearest-rank VaR=$7k.'],
      ['Tail mean', 'm=.2×10=2; ES=(10+20)/2=15', 'Worst two losses average $15k.'],
      ['Strict exceedance', 'Two losses>7: 2/10=.20', 'Equality does not exceed the cutoff.'],
    ],
    interpretation:
      'VaR identifies a cutoff, while ES indicates how severe the bad tail is beyond that region. The tail can be much worse than the cutoff.',
    comparison:
      'VaR is not a worst-case loss bound. ES responds to the magnitude of extreme losses, while a quantile can remain unchanged when the most extreme loss grows.',
    boundaries:
      'Empty loss samples are undefined. With noninteger tail size, state the interpolation/weighting policy rather than silently rounding. Empirical exceedance need not equal 1−p exactly because of discreteness and ties.',
    mechanismChecks: [
      c(
        'Which ordering is used for this VaR calculation?',
        'Ascending losses, taking the nearest-rank cutoff',
        'The largest values represent the worst losses under this sign convention.',
        'Descending gains with no sign definition|The calculation declares positive losses and sorts them ascending; sorting undefined gains would change both sign and rank meaning.',
        'Average of all losses|A mean summarizes all observations, whereas VaR selects a stated loss quantile.',
      ),
      c(
        'How is ES calculated in the integer-tail examples?',
        'Average the worst(1−p)N losses',
        'It summarizes tail severity, not the quantile itself.',
        'Use the single VaR observation only.|The VaR observation locates a cutoff; ES averages the specified worst tail rather than that single observation.',
        'Average the smallest losses.|The smallest losses are the safest outcomes, so averaging them would miss the severe-loss tail entirely.',
      ),
      c(
        'Does loss exactly equal to VaR count as an exceedance here?',
        'No; exceedance uses strict greater-than.',
        'Ties at the threshold do not enter a strict breach count.',
        'Yes; every quantile equality is a breach.|The stated breach comparison is strict loss>VaR; equality does not count.',
        'Only if the loss is positive.|Positive loss alone does not imply a breach; a positive value below or equal to VaR is not an exceedance.',
      ),
    ],
    calculations: [
      c(
        'Sorted losses [0,1,2,3,4,5,6,7,10,20], p=.8. What is nearest-rank VaR?',
        '7',
        'ceil(.8×10)=8; the eighth loss is 7.',
        '10|This selects rank 9.',
        '15|This is the tail mean.',
      ),
      c(
        'The worst two losses are 10 and 20. What is ES?',
        '15',
        '(10+20)/2=15.',
        '20|This is the worst loss.',
        '10|This is only one tail value.',
      ),
      c(
        'Two of ten losses strictly exceed VaR. What is exceedance fraction?',
        '20%',
        '2/10=.20.',
        '80%|This is the confidence level.',
        '2%|Two is the count, not its rate.',
      ),
    ],
    applications: [
      c(
        'Does 80% VaR=$7k imply losses cannot exceed $7k?',
        'No; VaR is a cutoff, not a worst-case cap.',
        'The sample has $10k and $20k losses beyond that cutoff.',
        'Yes; VaR guarantees a hard upper bound.|An 80% quantile leaves a loss tail beyond the cutoff; it is not the largest possible loss.',
        'Yes; ES cannot be larger than VaR.|Tail losses can be much larger than the cutoff, so their expected shortfall can exceed VaR.',
      ),
      c(
        'The largest tail loss doubles while the cutoff rank stays unchanged. What may react most?',
        'Expected shortfall',
        'ES averages the tail magnitudes; the same ordered cutoff may not change.',
        'VaR must double.|Keeping the cutoff observation unchanged can leave nearest-rank VaR unchanged even when a worse tail loss doubles.',
        'The confidence level must double.|The confidence level is an input chosen for the report, not an amount recalculated by doubling one loss.',
      ),
      c(
        'Two VaR reports use different horizons and quantile interpolation. What is needed?',
        'Align conventions before comparing dollar values.',
        'Horizon and order-statistic rules materially affect reported risk.',
        'Compare solely by the model name.|Model names do not resolve different holding periods or finite-sample quantile conventions.',
        'Assume all methods produce identical finite-sample quantiles.|Nearest-rank and interpolated quantiles can differ on the same finite loss sample, so conventions must be aligned.',
      ),
    ],
  },
  {
    number: 34,
    slug: 'probability-of-shortfall-and-monte-carlo-error',
    title: 'Probability of Shortfall and Monte Carlo Error',
    definition:
      'Shortfall probability is a simulated breach frequency. Monte Carlo standard error describes sampling uncertainty in that estimated frequency.',
    precise:
      'p̂=k/N and SE=√[p̂(1−p̂)/N] for independent Bernoulli draws; the course uses the approximate normal interval p̂±1.96 SE.',
    prerequisites: risk,
    terms: [
      [
        'Shortfall event',
        'A draw that violates the stated reserve or funding condition.',
        'Loss strictly greater than reserve.',
      ],
      [
        'Monte Carlo standard error',
        'Estimated sampling SD of the breach-frequency estimator.',
        'A3-percentage-point SE with 100 draws at 10% breaches.',
      ],
      [
        'Model uncertainty',
        'Uncertainty about the assumptions/data-generating model, distinct from draw noise.',
        'The loss distribution may omit a crisis regime.',
      ],
    ],
    mechanics: [
      'Define the shortfall condition before running independent simulations. Count each draw’s binary breach indicator.',
      'Estimate p by count/N, then its Bernoulli standard error. More draws shrink SE roughly as 1/√N when the modeled p is similar.',
      'Probability and SE are unitless fractions. A lower modeled shortfall probability means fewer modeled breaches, while smaller SE means more precise frequency estimation. A narrower simulation interval measures precision conditional on assumptions, not stronger confidence in the financial model itself.',
    ],
    formulas: [
      f(
        '\\hat p=k/N,\\quad SE=\\sqrt{\\hat p(1-\\hat p)/N},\\quad CI\\approx\\hat p\\pm1.96SE',
        'The interval is an approximate 95% normal interval for independent draws. Near rare-event boundaries it can be inaccurate, so report counts and an appropriate interval method.',
        ['k', 'Number of simulated shortfalls.'],
        ['N', 'Independent simulated draws.'],
        ['\\hat p', 'Estimated shortfall fraction.'],
        ['SE', 'Estimated standard error of that fraction.'],
        ['CI', 'Approximate normal confidence interval.'],
      ),
    ],
    trace: [
      ['Count', 'k=10, N=100: p̂=.10', '10% simulated shortfall frequency.'],
      ['SE', '√(.1×.9/100)=√.0009=.03', 'Three percentage points.'],
      ['Interval', '.10±1.96×.03=[.0412,.1588]', 'Approximate 4.12%–15.88%.'],
      ['Four times draws', 'N=400 at same p: SE=√(.09/400)=.015', 'SE halves, not quarters.'],
    ],
    interpretation:
      'A reserve-breach estimate should report draw count and uncertainty. It remains a statement about the chosen simulated loss process.',
    comparison:
      'Increasing draws reduces Monte Carlo noise; changing assumptions tests model risk. These are complementary checks rather than interchangeable improvements.',
    boundaries:
      'N=0 is undefined. Zero observed breaches gives plug-in SE0 but does not prove zero true modeled risk. Dependence among draws invalidates the simple effective-sample-size assumption; normal intervals near 0/1 need care.',
    mechanismChecks: [
      c(
        'What determines simulated shortfall probability?',
        'A count of draws satisfying the defined breach condition divided by draws',
        'The event rule must be stated before counting.',
        'The average severity of all losses|Average severity estimates loss magnitude, not the fraction of simulations whose loss exceeds reserves.',
        'The final loss draw only|One draw contributes one indicator; probability is estimated from all simulated draws.',
      ),
      c(
        'What assumption underlies this SE formula?',
        'Independent Bernoulli breach indicators',
        'Correlated or weighted draws require a different uncertainty calculation.',
        'Guaranteed correct loss-distribution assumptions|The SE formula addresses sampling variation under the simulation setup; it cannot validate the chosen loss distribution.',
        'Every breach has identical dollar severity|The indicator is binary regardless of breach severity, so different dollar losses can share the same breach event.',
      ),
      c(
        'What happens to SE when N quadruples at the same p?',
        'It halves',
        'The 1/√N scaling gives 1/√4=1/2.',
        'It quarters|SE scales with 1/√N, so quadrupling N divides it by two rather than four.',
        'It becomes zero|More finite draws reduce sampling error but do not force it to zero when the estimated probability is interior.',
      ),
    ],
    calculations: [
      c(
        'Ten shortfalls occur among 100 draws. What is p̂?',
        '0.10',
        '10/100=.10.',
        '0.01|This divides by another factor of ten.',
        '10|This is the count.',
      ),
      c(
        'p̂=.10, N=100. What is Monte Carlo SE?',
        '0.03',
        '√(.10×.90/100)=√.0009=.03.',
        '0.09|This omits the sample-size division and root.',
        '0.0009|This is the variance, not SE.',
      ),
      c(
        'SE=.006 atN=2500. AtN=10000 with similar p, what is SE?',
        '0.003',
        'Four times as many draws halves SE.',
        '0.0015|This wrongly uses 1/N scaling.',
        '0.024|More draws reduce sampling error.',
      ),
    ],
    applications: [
      c(
        'What does running more simulations improve directly?',
        'Sampling precision conditional on the simulated model',
        'It does not automatically repair omitted risks or bad inputs.',
        'The truth of every financial assumption|Increasing draw count does not correct misspecified default rates, dependence, or recovery assumptions.',
        'The certainty that reserves never breach|A more precise probability estimate can still be positive; additional simulation does not remove reserve risk.',
      ),
      c(
        'A narrow interval is reported from an unrealistic loss model. What remains?',
        'Model uncertainty despite small Monte Carlo error',
        'Numerical precision and assumption validity are different concerns.',
        'No uncertainty at all|A narrow sampling interval leaves model and input uncertainty intact.',
        'A guaranteed safe reserve|Precision under an unrealistic model does not establish that reserves are safe in the real financial system.',
      ),
      c(
        'No breaches are observed in a small sample. What is justified?',
        'Report zero observed breaches and uncertainty; do not claim risk is impossible.',
        'A finite sample may miss rare modeled events even though plug-in SE is zero.',
        'The true shortfall probability is proven zero.|Zero observed breaches can occur by chance even when true breach probability is positive.',
        'The model has perfect calibration.|Calibration requires comparing probabilistic forecasts with realized outcomes; a small zero-breach sample does not prove it.',
      ),
    ],
  },
  {
    number: 35,
    slug: 'var-exception-rate',
    title: 'VaR Exception Rate',
    definition:
      'VaR exception rate checks how often realized loss breaches a previously issued VaR forecast.',
    precise:
      'Exception rate=k/N, nominal rate=1−p, expected exception count=N(1−p), and rate ratio=(k/N)/(1−p).',
    prerequisites: risk,
    terms: [
      [
        'Exception',
        'A realized loss strictly above the forecast VaR.',
        'A loss beyond yesterday’s 99% VaR.',
      ],
      [
        'Nominal exception rate',
        'The target exceedance fraction implied by confidence p.',
        '99% VaR implies 1% nominal exceptions.',
      ],
      [
        'Expected count',
        'The nominal rate multiplied by evaluated periods.',
        '250×.01=2.5 expected exceptions.',
      ],
    ],
    mechanics: [
      'Align each realized loss with the VaR forecast for the same horizon, produced before the outcome. Count strict breaches.',
      'Divide by evaluation periods; compare with 1−p and the expected count. A noninteger expectation is normal even though realized counts are integers.',
      'Rates are in [0,1]; ratios are nonnegative and may exceed one. A high ratio can signal underestimated risk, but dependence and sampling variability require analysis.',
    ],
    formulas: [
      f(
        'Rate=k/N,\\quad Nominal=1-p,\\quad Expected=N(1-p),\\quad Ratio=\\frac{k/N}{1-p}',
        'The forecast confidence gives a target breach fraction. Expected count and observed count are different quantities, and a rate ratio measures their relative frequency.',
        ['k', 'Strict realized VaR exceptions.'],
        ['N', 'Evaluated periods.'],
        ['p', 'Forecast VaR confidence fraction.'],
      ),
    ],
    trace: [
      ['Observed rate', '10/250=.04=4%', 'Ten daily breaches.'],
      ['Nominal rate', '1−.99=.01=1%', '99% VaR target.'],
      ['Expected count', '250×.01=2.5', 'Long-run reference expectation.'],
      ['Rate ratio', '.04/.01=4', 'Four times nominal breach frequency.'],
    ],
    interpretation:
      'The backtest flags a discrepancy between promised and realized tail coverage. Investigate the risk model and market regimes rather than treating a quantile as a hard bound.',
    comparison:
      'Monte Carlo shortfall frequency evaluates simulated draws; exception rate evaluates realized losses against prior forecasts. Exception severity and temporal clustering supply information the count omits.',
    boundaries:
      'N=0 is undefined, and p=1 gives a zero nominal-rate denominator for the ratio. A low exception rate can mean conservative VaR rather than an efficient model. Count alone does not establish independence or a formal backtest result.',
    mechanismChecks: [
      c(
        'Which event is a VaR exception here?',
        'Realized loss strictly exceeds its prior VaR forecast',
        'The forecast must be issued before the observed outcome and match its horizon.',
        'Loss equals VaR exactly.|Equality is excluded by the course’s strict loss>VaR exception rule.',
        'The model’s average return is negative.|A negative average return does not identify whether a particular loss crossed its forecast VaR threshold.',
      ),
      c(
        'What is the nominal exception rate for confidence p?',
        '1−p',
        'Confidence and tail frequency are complementary fractions.',
        'p|p is the intended non-exceedance probability; the exception probability is its complement 1−p.',
        'N×p|N×p is an expected covered-observation count, not the exception-rate fraction.',
      ),
      c(
        'Can expected exception count be fractional?',
        'Yes; it is an expectation, not a realized count.',
        '2.5 expected events does not require observing half an event.',
        'No; every expected count must be rounded first.|Realized counts are integers, but the expectation N(1−p) can be fractional without being rounded first.',
        'No; confidence must be changed to force an integer.|Changing confidence to force an integer changes the risk report; fractional expectations are mathematically valid.',
      ),
    ],
    calculations: [
      c(
        '10 exceptions in 250 days. What is exception rate?',
        '4%',
        '10/250=.04.',
        '1%|This is the nominal 99% tail.',
        '25%|This reverses the period relationship.',
      ),
      c(
        '250 days at 99% VaR. What is expected exception count?',
        '2.5',
        '250×(1−.99)=2.5.',
        '247.5|This counts nominal non-exceptions.',
        '25|This uses a 10% tail.',
      ),
      c(
        'Observed exception rate 4%, nominal 1%. What is rate ratio?',
        '4',
        '0.04/0.01=4.',
        '3%|This is the rate gap.',
        '0.25|This reverses the comparison.',
      ),
    ],
    applications: [
      c(
        'A99% VaR model has 4% observed exceptions. What is reasonable?',
        'Investigate possible underestimation and backtest uncertainty',
        'The observed rate is four times nominal but a full assessment also considers sample and dependence.',
        'Declare losses impossible because confidence is 99%.|99% confidence still allows a nominal 1% exception tail; it does not make losses impossible.',
        'Automatically change all past VaR forecasts.|Altering past forecasts after observing losses destroys an honest backtest and does not explain the excess exceptions.',
      ),
      c(
        'Why inspect whether exceptions cluster in time?',
        'A rate alone hides dependence and stress-regime failures.',
        'Ten adjacent breaches differ operationally from ten widely separated breaches.',
        'Clustering changes arithmetic count into dollars automatically.|Temporal clustering concerns dependence and risk dynamics; it does not turn a count fraction into monetary severity.',
        'The average rate already proves independence.|The average frequency omits event timing, so equal rates can conceal very different clustering and independence.',
      ),
      c(
        'A model has fewer exceptions than nominal. What is a possible interpretation?',
        'It may be conservative; lower breach rate alone does not prove efficient risk allocation.',
        'Overly large VaR can reduce breaches while tying up reserves.',
        'It is guaranteed optimal.|A low observed rate may reflect conservatism or sampling variation; it does not establish optimal risk management.',
        'The observed losses must be incorrect.|Observed losses may be valid even when fewer than the nominal number cross VaR.',
      ),
    ],
  },
  {
    number: 36,
    slug: 'cumulative-reward-and-regret',
    title: 'Cumulative Reward and Regret',
    definition:
      'Cumulative reward aggregates an action sequence’s objective. Regret compares it with a feasible reference under the same conditions.',
    precise:
      'In the execution example reward=−Σcost_t and regret=policy cost−best feasible hindsight cost; baseline improvement is baseline cost−policy cost.',
    prerequisites: ['notation', 'probability', 'data-splits'],
    terms: [
      [
        'Reward convention',
        'The sign and quantity the action policy seeks to maximize.',
        'Negative execution cost makes smaller cost higher reward.',
      ],
      [
        'Feasible comparator',
        'A reference obeying the same execution constraints.',
        'A best hindsight schedule that completes the order.',
      ],
      ['Regret', 'The cost gap to that specified comparator.', '$900 policy−$700 comparator=$200.'],
      [
        'Basis point',
        'One ten-thousandth of notional,0.01 percentage point.',
        '1 bp of $1m is $100.',
      ],
    ],
    mechanics: [
      'Define costs and rewards before evaluating actions. Sum all relevant execution periods including unfinished-order penalties.',
      'Compare with a baseline using the same notional, market path and constraints. Regret requires a declared comparator; an infeasible perfect hindsight schedule is misleading.',
      'Dollar reward is larger when less negative; cost and regret prefer smaller values. Divide dollar difference by notional and multiply 10,000 to express basis points.',
    ],
    formulas: [
      f(
        'Reward=-\\sum_tC_t,\\quad Regret=C_{policy}-C_{best},\\quad Improvement=C_{base}-C_{policy}',
        'A minus sign converts cost minimization into reward maximization. Regret and baseline improvement compare against different references.',
        ['C_t', 'Execution cost dollars in period t.'],
        ['C_{policy}', 'Total evaluated policy cost.'],
        ['C_{best}', 'Best feasible comparator cost on the matched problem.'],
        ['C_{base}', 'Declared baseline cost.'],
      ),
      f(
        'Difference_{bps}=\\frac{Difference_{dollars}}{V}\\times10{,}000',
        'Notional V sets the monetary scale. One basis point is V×0.0001 dollars, so bps makes order-size comparisons interpretable.',
        ['Difference_{dollars}', 'Dollar cost gap or saving.'],
        ['V', 'Order notional dollars.'],
      ),
    ],
    trace: [
      ['Aggregate cost', '$300+$200+$400=$900', 'All execution steps included.'],
      ['Reward', '−$900', 'Higher than−$1,200 baseline reward.'],
      ['Saving', '$1,200−$900=$300', 'Improves over baseline.'],
      ['Regret', '$900−$700=$200', 'Still worse than feasible hindsight.'],
      ['Scale', '$300/$1m×10,000=3 bps; $200/$1m×10,000=2 bps', 'Saving and regret are distinct.'],
    ],
    interpretation:
      'A policy can improve over TWAP while retaining regret relative to a stronger feasible comparator. Both are useful for financial execution assessment.',
    comparison:
      'Reward evaluates the stated objective; completion, safety constraints and tail shortfall must be checked separately. Good average reward can hide unfinished orders or rare expensive paths.',
    boundaries:
      'Zero notional makes basis-point scaling undefined. A comparator must be feasible and aligned; reward-scale changes invalidate raw comparisons. Estimated hindsight best is only as strong as the candidate search and assumptions.',
    mechanismChecks: [
      c(
        'If reward equals negative cost, what does larger reward mean?',
        'Lower cost under that definition',
        '−900 is larger than−1200, so it represents lower execution cost.',
        'Higher execution cost|When reward is negative cost, increasing reward makes reward less negative while the underlying cost becomes smaller.',
        'More orders regardless of completion|More orders can increase cost or leave incomplete executions; order count alone does not define this reward.',
      ),
      c(
        'What is regret’s comparator?',
        'A declared best feasible reference on the matched problem',
        'It is distinct from a simple baseline and must obey constraints.',
        'Any impossible hindsight schedule|An impossible schedule gives an unattainable benchmark; regret requires the stated feasible hindsight comparator.',
        'Only the first action|Cumulative regret compares the full policy outcome with the comparator, not just the first action.',
      ),
      c(
        'How are dollar differences converted to basis points?',
        'Divide by notional and multiply 10,000',
        'A basis point is 0.0001 of the same monetary base.',
        'Multiply by notional|Basis points are a relative difference: dividing by notional removes monetary units before multiplying by 10,000.',
        'Divide by 100 only|Dividing dollars by 100 neither normalizes by notional nor converts a return fraction into basis points.',
      ),
    ],
    calculations: [
      c(
        'Step costs are $300, $200, $400. What is cumulative reward=−sum cost?',
        '−$900',
        'Sum=$900; reward is its negative.',
        '+$900|The reward convention has a minus sign.',
        '−$300|This averages instead of summing.',
      ),
      c(
        'Policy costs $900 and feasible best costs $700. What is regret?',
        '$200',
        '$900−$700=$200.',
        '$300|This is saving versus a $1,200 baseline.',
        '−$200|This reverses the regret direction.',
      ),
      c(
        'Saving $300 on $1m notional is how many basis points?',
        '3 bps',
        '300/1,000,000×10,000=3.',
        '30 bps|A factor of ten is added.',
        '0.03 bps|The scaling is incorrect.',
      ),
    ],
    applications: [
      c(
        'Can a policy beat a baseline and still have positive regret?',
        'Yes; the best feasible comparator can be better than both.',
        'Baseline improvement and regret use different reference costs.',
        'No; saving forces regret to zero.|A policy can save against a weak baseline while still costing more than the feasible hindsight comparator.',
        'No; regret measures the same baseline saving.|Baseline savings and hindsight regret use different reference costs, so they are not the same difference.',
      ),
      c(
        'Why must a hindsight comparator obey completion and risk limits?',
        'Otherwise its lower cost may be unattainable for the evaluated task.',
        'A fair comparator solves the same constrained execution problem.',
        'Because feasibility is already guaranteed by reward sign.|A negative-cost reward does not enforce feasibility; constraints must be applied to the comparator explicitly.',
        'Because all hindsight schedules are deployable.|Hindsight has future information unavailable in deployment, and an unconstrained schedule may violate completion or risk limits.',
      ),
      c(
        'Good average reward coexists with unfinished orders. What is required?',
        'Report completion and constraints alongside reward',
        'A favorable numerical objective does not erase unmet execution obligations.',
        'Ignore completion because the average reward is high.|A policy can appear cheap by failing to finish; completion must be assessed along with reward.',
        'Declare the task successful from reward alone.|Reward alone can hide unfinished financial obligations, so task success also needs the stated completion checks.',
      ),
    ],
  },
  {
    number: 37,
    slug: 'task-success-verification-unsafe-actions',
    title: 'Task Success, Verification, Unsafe Actions',
    definition:
      'These operational measures distinguish completed work, independently checked outcomes, unsafe attempts, unsafe executions and tool failures.',
    precise:
      'Success=correct verified completions/tasks; verification=checked tasks/tasks; unsafe attempt or execution rates use tasks; tool error rate=failed calls/all tool calls.',
    prerequisites: ['notation', 'probability'],
    terms: [
      [
        'Verified completion',
        'A task whose required outcome is both correct and checked.',
        'An account update matches ledger evidence.',
      ],
      [
        'Verification coverage',
        'The fraction of tasks receiving the required check.',
        '95 of 100 tasks are checked, including some failures.',
      ],
      [
        'Unsafe attempt',
        'A task containing an attempted disallowed action, even if blocked.',
        'A blocked unauthorized transfer request.',
      ],
      [
        'Unsafe execution',
        'A task where an unsafe action actually occurs.',
        'A disallowed transfer reaches execution.',
      ],
      [
        'Tool error',
        'A failed tool invocation under the declared rubric.',
        'Ten failures among 200 calls.',
      ],
    ],
    mechanics: [
      'Define task boundaries and required correctness evidence. A tool returning success is not enough to establish the financial task was completed correctly.',
      'Count tasks with unsafe attempts separately from executed unsafe actions. A blocked attempt remains an attempt but does not become an execution.',
      'Task-level rates use number of tasks; tool-level error rates use calls. All lie in [0,1]; success/verification prefer higher, unsafe/error rates lower. Verification is not itself success.',
    ],
    formulas: [
      f(
        'Success=C_v/T,\\quad Verification=T_c/T,\\quad UnsafeAttempt=T_a/T,\\quad UnsafeExecution=T_u/T,\\quad ToolError=E/N_{calls}',
        'These denominators represent distinct evaluated populations. One task can have multiple calls; task counts and call counts must not be mixed.',
        ['C_v', 'Correct verified completed tasks.'],
        ['T', 'All evaluated tasks.'],
        ['T_c', 'Tasks with the required verification check.'],
        ['T_a', 'Tasks containing an unsafe attempt.'],
        ['T_u', 'Tasks with an unsafe execution.'],
        ['E', 'Tool call errors.'],
        ['N_{calls}', 'All evaluated tool calls.'],
      ),
    ],
    trace: [
      ['Success', '90 correct verified completions/100 tasks=.90', 'Outcome-based success.'],
      [
        'Verification',
        '95 checked/100=.95',
        'Checks include five tasks not successfully completed.',
      ],
      [
        'Attempts and executions',
        '4 unsafe-attempt tasks/100=.04; 0 executed/100=0',
        'Guards blocked attempts.',
      ],
      ['Tool errors', '10/200=.05', 'Call-level failure rate, not task failure rate.'],
    ],
    interpretation:
      'A financial workflow must distinguish supported completion from merely running tools. Blocked unsafe attempts are evidence of useful guards and a remaining policy-quality issue.',
    comparison:
      'High completion can coexist with insufficient checks; high verification can coexist with failed tasks. Human review, evidence-chain quality and error recovery complement these rates.',
    boundaries:
      'Zero tasks or calls makes the respective rate undefined. Counts can overlap; do not add verification and success as disjoint categories. Severity and repeated attempts within one task require separate reporting beyond binary task rates.',
    mechanismChecks: [
      c(
        'What is required for task success here?',
        'Correct completion with the required verification evidence',
        'Tool completion alone does not establish the end-to-end financial result.',
        'Any tool returning a response|A tool response can be incorrect or incomplete; success requires the task’s completion and acceptance criteria.',
        'Any task receiving a check even when wrong|Being checked describes verification coverage, while passing the check determines successful completion.',
      ),
      c(
        'What denominator does tool error rate use?',
        'All tool calls',
        'Multiple calls can belong to one task, so task count is a different population.',
        'All tasks|Tasks and calls have different populations because one task can make several calls; tool errors divide by calls.',
        'Unsafe attempts only|Unsafe attempts measure safety behavior, not the number of tool calls exposed to execution errors.',
      ),
      c(
        'A guard blocks an unsafe request. What counts?',
        'An unsafe attempt but no unsafe execution',
        'Separate attempt from actual action to evaluate policy and safeguards.',
        'A completed unsafe execution|Blocking the request prevents unsafe execution, although the attempted unsafe behavior is still counted.',
        'A successful safe task automatically|Preventing one unsafe action does not prove the task was completed correctly.',
      ),
    ],
    calculations: [
      c(
        '90 correct verified completions among 100 tasks. What is success rate?',
        '90%',
        '90/100=.90.',
        '95%|This could be verification coverage.',
        '180%|This mixes task and call totals.',
      ),
      c(
        'Four tasks attempt unsafe actions, none execute, out of 100 tasks. What are the two rates?',
        'Attempt 4%, execution 0%',
        'Count attempted-task events and executed-task events separately.',
        'Attempt 0%, execution 4%|This reverses attempted and executed populations: four attempted tasks were blocked, so execution remained zero.',
        'Both 4%|Counting the blocked attempts as executions ignores that none of the unsafe actions actually ran.',
      ),
      c(
        'Ten calls fail among 200 calls. What is tool error rate?',
        '5%',
        '10/200=.05.',
        '10%|This uses 100 tasks as denominator.',
        '95%|This is the successful-call fraction.',
      ),
    ],
    applications: [
      c(
        'Verification coverage is 95%, success 90%. Is that possible?',
        'Yes; checking a task does not ensure its outcome is correct.',
        'Verification describes whether checking occurred; success requires correct completion.',
        'No; the rates must be equal.|Verification can find failures, so the checked fraction can exceed the successful fraction.',
        'No; verified failures must be removed from tasks.|Removing checked failures changes the task population and hides unsuccessful work rather than explaining the two rates.',
      ),
      c(
        'Unsafe execution is 0% but attempt rate 4%. What should improve?',
        'Maintain guards and investigate why the policy attempted unsafe actions.',
        'Blocking protects execution, while attempts still expose problematic behavior.',
        'Remove guards because nothing unsafe executed.|The guards are why unsafe execution stayed zero; removing them would expose the attempted actions.',
        'Claim the policy never attempts unsafe actions.|A zero execution rate records guard effectiveness, while the 4% attempt rate shows the policy still proposes unsafe actions.',
      ),
      c(
        'A workflow makes many tool calls per task. Why keep task and call denominators separate?',
        'They answer outcome-level versus operation-level reliability questions.',
        'One failed call can be retried while the final task succeeds; a call rate does not equal task success.',
        'Because rates are always interchangeable.|Task and call rates are not interchangeable when tasks contain different numbers of calls.',
        'Because every task must contain exactly one call.|Multi-step workflows routinely make several calls per task, so assuming one call would use the wrong error denominator.',
      ),
    ],
  },
  {
    number: 38,
    slug: 'population-stability-index',
    title: 'Population Stability Index',
    definition:
      'PSI summarizes how a distribution’s binned proportions changed from a reference population.',
    precise:
      'PSI=Σ(A_i−E_i)ln(A_i/E_i) using the same bins for current proportions A and reference proportions E.',
    prerequisites: ['notation', 'probability', 'logarithms', 'data-splits'],
    terms: [
      [
        'Reference distribution E',
        'The baseline proportion in each fixed bin.',
        'Half of training applicants fall in each of two bands.',
      ],
      [
        'Current distribution A',
        'The current proportion in those same bins.',
        'Current proportions are 20% and 80%.',
      ],
      [
        'Fixed bin',
        'A common interval/category definition used for both populations.',
        'The same DTI boundaries before and after deployment.',
      ],
      [
        'Distribution shift',
        'A change in observed input or score frequencies.',
        'High-DTI applications become more common.',
      ],
    ],
    mechanics: [
      'Choose stable bin edges on the reference and apply them unchanged to current data. Proportions within each population should sum to one.',
      'For each bin calculate proportion difference, current/reference ratio, its natural log, and their product; sum products. Differences and logs have the same sign, so valid positive-bin terms are nonnegative.',
      'PSI is unitless, nonnegative and unbounded. Zero means identical binned proportions. It detects binned distribution change, not automatically performance deterioration or its cause.',
    ],
    formulas: [
      f(
        'PSI=\\sum_i(A_i-E_i)\\ln(A_i/E_i)',
        'Natural log amplifies proportional changes. Common bins are essential; comparing different partitions is not a valid calculation.',
        ['A_i', 'Current fraction in bin i, positive for the raw formula.'],
        ['E_i', 'Reference fraction in bin i, positive for the raw formula.'],
        ['i', 'Common bin index.'],
        ['\\ln', 'Natural logarithm of the unitless proportion ratio.'],
      ),
    ],
    trace: [
      [
        'Bin 1',
        'A=.2, E=.5: difference−.3; ratio .4; ln≈−.91629',
        'Both difference and log are negative.',
      ],
      ['Bin 1 contribution', '−.3×−.91629≈.274887', 'A positive shift contribution.'],
      [
        'Bin 2',
        '.8−.5=.3; ratio 1.6; ln≈.47000; contribution≈.141001',
        'Positive difference and log.',
      ],
      ['Sum', '.274887+.141001≈.415888', 'The binned mix changed materially in this example.'],
    ],
    interpretation:
      'PSI can prompt investigation of applicant/transaction mix changes, data-pipeline problems or model-monitoring needs. It does not identify which financial outcomes worsened.',
    comparison:
      'Use PSI alongside current calibration, error rates and data-quality checks. Identical binned PSI can hide within-bin shifts; binning choices affect magnitude.',
    boundaries:
      'Zero bin proportions cause log/ratio boundary problems. If smoothing is used, document epsilon/pseudocount, apply consistently and renormalize. Conventional alert bands are monitoring heuristics rather than universal performance guarantees.',
    mechanismChecks: [
      c(
        'What must match between reference and current PSI inputs?',
        'Bin definitions',
        'Each term compares proportions in the same category or interval.',
        'Exactly the same observed people|PSI can compare different populations; what must match is the bin definition and proportion convention.',
        'Exactly the same raw sample size|Proportions normalize sample counts, so samples can differ in size while using the same fixed bins.',
      ),
      c(
        'Why can a bin with declining share still contribute positively?',
        'Both its difference and log ratio are negative.',
        'Multiplying two negative quantities gives a positive shift contribution.',
        'PSI takes the absolute value of each count.|PSI multiplies a signed proportion change by its signed log ratio; it does not take absolute raw counts.',
        'Declines always reduce PSI below zero.|For a declining share both the difference and log ratio are negative, making their product nonnegative.',
      ),
      c(
        'What does PSI=0 establish for valid positive bins?',
        'The binned proportions match',
        'It does not establish unchanged labels or model performance within the bins.',
        'Every prediction is correct.|Matching bin proportions says nothing directly about prediction correctness.',
        'No possible within-bin shift occurred.|Aggregated bin shares can remain equal while values shift within bins.',
      ),
    ],
    calculations: [
      c(
        'A=.2, E=.5. What is the ratio inside the log?',
        '0.4',
        '.2/.5=.4.',
        '2.5|This reverses current/reference.',
        '−0.3|This is the proportion difference.',
      ),
      c(
        'A=.2, E=.5 and ln(.4)≈−.91629. What is the contribution?',
        'About 0.274887',
        '(.2−.5)×(−.91629)=−.3×−.91629≈.274887.',
        '−0.274887|The product of two negatives is positive.',
        '0.91629|This omits the difference.',
      ),
      c(
        'Bin contributions are .274887 and .141001. What is PSI?',
        'About 0.415888',
        'Add the two contributions:.274887+.141001=.415888.',
        '0.207944|This averages rather than sums.',
        '0.133886|This subtracts contributions.',
      ),
    ],
    applications: [
      c(
        'PSI increased. What does this establish directly?',
        'The monitored binned distribution changed.',
        'Performance, causation and financial severity require separate evidence.',
        'The model’s default probabilities are wrong by exactly that amount.|PSI measures distributional change, not the size of default-probability prediction errors.',
        'The model is legally unfair.|A distribution shift alone does not establish any legal fairness conclusion.',
      ),
      c(
        'Why retain bin definitions between monitoring runs?',
        'Changing bins can change PSI independently of the underlying shift.',
        'Comparable partitioning is required for like-for-like proportions.',
        'To force every future PSI to zero|Fixed bins keep the measurement comparable; they do not force reference and current proportions to match.',
        'To avoid collecting current data|Current proportions still require current observations even when the bin boundaries stay fixed.',
      ),
      c(
        'A reference bin has zero proportion. What must be done?',
        'Report the boundary and use a documented smoothing or rebinning policy if needed.',
        'The raw ratio/log is undefined or divergent; silently setting a term to zero hides the problem.',
        'Treat the bin’s contribution as zero automatically.|The log ratio with a zero reference share is undefined under the raw formula; silently assigning zero hides the shift.',
        'Declare the distributions identical.|A zero in one reference bin does not establish identical distributions; the boundary needs a documented treatment.',
      ),
    ],
  },
  {
    number: 39,
    slug: 'latency-throughput-review-load-cost',
    title: 'Latency, Throughput, Review Load, Cost',
    definition:
      'Operational measures assess response time, processing capacity, human workload, economic efficiency and service availability.',
    precise:
      'Latency summaries include weighted mean and nearest-rank percentiles; throughput is completed work/time; backlog is unmet arrival capacity; cost uses a stated request/correct-output denominator; availability is scheduled uptime fraction.',
    prerequisites: ['notation', 'probability'],
    terms: [
      [
        'Latency',
        'Elapsed time to complete one request under a stated start/end definition.',
        'A40 ms response.',
      ],
      [
        'Throughput',
        'Completed requests per time unit.',
        '12,000 per minute means 200 per second.',
      ],
      [
        'Review load',
        'Cases assigned to humans relative to their capacity.',
        '500 daily alerts versus 300 cases of daily capacity.',
      ],
      [
        'Abstention',
        'A request deferred from automatic processing to another route.',
        '100 of 1,000 requests go to human review.',
      ],
      [
        'Availability',
        'The fraction of scheduled time the service is operating.',
        'Scheduled 43,200 minutes less 90 minutes downtime.',
      ],
    ],
    mechanics: [
      'Mean latency weights every request. Percentiles sort request-level times and use ceil(pN), not an average of group percentiles. Lower latency and fewer deadline failures are preferred.',
      'Convert arrival and capacity to the same time unit before computing max(arrival−capacity,0)×duration backlog. Human review capacity is analysts×cases per analyst per day; higher throughput alone does not ensure end-to-end completion.',
      'Abstention=deferred/N and automatic coverage=automatic/N. Automatic accuracy uses automatic cases only; cost/request uses all requests, while cost/correct uses correct automatic plus correct manual outcomes. Rates are fractions and costs are dollars.',
      'Availability=(scheduled−downtime)/scheduled. Downtime allowance=scheduled×(1−SLO). Higher availability is preferred, but achieved availability and target SLO are distinct.',
    ],
    formulas: [
      f(
        '\\bar\\ell=\\sum_gn_g\\ell_g/N,\\quad \\ell_p=\\ell_{(\\lceil pN\\rceil)},\\quad DeadlineFailure=N_{late}/N',
        'Grouped identical times can be weighted to get the mean; percentile rank is one-based in sorted individual requests. Units are milliseconds here.',
        ['n_g', 'Requests in time group g.'],
        ['\\ell_g', 'Latency for group g, milliseconds.'],
        ['N', 'Evaluated requests.'],
        ['p', 'Percentile fraction.'],
        ['N_{late}', 'Requests over the deadline.'],
      ),
      f(
        'Backlog(T)=\\max(\\lambda-\\mu,0)T,\\quad HumanCapacity=n_ac_a',
        'Rates lambda and mu must share a time unit. T converts excess rate to count. Human counts use analysts times their per-period case capacity.',
        ['\\lambda', 'Arrival rate, requests per second.'],
        ['\\mu', 'Service capacity, requests per second.'],
        ['T', 'Duration, seconds.'],
        ['n_a', 'Analyst count.'],
        ['c_a', 'Cases per analyst per day.'],
      ),
      f(
        'Abstention=N_{defer}/N,\\quad Coverage=N_{auto}/N,\\quad AutoAccuracy=N_{auto,correct}/N_{auto}',
        'Coverage and abstention sum to one only when every request is either automatic or deferred. Higher automatic accuracy means stronger performance on the selected automatic population. Higher coverage means fewer deferred cases; it trades off against accuracy and review capacity rather than supplying a universal optimum.',
        ['N', 'All requests.'],
        ['N_{defer}', 'Deferred requests.'],
        ['N_{auto}', 'Automatically processed requests.'],
        ['N_{auto,correct}', 'Correct automatic outcomes.'],
      ),
      f(
        'C_{total}=C_{model}+N_{defer}c_{human},\\quad CostPerRequest=C_{total}/N,\\quad CostPerCorrect=C_{total}/(N_{auto,correct}+N_{manual,correct})',
        'Costs include the stated model spend and review spend. Per-request and per-correct denominators must not be substituted.',
        ['C_{model}', 'Model spend dollars.'],
        ['N_{defer}', 'Reviewed/deferred request count.'],
        ['c_{human}', 'Dollars per human review.'],
        ['N', 'All requests.'],
        ['N_{auto,correct}', 'Correct automatic outputs.'],
        ['N_{manual,correct}', 'Correct manual outputs.'],
      ),
      f(
        'Availability=1-D/T_s,\\quad Allowance=T_s(1-a^*)',
        'D and scheduled time T_s share time units. The allowance is a budget from the target a*, not observed uptime.',
        ['D', 'Downtime minutes.'],
        ['T_s', 'Scheduled minutes.'],
        ['a^*', 'Availability target fraction.'],
      ),
    ],
    trace: [
      [
        'Latency distribution',
        '95×40 ms+4×180 ms+1×1000 ms=5520 ms; mean=55.2 ms',
        'A small slow tail hides behind a fast mean.',
      ],
      [
        'Percentiles/deadline',
        'p95 rank 95=40 ms; p99 rank 99=180 ms; 5/100 over 100 ms=5%',
        'Nearest-rank convention.',
      ],
      [
        'API backlog',
        '12,000/min=200/sec; arrival 250/sec; 10 min=600 sec; 50×600=30,000',
        'Requests accumulate when arrivals exceed capacity.',
      ],
      [
        'Human backlog',
        '15 analysts×20/day=300/day; 500 alerts−300=200/day; 3 days=600',
        'API capacity does not resolve human queues.',
      ],
      [
        'Coverage and cost',
        'N=1000, defer 100: coverage=.9; model $500+100×$3=$800; per request $.80',
        'All requests share the total cost denominator.',
      ],
      [
        'Correct outputs',
        'Auto 800 correct of 900; manual 100 correct: 900 total; cost/correct=800/900≈$.889; auto accuracy=800/900≈88.9%',
        'Manual perfection is an explicit classroom assumption.',
      ],
      [
        'Availability',
        '30×24×60=43,200 min; downtime 90: 1−90/43,200≈99.7917%',
        'Observed availability.',
      ],
      [
        'SLO budget',
        '99.9% target allows 43.2 min; excess 90−43.2=46.8 min',
        'The target was missed.',
      ],
    ],
    interpretation:
      'Financial processing quality depends on deadlines, queue capacity, reviewed outcomes, cost and availability together. A fast model can still overload reviewers or defer too much work.',
    comparison:
      'Report tail latency alongside the mean, selected automatic accuracy alongside coverage, and cost per correct output alongside cost per request. No single operational score captures the full financial workflow.',
    boundaries:
      'Zero requests/correct outcomes/scheduled time makes the respective ratio undefined. The simple backlog model assumes fixed rates and starts without backlog. Percentiles require a quantile convention; manual outcomes and downtime definitions must be audited rather than assumed.',
    mechanismChecks: [
      c(
        'Why can mean latency hide an operational failure?',
        'A small slow tail can breach deadlines despite a low mean.',
        'Percentiles and deadline failures expose behavior hidden by the average.',
        'Mean latency is always identical to p99.|A mean averages every request, while p99 identifies a high ranked latency; a long tail can make them very different.',
        'Latency measures throughput automatically.|Latency is per-request time; throughput is completed work per unit time and needs its own count and window.',
      ),
      c(
        'What denominator belongs to cost per correct output?',
        'Correct automatic plus correct manual outcomes',
        'All request costs are spread over confirmed correct outputs, not merely calls or automatic cases.',
        'All requests regardless of correctness|Dividing by all requests computes cost per request, which can conceal expensive failures or deferrals.',
        'Only human reviewers|Reviewer count is a staffing denominator, not the number of correct outputs obtained.',
      ),
      c(
        'How is monthly downtime allowance calculated?',
        'Scheduled time times one minus the target availability',
        'The allowance is the target’s unavailable fraction in minutes.',
        'Observed downtime times target availability|Observed downtime is measured after the fact; the allowance is the month’s minutes multiplied by 1−target availability.',
        'Mean latency times request volume|Latency times request volume is not the time budget allowed by an availability target.',
      ),
    ],
    calculations: [
      c(
        '95 requests take 40 ms,4 take 180 ms,1 takes 1000 ms. What is mean latency?',
        '55.2 ms',
        '(95×40+4×180+1000)/100=5520/100=55.2 ms.',
        '40 ms|This is p95 under nearest rank, not the mean.',
        '406.67 ms|This averages groups without weighting counts.',
      ),
      c(
        'Arrival 250/sec, capacity 200/sec for 600 sec. What new backlog accumulates?',
        '30,000 requests',
        'max(250−200,0)×600=50×600=30,000.',
        '50 requests|This is excess rate, not backlog.',
        '150,000 requests|This ignores completed capacity.',
      ),
      c(
        'Model spend $500 plus 100 reviews at $3 produces 900 correct outputs. What is cost per correct?',
        'About $0.889',
        'Total=$800; 800/900≈$.8889 per correct output.',
        '$0.80|This is per request when N=1000.',
        '$0.556|This ignores review spend.',
      ),
    ],
    applications: [
      c(
        'Automatic accuracy rises after more difficult requests are deferred. What else must be reported?',
        'Automatic coverage, review load and end-to-end correct outcomes',
        'Selection can improve conditional accuracy while shifting cost and work to humans.',
        'Only automatic accuracy|Reporting only the easier retained cases’ accuracy hides the fraction deferred and the cost of reviewing them.',
        'A claim that every request now succeeds|Deferral is not completed success; the remaining requests require a stated review and correctness outcome.',
      ),
      c(
        'The API has spare capacity but alerts exceed analysts’ daily capacity. What follows?',
        'Human review backlog can still grow.',
        '15×20=300 cases/day cannot clear 500 new daily alerts.',
        'API throughput guarantees all financial tasks finish.|Machine capacity cannot process the human decisions faster than analysts’ own service capacity.',
        'Latency alone removes the review queue.|Fast API responses do not remove the excess alerts waiting for human review.',
      ),
      c(
        'Availability is 99.7917% against a 99.9% target. What is the interpretation?',
        'The observed service misses the target despite high uptime.',
        '90 min downtime exceeds 43.2 min allowance in a 43,200 min month.',
        'The target is met because both round to 99%.|Rounding both values to whole percent hides the 0.1083 percentage-point shortfall from the 99.9% target.',
        'Availability equals automatic coverage.|Availability measures service uptime; automatic coverage measures the share handled without deferral.',
      ),
    ],
  },
];
