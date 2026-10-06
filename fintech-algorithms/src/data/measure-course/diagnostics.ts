import { c, f, type MeasureSeed } from './authoring';
const basic = ['notation', 'probability', 'data-splits'];
const forecastingTerms: MeasureSeed['terms'] = [
  [
    'Actual value y',
    'The subsequently observed financial quantity.',
    'Settlement outflow of $10 thousand.',
  ],
  [
    'Prediction ŷ',
    'The value forecast before the outcome is known.',
    'Forecast outflow of $12 thousand.',
  ],
  [
    'Error',
    'Prediction minus actual under the convention used here.',
    '12−10=+2 thousand means overprediction.',
  ],
];
export const diagnosticSeeds: MeasureSeed[] = [
  {
    number: 20,
    slug: 'mean-absolute-error',
    title: 'Mean Absolute Error',
    definition: 'MAE is the average size of forecast errors, ignoring their sign.',
    precise: 'MAE=(1/n)Σ|ŷ_i−y_i|, in the same units as the forecast target.',
    prerequisites: basic,
    terms: forecastingTerms,
    mechanics: [
      'Subtract actual from predicted for each held-out time period. Absolute value makes overprediction and underprediction count positively.',
      'Sum absolute errors and divide by the number of evaluated periods. Do not take the absolute value of the mean signed error; cancellation would hide misses.',
      'MAE is nonnegative and lower is better. It has target units: thousand-dollar inputs give thousand-dollar MAE. Chronological evaluation prevents using future settlement data.',
    ],
    formulas: [
      f(
        'MAE=\\frac1n\\sum_i|\\hat y_i-y_i|,\\quad Reduction=\\frac{MAE_{base}-MAE_{model}}{MAE_{base}}',
        'The absolute-error average gives typical error magnitude. Divide improvement by baseline MAE to express relative reduction, when baseline error is positive.',
        ['n', 'Evaluated forecast count.'],
        ['\\hat y_i', 'Forecast target value.'],
        ['y_i', 'Observed target value.'],
        ['MAE_{base}', 'Baseline absolute-error mean.'],
        ['MAE_{model}', 'Candidate absolute-error mean.'],
      ),
    ],
    trace: [
      [
        'Forecast 1',
        'Actual=10, forecast=12: error=2; |error|=2',
        'Overprediction of $2 thousand.',
      ],
      [
        'Forecast 2',
        'Actual=20, forecast=18: error=−2; |error|=2',
        'Underprediction of $2 thousand.',
      ],
      ['Average', '(2+2)/2=2 thousand=$2,000', 'Signs do not cancel.'],
      ['Baseline comparison', 'Baseline MAE=4: (4−2)/4=0.50', '50% lower MAE on the same periods.'],
    ],
    interpretation:
      'A $2,000 MAE describes average forecast miss size, not guaranteed reserve adequacy or the maximum loss.',
    comparison:
      'RMSE emphasizes large misses more. Pinball loss can encode asymmetric underforecasting penalties when underfunding liquidity is more costly.',
    boundaries:
      'n=0 makes MAE undefined. A zero-error baseline makes relative reduction undefined. Equal MAE can conceal opposite signed biases and different tail risk.',
    mechanismChecks: [
      c(
        'Which operation prevents signed forecast errors from cancelling?',
        'Take absolute value before averaging.',
        'Magnitude is calculated per period; +2 and −2 each contribute two.',
        'Average signed errors then take absolute value.|Averaging first lets +2 and −2 cancel to zero, concealing two real misses.',
        'Divide by the number of defaults.|Default count is a classification population, not the number of evaluated forecasts.',
      ),
      c(
        'What denominator does MAE use?',
        'Number of evaluated forecast observations',
        'Each period contributes one absolute error.',
        'Total outflow dollars|Dividing by outflow dollars would create a relative error ratio, rather than MAE in target units.',
        'Only periods with underprediction|Dropping overpredictions changes the evaluation population and hides part of the absolute error.',
      ),
      c(
        'Forecasts are in thousands of dollars. What are MAE units?',
        'Thousands of dollars',
        'Absolute difference and averaging preserve target units.',
        'Squared dollars|Squared units belong to squared-error quantities; absolute error does not square dollars.',
        'A unitless percentage|A percentage needs an explicit monetary denominator; MAE only divides by observation count.',
      ),
    ],
    calculations: [
      c(
        'Errors are +2 and −2 thousand dollars. What is MAE?',
        '2 thousand dollars',
        '(|2|+|−2|)/2=2.',
        '0|Signed errors would cancel.',
        '4|This is the absolute-error sum.',
      ),
      c(
        'Absolute errors are 1,2,6 dollars. What is MAE?',
        '$3',
        '(1+2+6)/3=9/3=$3.',
        '$9|This is the sum.',
        '$6|This is the largest miss.',
      ),
      c(
        'Baseline MAE=4 and model MAE=2. What is relative reduction?',
        '50%',
        '(4−2)/4=0.5.',
        '100%|This divides improvement by the model instead.',
        '2%|Two is the absolute improvement in target units.',
      ),
    ],
    applications: [
      c(
        'Does MAE=$2,000 imply every day is within $2,000 of actual outflow?',
        'No; it is an average error magnitude.',
        'Individual misses can be much larger or smaller than the mean.',
        'Yes; MAE is a maximum bound.|An average is not the largest observation, so a single daily miss can exceed MAE.',
        'Yes; MAE is a guaranteed prediction interval.|MAE supplies neither interval endpoints nor a coverage probability.',
      ),
      c(
        'Liquidity shortages cost more than overfunding. What should accompany MAE?',
        'An asymmetric loss and interval/tail assessment',
        'MAE weights equal-size under- and overprediction equally.',
        'Only signed cancellation|Signed cancellation can hide both shortages and surplus funding; it cannot encode their unequal costs.',
        'Only training accuracy|A training score does not measure held-out liquidity shortages or their financial consequences.',
      ),
      c(
        'Why compare forecast models on the same later periods?',
        'To keep horizon, scale and market conditions comparable.',
        'Chronological held-out evaluation is required for a meaningful future-outflow comparison.',
        'To let the model train on future labels|Training on future labels leaks outcomes that would be unavailable when making the forecast.',
        'Because MAE is independent of target scale|Changing dollars to thousands changes MAE by a factor of 1,000; scale must be held comparable.',
      ),
    ],
  },
  {
    number: 21,
    slug: 'root-mean-squared-error',
    title: 'Root Mean Squared Error',
    definition: 'RMSE summarizes forecast miss size while placing extra emphasis on large errors.',
    precise: 'RMSE=√[(1/n)Σe_i²], with e_i=ŷ_i−y_i; the square root restores the target’s units.',
    prerequisites: ['notation', 'variance', 'data-splits'],
    terms: [
      ['Squared error', 'An error multiplied by itself.', 'A −6 error contributes 36.'],
      [
        'Mean squared error',
        'The average of squared errors.',
        'One squared miss 36 over four days gives MSE=9.',
      ],
      ['Root mean squared error', 'The square root of MSE.', '√9=3 in original target units.'],
    ],
    mechanics: [
      'Square each signed error, average the squares, then take a square root. Square-rooting each contribution before averaging would instead produce MAE.',
      'Large misses grow quadratically inside the average: a six-unit miss contributes nine times the squared penalty of a two-unit miss.',
      'RMSE is nonnegative with target units and lower preferred. On the same errors RMSE≥MAE, but rankings of models can differ.',
    ],
    formulas: [
      f(
        'RMSE=\\sqrt{\\frac1n\\sum_ie_i^2},\\quad e_i=\\hat y_i-y_i',
        'The order is square, average, root. MSE has squared target units; the final root converts back to dollars or thousands.',
        ['n', 'Forecast observations.'],
        ['e_i', 'Signed forecast error.'],
        ['\\hat y_i', 'Predicted financial quantity.'],
        ['y_i', 'Actual financial quantity.'],
      ),
    ],
    trace: [
      ['Model A', 'Errors [2,2,2,2]: squares [4,4,4,4]', 'Consistent small misses.'],
      ['A summary', 'MAE=8/4=2; RMSE=√(16/4)=2', 'Equal magnitudes give equal scores.'],
      ['Model B', 'Errors [0,0,0,−6]: MAE=6/4=1.5', 'Lower average absolute error.'],
      ['B RMSE', '√(36/4)=3', 'One big shortage reverses the RMSE ranking.'],
    ],
    interpretation:
      'A settlement team concerned about large liquidity shortages may reject B despite its better MAE; both summaries explain different aspects.',
    comparison:
      'Use MAE for typical absolute miss size and RMSE for sensitivity to larger misses. Neither distinguishes shortage direction by itself.',
    boundaries:
      'n=0 is undefined. Outliers and bad data can dominate squared errors. Compare models in identical units and horizons; RMSE alone supplies no shortage probability.',
    mechanismChecks: [
      c(
        'What is RMSE’s calculation order?',
        'Square errors, average them, then take the square root.',
        'Changing this order changes the measure.',
        'Take a root before squaring|A signed negative error has no real square root; rooting before squaring also fails to form mean squared error.',
        'Average signed errors then square|Signed averaging lets positive and negative misses cancel before their magnitudes are penalized.',
      ),
      c(
        'Why do large errors matter more?',
        'Their contribution grows with the square of magnitude.',
        'Six squared is 36; two squared is four.',
        'The denominator counts large errors twice.|Every observation counts once in the denominator; extra sensitivity comes from squaring its magnitude.',
        'RMSE removes large errors.|All errors remain in the average; large errors receive more influence rather than being discarded.',
      ),
      c(
        'What are RMSE units?',
        'The same as the forecast target',
        'The final square root restores original units.',
        'Squared target units|MSE has squared target units, but RMSE takes the root and returns to the original units.',
        'Always percent|Dollar forecasts produce dollar RMSE; a percentage requires a separately defined normalization.',
      ),
    ],
    calculations: [
      c(
        'Errors [2,2,2,2]. What is RMSE?',
        '2',
        '√((4+4+4+4)/4)=√4=2.',
        '4|This is MSE.',
        '8|This is the absolute-error sum.',
      ),
      c(
        'Errors [0,0,0,−6]. What is RMSE?',
        '3',
        '√(36/4)=√9=3.',
        '1.5|This is MAE.',
        '9|This is MSE.',
      ),
      c(
        'MSE is 25 square dollars. What is RMSE?',
        '$5',
        '√25=$5 in restored dollar units.',
        '$25|The root is missing.',
        '$625|Squaring again is incorrect.',
      ),
    ],
    applications: [
      c(
        'A has MAE=2, RMSE=2; B has MAE=1.5, RMSE=3. Which interpretation fits?',
        'B has fewer typical misses but a damaging large miss.',
        'RMSE penalizes B’s isolated big error strongly.',
        'B is better under every possible loss.|Model B loses under squared-error loss even though it wins under absolute-error loss; preferences depend on the loss.',
        'The data must be invalid because rankings differ.|MAE and RMSE emphasize different error patterns, so different rankings are mathematically valid.',
      ),
      c(
        'Can RMSE alone tell whether a large miss underfunded or overfunded liquidity?',
        'No; squaring removes the sign.',
        'Inspect signed errors and asymmetric losses for direction.',
        'Yes; RMSE is always an underprediction measure.|RMSE penalizes both underprediction and overprediction through their squared magnitudes.',
        'Yes; the square root restores the sign.|The root restores units, but it cannot recover the signs removed by squaring.',
      ),
      c(
        'What should be checked before interpreting a sudden RMSE jump?',
        'Large residuals, units and possible data errors',
        'A few outliers or scale changes can dominate the squared-error average.',
        'Only the chart title|A chart title cannot reveal which large errors, unit changes, or bad records drove the squared-error increase.',
        'Only model training time|Training duration does not identify unusually large residuals or a changed monetary scale.',
      ),
    ],
  },
  {
    number: 22,
    slug: 'mape-wape-mase',
    title: 'MAPE, WAPE, MASE',
    definition:
      'These measures compare forecast errors on relative scales: MAPE uses each actual value, WAPE uses total actual magnitude, and MASE uses a historical naive-error scale.',
    precise:
      'MAPE=mean(|e_i|/|y_i|); WAPE=Σ|e_i|/Σ|y_i|; MASE=MAE_test/MAE_naive, train with the course’s nonseasonal lag-one training scale.',
    prerequisites: ['notation', 'data-splits', 'leakage'],
    terms: [
      [
        'MAPE',
        'The equal-observation mean of absolute percentage errors.',
        'A two-unit error on ten has a 20% relative error.',
      ],
      [
        'WAPE',
        'Total absolute error divided by total absolute actual magnitude.',
        'Four units of error over thirty units actual.',
      ],
      [
        'MASE',
        'Test MAE divided by naive training-series MAE.',
        'Two units test MAE / five units naive error =0.4.',
      ],
      [
        'Naive scale',
        'Average absolute historical lag-one change, computed on training data.',
        'History [5,10,15] has five-unit changes.',
      ],
    ],
    mechanics: [
      'MAPE divides before averaging. WAPE sums before dividing; large actual periods receive more weight in WAPE than in MAPE.',
      'For MASE compute mean |x_t−x_(t−1)| using training history only, then divide held-out MAE by this scale. A seasonal version would require a stated seasonal lag.',
      'All are unitless; MAPE and WAPE often display percentages and have no finite upper bound. MASE<1 beats the historical naive-error scale, but does not replace a held-out baseline comparison.',
    ],
    formulas: [
      f(
        'MAPE=\\frac1n\\sum_i\\frac{|e_i|}{|y_i|},\\quad WAPE=\\frac{\\sum_i|e_i|}{\\sum_i|y_i|}',
        'Absolute actual values supply the relative scales. Per-observation division in MAPE and aggregate division in WAPE are different operations.',
        ['n', 'Held-out observations.'],
        ['e_i', 'Forecast minus actual.'],
        ['y_i', 'Actual target quantity.'],
      ),
      f(
        'd_{train}=\\frac1{T-1}\\sum_{t=2}^{T}|x_t-x_{t-1}|,\\quad MASE=MAE_{test}/d_{train}',
        'Lag-one naive errors are computed entirely from the training series. Both numerator and denominator have target units, which cancel.',
        ['T', 'Training observations.'],
        ['x_t', 'Training target at time t.'],
        ['d_{train}', 'Naive training MAE scale.'],
        ['MAE_{test}', 'Held-out absolute forecast error mean.'],
      ),
    ],
    trace: [
      [
        'Actual and prediction',
        'Actual [10,20]; forecast [12,18]; |errors|=[2,2]',
        'Use the same held-out periods.',
      ],
      ['MAPE', '(2/10+2/20)/2=(0.20+0.10)/2=0.15', '15% equal-period average.'],
      ['WAPE', '(2+2)/(10+20)=4/30≈0.1333', '13.33% aggregate error scale.'],
      ['Training scale', 'History [5,10,15]: (5+5)/2=5', 'Training-only naive scale.'],
      ['MASE', 'Test MAE=2; 2/5=0.4', 'Below the naive training scale.'],
    ],
    interpretation:
      'Relative errors permit some cross-scale comparison, but denominator choice decides which periods matter. Small or zero outflows can destabilize percentage measures.',
    comparison:
      'MAPE gives a small actual period large influence; WAPE emphasizes high-volume periods. MASE uses a training baseline rather than actual held-out values as its scale.',
    boundaries:
      'A zero y makes its MAPE term undefined. Zero total absolute actual makes WAPE undefined. Fewer than two training observations or zero naive scale makes nonseasonal MASE undefined. Do not silently drop zero periods.',
    mechanismChecks: [
      c(
        'How do MAPE and WAPE differ?',
        'MAPE averages per-period ratios; WAPE divides aggregate totals.',
        'Aggregation order changes the weighting of low- and high-volume periods.',
        'They always have identical values.|The worked example gives MAPE 15% and WAPE 13.33% because per-period division and aggregate division weight periods differently.',
        'WAPE measures signed bias.|WAPE uses absolute errors, so overprediction and underprediction do not retain their signs.',
      ),
      c(
        'Which data supplies the MASE scale?',
        'Training-history naive forecast errors',
        'Using future test outcomes to tune the scale leaks evaluation information.',
        'The test set’s best possible predictions|Perfect test predictions would supply an artificial zero error scale rather than the stated historical naive baseline.',
        'Only the model’s current errors|Using the candidate model’s own errors as its scale would not compare it with historical naive forecasting.',
      ),
      c(
        'What does MASE<1 mean under this convention?',
        'Test MAE is below the naive training-error scale.',
        'MASE is a ratio to the stated historical scale, not a probability or guarantee.',
        'MAPE is necessarily below 1%.|MASE uses a naive-error denominator; it imposes no particular percentage on MAPE’s actual-value denominator.',
        'Every forecast beats the naive prediction individually.|A lower average scaled error does not imply the candidate wins in every individual period.',
      ),
    ],
    calculations: [
      c(
        'Actuals [10,20], absolute errors [2,2]. What is MAPE?',
        '15%',
        '(2/10+2/20)/2=(20%+10%)/2=15%.',
        '13.33%|This is WAPE.',
        '20%|This ignores the second period.',
      ),
      c(
        'Actuals [10,20], absolute errors [2,2]. What is WAPE?',
        '13.33%',
        '4/30≈0.1333.',
        '15%|This is MAPE.',
        '30%|This uses the wrong error sum.',
      ),
      c(
        'Test MAE=2 and naive training scale=5. What is MASE?',
        '0.4',
        '2/5=0.4.',
        '2.5|The ratio is reversed.',
        '3|This subtracts instead of dividing.',
      ),
    ],
    applications: [
      c(
        'Several actual settlement outflows are zero. What is a problem for MAPE?',
        'Division by zero in those periods',
        'An error percentage cannot be normalized by zero actual magnitude without a stated alternative.',
        'MAPE becomes perfectly accurate automatically.|Zero actual outflow makes the percentage denominator zero; it does not erase a nonzero forecast miss.',
        'MAPE is then equal to MAE.|MAE averages unscaled absolute errors, whereas MAPE requires each nonzero actual magnitude as its scale.',
      ),
      c(
        'High-volume days matter most economically. Which contrast helps?',
        'WAPE weights aggregate volume more than equal-period MAPE.',
        'Inspect both and a monetary loss; weighting changes the business interpretation.',
        'MAPE necessarily ignores small periods.|MAPE can give a small actual period substantial influence because its error is divided by that small amount.',
        'MASE measures dollar profit directly.|MASE is a dimensionless error ratio, not a monetary profit calculation.',
      ),
      c(
        'A training series is constant, so naive error scale is zero. What happens to MASE?',
        'It is undefined under the stated ratio.',
        'Dividing test MAE by zero supplies no finite comparable scaled error.',
        'It is automatically zero.|A zero denominator cannot turn a nonzero error ratio into zero; zero divided by zero is undefined too.',
        'It must equal one.|A ratio equals one only when its positive numerator and denominator match, not when the denominator is zero.',
      ),
    ],
  },
  {
    number: 23,
    slug: 'r',
    title: 'R²',
    definition:
      'R² compares forecast squared error with the squared variation around the evaluated actual mean.',
    precise:
      'R²=1−SSE/SST, where SSE=Σ(y_i−ŷ_i)² and SST=Σ(y_i−ȳ)² on the same evaluation observations.',
    prerequisites: ['notation', 'variance', 'data-splits'],
    terms: [
      ['SSE', 'Sum of squared prediction residuals.', 'Errors 2 and −2 give SSE=8.'],
      [
        'SST',
        'Sum of squared actual deviations from their evaluated mean.',
        'Actuals 10,20 have mean 15 and SST=50.',
      ],
      [
        'Mean reference',
        'Predict the evaluated sample mean for the comparison in the R² definition.',
        'The constant reference is 15, not a deployable future estimate.',
      ],
    ],
    mechanics: [
      'Compute the actual mean and SST, then independently compute prediction SSE. Divide SSE by SST and subtract from one.',
      'R² is unitless and no larger than one, but can be negative. Zero matches the evaluated-mean squared-error reference; negative is worse than that reference.',
      'The evaluated mean is a statistical comparison inside this metric; it should not be presented as a forecast available before future outcomes.',
    ],
    formulas: [
      f(
        '\\bar y=\\frac1n\\sum_i y_i,\\quad R^2=1-\\frac{\\sum_i(y_i-\\hat y_i)^2}{\\sum_i(y_i-\\bar y)^2}',
        'The numerator measures model error, the denominator actual variation around the sample mean. Both have squared target units, which cancel.',
        ['n', 'Evaluation observations.'],
        ['y_i', 'Actual financial quantity.'],
        ['\\hat y_i', 'Forecast financial quantity.'],
        ['\\bar y', 'Mean actual value over evaluation observations.'],
      ),
    ],
    trace: [
      ['Actual mean', '(10+20)/2=15', 'Reference value for SST.'],
      ['SST', '(10−15)²+(20−15)²=25+25=50', 'Actual variation.'],
      ['SSE', 'Forecasts 12,18: (10−12)²+(20−18)²=4+4=8', 'Prediction error.'],
      ['R²', '1−8/50=0.84', '84% reduction against that mean reference.'],
    ],
    interpretation:
      'R²=0.84 says squared error is much lower than the evaluated-mean reference in this sample. It does not mean 84% of future forecasts are correct.',
    comparison:
      'MAE and RMSE retain monetary units; R² is relative to sample variance. A model can have high R² and still produce economically unacceptable errors.',
    boundaries:
      'Constant actual values give SST=0 and raw R² is undefined; some libraries apply finite-value substitutions that must be stated. Negative R² is valid out of sample, not a percentage to clip silently.',
    mechanismChecks: [
      c(
        'What does R² compare?',
        'Model SSE with actual variation around the evaluation mean',
        'It measures relative squared-error reduction, not class accuracy.',
        'The fraction of correct class labels|Counting correct class labels defines a classification score; R² compares numerical squared errors with target variation.',
        'Only forecast probabilities|Forecast probabilities alone provide neither numerical residuals nor actual variation around the evaluated mean.',
      ),
      c(
        'What is the denominator SST?',
        'Sum of squared actual deviations from their mean',
        'SST describes target variation, not the model’s residuals.',
        'Sum of absolute model errors|Absolute model errors belong to MAE’s numerator; SST squares actual deviations from their own mean.',
        'Total dollars forecast|Adding forecast dollars does not measure variation around actual values’ mean and has the wrong units for SST.',
      ),
      c(
        'Can R² be negative?',
        'Yes, when model SSE exceeds SST.',
        'A poor model can be worse than the evaluated-mean reference.',
        'No; every squared quantity makes R² nonnegative.|Both sums are nonnegative, but subtracting an error ratio greater than one produces a negative R².',
        'No; it is always a probability.|R² is a relative error reduction, not a probability, so its lower bound is not zero.',
      ),
    ],
    calculations: [
      c(
        'SSE=8 and SST=50. What is R²?',
        '0.84',
        '1−8/50=1−0.16=0.84.',
        '0.16|This is the error fraction, not R².',
        '6.25|This reverses the ratio.',
      ),
      c(
        'SSE=150 and SST=100. What is R²?',
        '−0.5',
        '1−150/100=1−1.5=−0.5.',
        '0.5|The sign is lost.',
        '1.5|This is SSE/SST.',
      ),
      c(
        'Actuals are 10 and 20. What is SST?',
        '50',
        'Mean 15; (10−15)²+(20−15)²=25+25=50.',
        '30|This is the sum of actuals.',
        '200|This uses zero rather than the mean.',
      ),
    ],
    applications: [
      c(
        'Does R²=0.84 imply 84% of forecasts are exactly correct?',
        'No; it describes relative squared-error reduction.',
        'The metric compares errors with variation, not counts of exact matches.',
        'Yes; R² is forecast accuracy.|An 84% squared-error reduction counts neither exact matches nor correct class labels.',
        'Yes; it is coverage.|Coverage counts outcomes inside forecast intervals; R² contains no interval endpoints.',
      ),
      c(
        'Why pair R² with MAE/RMSE in liquidity forecasting?',
        'Monetary error size still matters even when relative fit is good.',
        'R² is unitless; operational reserves are in dollars.',
        'Because R² already determines worst-case loss|R² averages squared residuals relative to variation and supplies no bound on the largest individual loss.',
        'Because MAE proves causation|MAE describes error magnitude; neither it nor R² identifies a causal financial effect.',
      ),
      c(
        'All actual values are identical. What is the raw R² issue?',
        'SST=0, so the formula is undefined.',
        'No actual variation exists to normalize squared errors.',
        'R² must be one regardless of forecasts.|Identical actual values give SST zero, so even perfect predictions produce a raw zero-over-zero ratio.',
        'R² is always zero by mathematics.|Some software substitutes finite values for this case, but ordinary division by zero does not establish R²=0.',
      ),
    ],
  },
  {
    number: 24,
    slug: 'prediction-interval-coverage-and-width',
    title: 'Prediction-Interval Coverage and Width',
    definition:
      'Coverage measures how often a forecast band contains the actual outcome; width measures how broad that band is.',
    precise: 'Coverage=mean 1[L_i≤y_i≤U_i] with inclusive boundaries; mean width=mean(U_i−L_i).',
    prerequisites: basic,
    terms: [
      [
        'Prediction interval',
        'A forecast band for a future observation.',
        'Outflow forecast band [9,11] thousand dollars.',
      ],
      [
        'Coverage indicator',
        'One when actual lies inside or on the stated band, zero otherwise.',
        'Actual 10 lies in [9,11].',
      ],
      [
        'Nominal coverage',
        'The intended probability level used to construct the interval.',
        'A model may target 90%, then empirical coverage is checked.',
      ],
      ['Width', 'Upper endpoint minus lower endpoint.', '11−9=2 thousand dollars.'],
    ],
    mechanics: [
      'For each held-out period compare the realized quantity against both endpoints, counting equality as covered in this course.',
      'Average binary coverage indicators across periods. Separately average numeric widths; do not confuse a fraction with a dollar span.',
      'Coverage lies in [0,1]; widths are nonnegative target-unit quantities for ordered bands. Coverage should be compared with its nominal target; smaller width is useful only when adequate coverage is maintained. Wider bands often improve coverage at the expense of useful precision.',
    ],
    formulas: [
      f(
        'Coverage=\\frac1n\\sum_i\\mathbf1[L_i\\le y_i\\le U_i],\\quad Width=\\frac1n\\sum_i(U_i-L_i)',
        'The indicator supplies a count fraction. Width subtracts endpoints in target units. A useful evaluation reports both instead of maximizing coverage without restraint.',
        ['n', 'Evaluated intervals.'],
        ['L_i', 'Lower target-unit endpoint.'],
        ['U_i', 'Upper target-unit endpoint.'],
        ['y_i', 'Observed future target.'],
      ),
    ],
    trace: [
      ['Period 1', '[9,11], actual 10: covered 1; width 2', 'In-band outflow.'],
      ['Period 2', '[19,21], actual 22: covered 0; width 2', 'Band misses the shortage.'],
      ['Period 3', '[25,29], actual 27: covered 1; width 4', 'Wider band.'],
      ['Summaries', 'Coverage=2/3≈66.7%; width=(2+2+4)/3=8/3', 'Different units and questions.'],
      [
        'Widen by 1 each side',
        'Widths 4,4,6; coverage 3/3=100%; mean 14/3',
        'Better coverage but broader reserve range.',
      ],
    ],
    interpretation:
      'Coverage tests whether bands capture realized outflows; width indicates the operational reserve uncertainty conveyed by those bands.',
    comparison:
      'A huge interval can cover every observed outcome and still be unhelpful. Compare against the nominal level, widths and out-of-sample conditions.',
    boundaries:
      'n=0 is undefined, and lower>upper indicates invalid input. Empirical 100% coverage on a small sample is not proof of guaranteed future coverage. Aggregate coverage can hide undercoverage in particular groups or market regimes.',
    mechanismChecks: [
      c(
        'What counts as covered under the course convention?',
        'An actual value between or equal to the endpoints',
        'Both inequalities are inclusive.',
        'Only values strictly inside the band|The stated boundaries are inclusive, so an actual value equal to either endpoint still counts as covered.',
        'Only actuals below the upper endpoint regardless of lower bound|Checking only the upper endpoint would incorrectly count an outcome below the lower endpoint as covered.',
      ),
      c(
        'What is the coverage denominator?',
        'Number of evaluated intervals',
        'Each interval contributes a binary success indicator.',
        'Sum of interval widths|Width is a target-unit span; summing widths cannot supply the observation count for a coverage fraction.',
        'Number of covered intervals only|Dividing by covered intervals alone would omit every miss and make any nonzero covered count appear perfect.',
      ),
      c(
        'How do the units differ?',
        'Coverage is a fraction; width has target units.',
        'Counts cancel in coverage; endpoint subtraction preserves dollar units.',
        'Both are probabilities|Coverage is a fraction, but width remains a distance in dollars or other target units.',
        'Both are dollar losses|Width can be measured in dollars, but coverage is a count fraction rather than a monetary loss.',
      ),
    ],
    calculations: [
      c(
        'Two of three intervals contain actuals. What is coverage?',
        '2/3≈66.7%',
        'Covered count divided by evaluated count is 2/3.',
        '1/3|This is the miss rate.',
        '2|This is a count.',
      ),
      c(
        'Widths are 2,2,4 thousand dollars. What is average width?',
        '8/3 thousand dollars',
        '(2+2+4)/3=8/3.',
        '8 thousand dollars|This is the sum.',
        '2/3|This is not a width.',
      ),
      c(
        'Band [10,20] contains actual 20. What is its coverage indicator?',
        '1',
        '10≤20≤20 is true under inclusive boundaries.',
        '0|This wrongly excludes equality.',
        '10|This is width, not coverage.',
      ),
    ],
    applications: [
      c(
        'A band achieves 100% coverage by becoming extremely wide. What should be judged?',
        'Its width and operational usefulness alongside coverage',
        'Coverage alone rewards uninformatively broad bands.',
        'Only coverage because width is irrelevant|Extremely wide bands can contain nearly everything while providing little useful guidance for reserve planning.',
        'Whether the target is now certain|Containing the observed sample does not make the future financial quantity certain.',
      ),
      c(
        'Nominal 90% intervals achieve 70% empirical coverage. What concern arises?',
        'Potential undercoverage requiring validation and recalibration',
        'A target probability must be checked against realized held-out outcomes.',
        'The bands are certainly too wide.|Empirical coverage below the nominal target suggests undercoverage; wider bands generally increase containment.',
        'MAE must be zero.|Interval misses do not imply point forecasts have zero absolute error; interval and point scores answer different questions.',
      ),
      c(
        'Does a small sample’s perfect coverage guarantee future outflows remain inside?',
        'No; empirical coverage has sampling and distribution uncertainty.',
        'Market conditions and limited data can change future coverage.',
        'Yes; perfect sample coverage is a mathematical guarantee.|Perfect coverage on a small held-out sample is evidence with sampling uncertainty, not a future mathematical guarantee.',
        'Yes; every band is a hard reserve limit.|A prediction band is a probabilistic forecast, not a hard physical limit on possible outflows.',
      ),
    ],
  },
  {
    number: 25,
    slug: 'pinball-loss',
    title: 'Pinball Loss',
    definition:
      'Pinball loss evaluates a quantile forecast with asymmetric penalties for under- and overprediction.',
    precise:
      'For 0<τ<1, loss is τ(y−q) when y≥q and (1−τ)(q−y) when y<q; average losses over observations.',
    prerequisites: basic,
    terms: [
      [
        'Quantile level τ',
        'The target cumulative fraction for the forecast.',
        'τ=0.9 targets a 90 th-percentile outflow.',
      ],
      ['Underforecast', 'Actual exceeds the quantile forecast.', 'Actual 30 versus forecast 20.'],
      ['Overforecast', 'Forecast exceeds actual.', 'Forecast 20 versus actual 10.'],
    ],
    mechanics: [
      'Choose τ from the desired forecast quantile, then check which side of q the actual lies.',
      'Multiply underforecast magnitude by τ; multiply overforecast magnitude by 1−τ. At equality both losses are zero.',
      'Loss is nonnegative with target units, lower preferred at fixed τ. Comparing different τ without context changes the objective; τ=0.5 yields half absolute error.',
    ],
    formulas: [
      f(
        'L_\\tau(y,q)=\\begin{cases}\\tau(y-q)&y\\ge q\\\\(1-\\tau)(q-y)&y<q\\end{cases}',
        'The branch prevents negative penalties and gives a high quantile stronger underforecast penalties. The factors are unitless and preserve target units.',
        ['\\tau', 'Target quantile fraction.'],
        ['y', 'Observed target quantity.'],
        ['q', 'Forecast target quantile.'],
      ),
    ],
    trace: [
      ['Underforecast', 'τ=.9, q=20, y=30: .9×10=9', 'Large penalty for reserve shortage.'],
      ['Overforecast', 'τ=.9, q=20, y=10: .1×10=1', 'Smaller penalty for excess reserve.'],
      ['Equal outcome', 'y=q=20: loss 0', 'No quantile miss.'],
      ['Mean', '(9+1+0)/3=10/3', 'Average quantile loss in target units.'],
    ],
    interpretation:
      'A high outflow quantile can support conservative liquidity planning by prioritizing avoidance of underprediction under a stated loss objective.',
    comparison:
      'MAE penalizes equal-size misses equally; pinball differentiates their direction. It evaluates quantiles rather than demanding a mean forecast.',
    boundaries:
      'Use a fixed level strictly between zero and one for these lessons. No evaluated observations makes mean loss undefined. Low pinball loss does not by itself verify realized interval coverage or financial cost under a different loss model.',
    mechanismChecks: [
      c(
        'What determines the loss branch?',
        'Whether actual y is above or below forecast q',
        'The direction of the quantile miss selects τ or 1−τ.',
        'Only the sign of q|The branch depends on the residual y−q, so the actual outcome must be compared with the forecast.',
        'Only the class prevalence|Class prevalence concerns classification; the pinball branch uses the sign of the numerical forecast residual.',
      ),
      c(
        'At τ=0.9, which equal-size error costs more?',
        'Underforecasting',
        'Underforecast receives weight .9 versus .1 for overforecast.',
        'Overforecasting|At τ=0.9 an overforecast has weight 0.1, whereas the same-size underforecast has weight 0.9.',
        'They always cost the same|The two weights are equal only at τ=0.5, not for an upper quantile such as 0.9.',
      ),
      c(
        'What are pinball-loss units?',
        'The same target units as y and q',
        'Unitless quantile weights multiply target-unit differences.',
        'Probability percent only|The quantile level is unitless, but it multiplies a target-unit error, so loss retains the target units.',
        'Squared dollars|Pinball loss scales linearly with miss size; it does not square the monetary error.',
      ),
    ],
    calculations: [
      c(
        'τ=.9, q=20, y=30. What is pinball loss?',
        '9',
        'Actual is ten above q: .9×10=9.',
        '1|This uses the overforecast weight.',
        '−9|Loss is nonnegative.',
      ),
      c(
        'τ=.9, q=20, y=10. What is loss?',
        '1',
        'Actual is ten below q: (1−.9)×10=1.',
        '9|This uses the underforecast branch.',
        '10|This omits the weight.',
      ),
      c(
        'At τ=.95, equal under- and overforecast magnitudes are 10. What is the penalty ratio?',
        '19',
        'Under=9.5; over=.5; 9.5/.5=19.',
        '0.95|This is one weight, not the ratio.',
        '2|This is not the asymmetric ratio.',
      ),
    ],
    applications: [
      c(
        'Which forecast objective does pinball loss support?',
        'A specified quantile with asymmetric miss penalties',
        'High quantiles emphasize costly shortages in the stated teaching objective.',
        'Only the arithmetic mean|Expected squared error targets a conditional mean; pinball loss targets the conditional quantile selected by τ.',
        'Only binary classification|Pinball loss evaluates a numerical quantile forecast and does not require a binary class label.',
      ),
      c(
        'Why should model comparisons hold τ fixed?',
        'Different τ values encode different forecast objectives.',
        'A lower score at another quantile need not indicate improvement for the original policy.',
        'Because τ is measured in dollars|τ is a dimensionless quantile level; changing it changes asymmetric error weights rather than monetary units.',
        'Because all quantiles must equal the mean|Different quantiles can differ substantially from the mean, especially for skewed financial outflows.',
      ),
      c(
        'A forecast has small pinball loss. What still requires evaluation?',
        'Calibration/coverage and the actual decision costs',
        'One quantile scoring rule is not a full operational risk assessment.',
        'Nothing; shortage is impossible.|A small average asymmetric loss does not rule out individual liquidity shortages or extreme future misses.',
        'Nothing; all probability intervals are guaranteed.|One quantile-loss score does not establish the coverage of every forecast interval.',
      ),
    ],
  },
  {
    number: 26,
    slug: 'silhouette-score',
    title: 'Silhouette Score',
    definition:
      'Silhouette measures how much closer an observation is to its own cluster than to its nearest competing cluster.',
    precise:
      's_i=(b_i−a_i)/max(a_i, b_i), where a_i is mean within-cluster distance and b_i the smallest mean distance to another cluster; report the observation mean.',
    prerequisites: ['notation', 'vectors'],
    terms: [
      [
        'Within-cluster distance a',
        'Mean distance from a point to other points in its cluster.',
        'a=2 for one customer.',
      ],
      [
        'Nearest-cluster distance b',
        'Smallest mean distance to any other cluster.',
        'b=5 to the closest competing segment.',
      ],
      ['Silhouette coefficient', 'Normalized between-minus-within distance.', '(5−2)/5=0.6.'],
    ],
    mechanics: [
      'Use the same distance metric and feature scaling as the clustering analysis. Compute a excluding the point itself.',
      'For each other cluster average distances to its members; choose the smallest average as b. Divide b−a by the larger distance.',
      'Scores lie in [−1,1]. Positive means own-cluster cohesion, near zero means overlap, negative suggests a point is closer on average to another cluster. The mean is not financial utility.',
    ],
    formulas: [
      f(
        's_i=\\frac{b_i-a_i}{\\max(a_i,b_i)},\\quad \\bar s=\\frac1n\\sum_i s_i',
        'Distances share the same units, so normalization removes units. Average per-point coefficients rather than pooling all a and b values.',
        ['a_i', 'Mean distance to other own-cluster points.'],
        ['b_i', 'Nearest competing cluster’s mean distance.'],
        ['n', 'Scored observations.'],
        ['s_i', 'Observation silhouette.'],
      ),
    ],
    trace: [
      ['Customer 1', 'a=2, b=5: (5−2)/5=.6', 'Clearer separation.'],
      ['Customer 2', 'a=4, b=4: 0/4=0', 'Equal average proximity.'],
      ['Customer 3', 'a=6, b=3:(3−6)/6=−.5', 'Closer to another segment.'],
      ['Mean', '(.6+0−.5)/3≈.0333', 'Weak overall separation.'],
    ],
    interpretation:
      'Silhouette can diagnose whether behavior-based customer segments are geometrically distinct. It does not say whether those segments improve retention or lending decisions.',
    comparison:
      'Inertia measures compactness and tends to fall as K grows; silhouette also compares alternative-cluster separation. Results depend strongly on feature scaling and distance.',
    boundaries:
      'A single cluster gives no competing cluster for b. A singleton’s a is unavailable; the common software convention assigns silhouette 0. If a=b=0 the raw ratio is undefined. State conventions and avoid claiming all clustering shapes suit this metric.',
    mechanismChecks: [
      c(
        'What is b in silhouette?',
        'The smallest mean distance to a different cluster',
        'It is a cluster-average distance, not distance to just one closest point.',
        'Distance to the farthest individual point|b uses the smallest average distance to another cluster, not the farthest individual observation.',
        'The model’s financial profit|Financial profit is not a geometric distance between a point and another cluster’s members.',
      ),
      c(
        'What normalizes b−a?',
        'max(a, b)',
        'Using the larger distance bounds the coefficient when distances are valid.',
        'a+b|The denominator is max(a, b); using their sum defines a different normalized quantity.',
        'Number of clusters alone|The number of clusters alone does not normalize within-cluster and neighboring-cluster distances.',
      ),
      c(
        'What does a negative silhouette suggest?',
        'The point is closer on average to another cluster.',
        'b<a yields a negative coefficient.',
        'Perfectly separated customer groups|A negative score means a exceeds b, suggesting the point is closer on average to another cluster.',
        'Negative financial returns necessarily|Silhouette’s sign describes geometric separation; it is not the sign of a portfolio return.',
      ),
    ],
    calculations: [
      c(
        'a=2, b=5. What is silhouette?',
        '0.6',
        '(5−2)/max(2,5)=3/5=.6.',
        '1.5|This divides by a rather than max.',
        '3|This omits normalization.',
      ),
      c(
        'a=6, b=3. What is silhouette?',
        '−0.5',
        '(3−6)/6=−.5.',
        '0.5|The sign conveys overlap.',
        '−1|This divides by b.',
      ),
      c(
        'Scores are .6,0,−.5. What is mean silhouette?',
        'About 0.0333',
        '(.6+0−.5)/3=.1/3≈.0333.',
        '0.1|This is the sum.',
        '0.3667|This ignores the negative sign.',
      ),
    ],
    applications: [
      c(
        'A customer segmentation has high silhouette. What is supported?',
        'Geometric separation under the chosen features and distance',
        'Business usefulness requires separate validation.',
        'Guaranteed profitable targeting|Geometric separation does not measure campaign costs, customer response, or resulting profit.',
        'Proof that every group is a natural market category|Strong separation under chosen features does not prove that the clusters represent natural economic categories.',
      ),
      c(
        'Why standardize features before distance-based evaluation?',
        'A large-scale feature can dominate distances.',
        'Dollar balances can overpower small-rate features unless scaling is justified.',
        'To force every silhouette to one|Scaling makes feature distances comparable; it does not force within-cluster distances to zero or every score to one.',
        'To eliminate cluster membership|Standardization rescales features but preserves observations and their assigned membership for the evaluation.',
      ),
      c(
        'All points are assigned to one cluster. What is missing for silhouette?',
        'A competing cluster to define b',
        'Without another cluster, the comparison is unavailable.',
        'The forecast target mean|A target mean is a forecasting reference; silhouette needs an alternative cluster for its neighboring-distance comparison.',
        'The positive-class prevalence|Class prevalence belongs to classification and does not supply the missing second cluster.',
      ),
    ],
  },
  {
    number: 27,
    slug: 'inertia-and-stability',
    title: 'Inertia and Stability',
    definition:
      'Inertia measures cluster compactness; stability measures whether comparable clusterings retain similar group assignments.',
    precise:
      'K-means inertia is summed squared distance to assigned centroids. Here stability is adjusted Rand index (ARI), a chance-adjusted agreement of observation pairs between two clusterings.',
    prerequisites: ['notation', 'vectors', 'variance'],
    terms: [
      ['Centroid', 'The feature-wise mean of cluster members.', 'Mean of 1 and 2 is 1.5.'],
      ['Inertia', 'Total squared within-cluster distance.', 'Two tight pairs have inertia 1.'],
      [
        'Pair agreement',
        'Whether two observations share a cluster in both assignments.',
        'Two customers remain grouped after a rerun.',
      ],
      [
        'Adjusted Rand index',
        'Pair agreement normalized against expected random agreement.',
        'ARI0 means agreement at its chance reference.',
      ],
    ],
    mechanics: [
      'For inertia calculate centroids, square each member’s distance, and sum all observations. Feature units are squared; smaller inertia is compact, not automatically useful.',
      'Increasing K can only weakly reduce the optimal inertia; K=N can give zero. Use an elbow and operational segment needs rather than always selecting the lowest value.',
      'For ARI form a contingency table of shared memberships. Count within-cell pairs S, row pairs R, column pairs C and all pairs T. Correct for expected agreement RC/T. Higher ARI indicates stronger chance-adjusted membership agreement, with 1 for perfect agreement; a negative value is below the chance reference. Cluster label numbers themselves are irrelevant.',
    ],
    formulas: [
      f(
        'I_K=\\sum_{j=1}^K\\sum_{i\\in C_j}\\lVert x_i-\\mu_j\\rVert^2',
        'Each point contributes its squared distance to its assigned centroid. Summation makes inertia dependent on sample size and feature scale.',
        ['K', 'Number of clusters.'],
        ['C_j', 'Members of cluster j.'],
        ['x_i', 'Feature vector for observation i.'],
        ['\\mu_j', 'Mean feature vector for cluster j.'],
      ),
      f(
        'ARI=\\frac{S-RC/T}{(R+C)/2-RC/T},\\quad {n\\choose2}=n(n-1)/2',
        'S sums within-cell pair counts; R and C sum row and column pair counts. T counts all observation pairs. ARI is unitless, at most 1 and can be negative.',
        ['S', 'Sum of choose-two counts in contingency cells.'],
        ['R', 'Sum of choose-two counts of row totals.'],
        ['C', 'Sum of choose-two counts of column totals.'],
        ['T', 'Choose-two count of all observations.'],
        ['n', 'Count in the relevant group.'],
      ),
    ],
    trace: [
      ['One cluster', 'Values [1,2,8,9], mean 5: 16+9+9+16=50', 'Large within-cluster spread.'],
      [
        'Two clusters',
        'Means 1.5,8.5: four squared deviations .25 sum 1',
        'Much tighter grouping.',
      ],
      ['ARI overlap', 'Table [[2,1],[1,2]]; S=1+0+0+1=2', 'Same-cluster pairs in matching cells.'],
      [
        'Margins',
        'R=C=choose(3,2)+choose(3,2)=6; T=choose(6,2)=15',
        'Expected agreement=6×6/15=2.4.',
      ],
      ['ARI result', '(2−2.4)/(6−2.4)=−.4/3.6=−1/9', 'Below chance-reference agreement.'],
    ],
    interpretation:
      'Compact customer clusters can still change materially between seeds or samples. Inertia and stability answer different checks before using segments for financial treatment.',
    comparison:
      'A low-inertia solution may be unstable or merely use many clusters. ARI ignores label names and compares memberships on the same observations; do not compare unmatched customer sets directly.',
    boundaries:
      'Fewer than two shared observations makes pair calculations degenerate. ARI’s raw denominator can be zero for degenerate partitions; software conventions may set identical partitions to 1. Inertia across different samples or scaling is not directly comparable.',
    mechanismChecks: [
      c(
        'What does inertia aggregate?',
        'Squared point-to-assigned-centroid distances',
        'The result measures compactness in squared feature units.',
        'Probability of customer churn|Inertia sums geometric squared distances; it does not estimate a customer’s churn probability.',
        'Chance-adjusted membership agreement|Chance-adjusted membership agreement is ARI, the stability constituent, rather than inertia.',
      ),
      c(
        'Why does label renaming not change ARI?',
        'It compares observation-pair memberships, not cluster numbers.',
        'Cluster 1 and cluster 7 can describe the same customer group.',
        'ARI compares numeric cluster-label magnitudes.|ARI compares which observation pairs share groups, so the numerical magnitude of group labels is irrelevant.',
        'ARI depends only on centroid names.|ARI is computed from membership overlap counts, not centroid names or coordinates.',
      ),
      c(
        'What does ARI=0 indicate?',
        'Agreement at the chance reference under the adjustment',
        'It does not mean no pair is grouped together.',
        'Perfect membership agreement|Perfect agreement gives ARI=1; zero matches the chance reference used in the adjustment.',
        'Zero within-cluster distance|Zero geometric spread concerns inertia, while ARI=0 describes adjusted membership agreement.',
      ),
    ],
    calculations: [
      c(
        'Values 1,2 have centroid 1.5. What is their inertia?',
        '0.5',
        '(1−1.5)²+(2−1.5)²=.25+.25=.5.',
        '1|This sums absolute deviations.',
        '0|Different values have nonzero spread.',
      ),
      c(
        'Values 1,2,8,9 in two clusters [1,2],[8,9]. What is total inertia?',
        '1',
        'Each pair contributes .5, giving 1.',
        '50|This is one-cluster inertia.',
        '4|There are four points, not four squared error units.',
      ),
      c(
        'S=2, R=C=6, T=15. What is ARI?',
        '−1/9≈−0.1111',
        'Chance=36/15=2.4; (2−2.4)/(6−2.4)=−.4/3.6.',
        '1/3|This omits chance adjustment.',
        '1|These partitions differ.',
      ),
    ],
    applications: [
      c(
        'Does lower inertia always justify more customer segments?',
        'No; increasing K can mechanically reduce inertia.',
        'Assess segment usefulness, stability and complexity rather than minimizing it alone.',
        'Yes; K=N is always optimal operationally.|Giving each customer a separate cluster can make inertia zero while defeating a practical segmentation objective.',
        'Yes; inertia directly measures revenue.|Inertia contains feature distances, not revenues, costs, or the effect of using the segments.',
      ),
      c(
        'An algorithm rerun relabels identical groups. Should stability collapse?',
        'No; membership stability should remain perfect.',
        'ARI is invariant to label permutations.',
        'Yes; cluster numbers changed.|Renumbering identical groups leaves every shared-membership pair unchanged, so ARI remains one.',
        'Yes; the cents in a label define distance.|Cluster labels are identifiers, not monetary coordinates; changing their displayed values cannot change membership distances.',
      ),
      c(
        'A low-inertia solution has poor ARI across reruns. What is the issue?',
        'Compact groups may not be reproducible.',
        'Geometric fit and stability are distinct properties.',
        'The solution is automatically calibrated.|Calibration compares predicted probabilities with outcomes and is not implied by a compact clustering.',
        'No issue; inertia guarantees stable business segments.|Inertia measures compactness in one fit; poor ARI shows that the customer grouping changes across reruns.',
      ),
    ],
  },
  {
    number: 28,
    slug: 'retrieval-recall-k-and-context-precision',
    title: 'Retrieval Recall@K and Context Precision',
    definition:
      'Retrieval recall measures evidence found among all relevant evidence; context precision measures useful evidence among retrieved passages.',
    precise:
      'Per query, Recall@K=retrieved relevant/all relevant and ContextPrecision@K=retrieved relevant/K; the course example averages query-level ratios equally.',
    prerequisites: ['notation', 'vectors', 'data-splits'],
    terms: [
      [
        'Relevant passage',
        'A passage judged useful for answering the stated query.',
        'The filing’s actual revenue figure.',
      ],
      [
        'Retrieval recall',
        'The fraction of all judged relevant evidence found.',
        'One of two relevant passages gives 0.5.',
      ],
      [
        'Context precision',
        'The fraction of the retrieved context that is relevant.',
        'One useful passage among three gives 1/3.',
      ],
      [
        'Macro query average',
        'The equal-weight mean of query-level ratios.',
        'Average 0.5 and 1 to get 0.75.',
      ],
    ],
    mechanics: [
      'Specify relevance judgments, corpus version and query. Retrieve K passages and count unique relevant passages found.',
      'For two queries with relevant totals 2 and 1, finding one each gives recalls 0.5 and 1. Their equal-query mean is 0.75; pooling relevant counts instead gives 2/3.',
      'Both rates lie in [0,1], with higher recall meaning more evidence coverage and higher context precision meaning less irrelevant context. More context can improve recall while increasing irrelevant content and prompt costs. Retrieval quality does not prove an answer used evidence correctly.',
    ],
    formulas: [
      f(
        'R_q@K=F_q/A_q,\\quad CP_q@K=F_q/K,\\quad \\bar R=\\frac1Q\\sum_qR_q',
        'F_q is relevant passages found, A_q all judged relevant passages, and Q query count. Averaging ratios and pooling counts are different conventions.',
        ['F_q', 'Relevant passages retrieved for query q.'],
        ['A_q', 'All judged relevant passages for q.'],
        ['K', 'Retrieved passage count.'],
        ['Q', 'Evaluated queries.'],
        ['R_q', 'Query-level recall.'],
      ),
    ],
    trace: [
      [
        'Query 1',
        'Find 1 of 2 relevant in 3: recall=.5; precision=1/3',
        'Half the necessary evidence found.',
      ],
      [
        'Query 2',
        'Find 1 of 1 relevant in 3: recall=1; precision=1/3',
        'Complete recall but diluted context.',
      ],
      [
        'Macro average',
        '(.5+1)/2=.75; (1/3+1/3)/2=1/3',
        'Each financial question has equal weight.',
      ],
      [
        'Pooled comparison',
        'Found total 2 / relevant total 3=2/3',
        'Different weighting from 0.75.',
      ],
    ],
    interpretation:
      'A filing-answer system should retrieve the relevant tables and notes without flooding context with unrelated passages.',
    comparison:
      'Recall protects evidence completeness; context precision controls noise. Faithfulness and numerical accuracy assess the later answer and must be evaluated separately.',
    boundaries:
      'No judged relevant passages makes recall undefined. K=0 makes context precision undefined. Duplicate passages should not inflate found relevant counts; incomplete relevance judgments can distort evaluation.',
    mechanismChecks: [
      c(
        'What does context precision count?',
        'Relevant passages among retrieved passages',
        'Its denominator is the supplied context, not the entire corpus.',
        'Correct answer claims among all claims|Supported answer claims belong to faithfulness, which evaluates generation after retrieval.',
        'All relevant passages in the corpus|All relevant corpus passages form recall’s denominator; context precision inspects only retrieved passages.',
      ),
      c(
        'What is retrieval recall’s denominator?',
        'All judged relevant passages for the query',
        'This checks evidence coverage, including relevant passages not retrieved.',
        'K only|K is the context-size denominator for precision; recall divides by all judged relevant passages, including missed evidence.',
        'All generated claims|Generated claims are evaluated after retrieval and do not count the relevant evidence available for the query.',
      ),
      c(
        'Does averaging query recall equal pooling relevant counts?',
        'Not generally; they weight queries differently.',
        'Macro treats queries equally; pooling weights larger relevant sets more.',
        'Always, because both are fractions.|Ratios with different denominators can have different macro and pooled averages; 0.75 and 2/3 illustrate this.',
        'Only context precision can be averaged.|Both recall and context precision can be averaged per query when their denominators and aggregation are stated.',
      ),
    ],
    calculations: [
      c(
        'One of two relevant passages is retrieved in a context of three. What is recall?',
        '0.5',
        'Found/all relevant=1/2=.5.',
        '1/3|This is context precision.',
        '1|One relevant passage remains missing.',
      ),
      c(
        'One relevant passage occurs among three retrieved. What is context precision?',
        '1/3',
        'Relevant context count divided by context size=1/3.',
        '1/2|This uses total relevant for another query.',
        '3|The ratio is inverted.',
      ),
      c(
        'Query recalls are 0.5 and 1. What is macro mean recall?',
        '0.75',
        '(.5+1)/2=.75.',
        '2/3|This may be pooled recall with relevant totals 2 and 1.',
        '1.5|This is the sum.',
      ),
    ],
    applications: [
      c(
        'Retrieval recall=1, context precision=1/3. What is the interpretation?',
        'All known relevant evidence is present but much context is irrelevant.',
        'Completeness and concentration answer different questions.',
        'The final answer is guaranteed correct.|The generator can misread or ignore evidence even when every judged relevant passage was retrieved.',
        'No irrelevant passages were retrieved.|Context precision 1/3 means two thirds of the retrieved passages are judged irrelevant.',
      ),
      c(
        'Why evaluate faithfulness separately from retrieval quality?',
        'A generator can misuse or ignore correctly retrieved evidence.',
        'Finding evidence and making supported claims are separate stages.',
        'Retrieval recall already checks every claim.|Retrieval recall checks passages found, not whether each generated claim is supported by those passages.',
        'Context precision proves numerical arithmetic.|Context precision measures relevance concentration and does not recompute an answer’s financial arithmetic.',
      ),
      c(
        'The relevance list misses an essential filing note. What is the concern?',
        'Recall can appear complete against incomplete judgments.',
        'The evaluation denominator must represent the evidence needed for the query.',
        'Recall becomes a causal score.|An incomplete relevance list distorts the measurement population; it does not establish any causal relationship.',
        'Missing judgments can safely be counted irrelevant automatically.|Unjudged evidence is not necessarily irrelevant; excluding an essential note can falsely inflate recall.',
      ),
    ],
  },
  {
    number: 29,
    slug: 'mrr-and-ndcg',
    title: 'MRR and nDCG',
    definition:
      'MRR rewards locating the first relevant result quickly. nDCG rewards placing highly relevant results near the top.',
    precise:
      'MRR averages reciprocal first-relevant rank, using 0 for misses. nDCG@K=DCG@K/IDCG@K with gain 2^rel−1 and discount log₂(i+1) in this course.',
    prerequisites: ['notation', 'vectors', 'logarithms'],
    terms: [
      [
        'Reciprocal rank',
        'One divided by the first relevant result’s rank.',
        'First relevant at rank 4 gives 1/4.',
      ],
      [
        'Graded relevance',
        'A numerical judgment distinguishing levels of evidence usefulness.',
        'Grade 3 is more useful than grade 1.',
      ],
      [
        'Discounted cumulative gain',
        'Sum graded gains with reduced weight for lower ranks.',
        'Rank 2 divides gain by log₂3.',
      ],
      [
        'Ideal DCG',
        'DCG of the best possible ordering of the same judged set at K.',
        'Sort relevance grades descending.',
      ],
    ],
    mechanics: [
      'MRR finds only the first relevant passage for each query. A query with no relevant passage in the evaluated ranking contributes 0.',
      'For nDCG compute each exponential relevance gain, divide by its rank discount, sum, then normalize using ideally sorted relevance grades under the same cutoff.',
      'Both are unitless and in [0,1] with nonnegative grades, consistent valid ideal judgments and a nonzero denominator; higher values reward useful results earlier. MRR ignores later relevant results; nDCG handles their graded ordering.',
    ],
    formulas: [
      f(
        'RR_q=\\begin{cases}1/r_q&\\text{found}\\\\0&\\text{not found}\\end{cases},\\quad MRR=\\frac1Q\\sum_qRR_q',
        'r_q is a one-based first relevant rank; a miss contributes 0 rather than being omitted.',
        ['r_q', 'First relevant result rank.'],
        ['Q', 'Number of evaluated queries.'],
        ['RR_q', 'Reciprocal rank for query q.'],
      ),
      f(
        'DCG@K=\\sum_{i=1}^{K}\\frac{2^{rel_i}-1}{\\log_2(i+1)},\\quad nDCG@K=DCG@K/IDCG@K',
        'Higher graded gains matter more and later ranks are discounted. IDCG uses the same formula on the ideal ordering.',
        ['K', 'Ranking cutoff.'],
        ['rel_i', 'Nonnegative relevance grade at rank i.'],
        ['i', 'One-based rank.'],
        ['IDCG', 'Ideal discounted cumulative gain at the same K.'],
      ),
    ],
    trace: [
      [
        'Four queries',
        'Ranks [1,2,4, miss]: RR=[1,.5,.25,0]',
        'Unanswered query stays in denominator.',
      ],
      ['MRR', '(1+.5+.25+0)/4=.4375', 'First-evidence speed.'],
      [
        'Actual grades',
        '[1,3,0]: gains [1,7,0]; DCG=1+7/log₂3≈5.4165',
        'High-grade evidence is delayed.',
      ],
      ['Ideal grades', '[3,1,0]: IDCG=7+1/log₂3≈7.6309', 'Put the strongest evidence first.'],
      ['nDCG', '5.4165/7.6309≈.7098', 'Normalized rank quality.'],
    ],
    interpretation:
      'For filing retrieval, MRR checks how quickly the first useful passage appears. nDCG checks whether the most informative passages occupy prominent positions.',
    comparison:
      'Retrieval recall checks all evidence coverage, which MRR can ignore after one early success. nDCG comparisons require a consistent relevance grading and judgment set.',
    boundaries:
      'Q=0 makes MRR undefined. IDCG=0 makes raw nDCG undefined; common software sets it 0 for an all-zero relevance set, which must be stated. A missed rank is encoded 0 in the original exercise but contributes RR0, not 1/0.',
    mechanismChecks: [
      c(
        'Which result determines a query’s reciprocal rank?',
        'The first relevant result',
        'Later relevant passages do not change RR once the first is fixed.',
        'Every irrelevant result equally|Irrelevant results affect where the first relevant result appears, but RR uses that first relevant rank alone.',
        'The final generated answer’s length|Generated answer length is downstream of retrieval and does not determine reciprocal result rank.',
      ),
      c(
        'What is nDCG’s normalization denominator?',
        'Ideal DCG at the same K and relevance judgments',
        'The ideal ordering is the best attainable graded ranking for the comparison.',
        'Number of queries only|Query count normalizes MRR’s average; nDCG normalizes a query’s gain by its ideal gain at the same cutoff.',
        'All documents in the corpus|Corpus size does not express the best attainable graded ordering and has different meaning from ideal DCG.',
      ),
      c(
        'How does a query with no relevant result contribute to MRR?',
        'Zero, while remaining in the query denominator',
        'Omitting failures would inflate the average.',
        'It is dropped from the average.|Dropping failed queries changes the population and inflates MRR by excluding zero contributions.',
        'It contributes one.|A contribution of one denotes a relevant result at rank one, not a missing relevant result.',
      ),
    ],
    calculations: [
      c(
        'The first relevant passage is rank 4. What is reciprocal rank?',
        '0.25',
        '1/4=.25.',
        '4|This is the rank itself.',
        '0.75|This is not its reciprocal.',
      ),
      c(
        'Ranks are 1,2,4 and a miss. What is MRR?',
        '0.4375',
        '(1+.5+.25+0)/4=1.75/4=.4375.',
        '0.5833|This wrongly drops the missed query.',
        '1.75|This is the sum.',
      ),
      c(
        'DCG=5.4165 and ideal DCG=7.6309. What is nDCG, approximately?',
        '0.7098',
        '5.4165/7.6309≈.7098.',
        '1.4088|This reverses the ratio.',
        '2.2144|This subtracts rather than normalizes.',
      ),
    ],
    applications: [
      c(
        'A system finds one relevant passage first but misses several others. What can MRR hide?',
        'Incomplete evidence coverage',
        'MRR rewards the first success without requiring every relevant passage.',
        'The first relevant rank|MRR explicitly captures the first relevant rank; the limitation is that it ignores additional missing evidence.',
        'Whether a miss contributes zero|The stated miss convention already assigns zero; it does not remedy incomplete coverage after an early first hit.',
      ),
      c(
        'Why prefer graded nDCG when one filing passage is far more useful than another?',
        'It rewards placing stronger evidence earlier.',
        'Binary first-hit metrics cannot express all graded relevance differences.',
        'It eliminates the need for judgments.|nDCG requires relevance grades to calculate gains and the ideal ordering; it cannot remove the need for judgments.',
        'It verifies every financial calculation.|Ordering relevant passages does not verify the later answer’s accounting units or numerical calculations.',
      ),
      c(
        'All relevance grades are zero. What is raw nDCG’s boundary?',
        'IDCG=0 makes the ratio undefined.',
        'A software zero convention may be useful but is not ordinary division.',
        'nDCG is mathematically always one.|All-zero relevance gives DCG=IDCG=0, and the raw ratio 0/0 is undefined rather than one.',
        'Every passage is relevant.|Zero relevance grades say that no passage in the judged set is relevant, not that every passage is relevant.',
      ),
    ],
  },
  {
    number: 30,
    slug: 'faithfulness-citation-correctness-numerical-accuracy',
    title: 'Faithfulness, Citation Correctness, Numerical Accuracy',
    definition:
      'These checks evaluate different parts of an evidence-based financial answer: supported claims, valid claim-source pairs, and correct figures.',
    precise:
      'Faithfulness=supported/all evaluated claims; citation correctness=correct/all evaluated claim–citation pairs; numerical accuracy=correct/all evaluated financial figures.',
    prerequisites: ['notation', 'data-splits', 'leakage'],
    terms: [
      [
        'Faithfulness',
        'The share of evaluated claims supported by the supplied evidence.',
        'Three of five claims are supported.',
      ],
      [
        'Citation correctness',
        'The share of evaluated claim-source pairs whose cited source supports that claim.',
        'Two of four citations directly substantiate their attached claim.',
      ],
      [
        'Numerical accuracy',
        'The share of evaluated figures/calculations that are correct under the stated accounting units.',
        'Three of four figures are correct.',
      ],
      [
        'Claim-source pair',
        'One claim connected to one cited evidence item.',
        'A revenue-growth claim linked to a filing table.',
      ],
    ],
    mechanics: [
      'Split an answer into auditable claims and figures; declare the evaluation rubric before counting. A figure can be embedded in a claim but its numerical check remains distinct.',
      'Check claim support against retrieved evidence, then check each citation’s match, then recompute financial arithmetic and units. Correct citation formatting is not correct support.',
      'The three fractions lie in [0,1], higher preferred. Their denominators are claims, pairs and figures respectively; they cannot be substituted or averaged without a stated policy.',
    ],
    formulas: [
      f(
        'Faithfulness=S/C,\\quad CitationCorrectness=V/P,\\quad NumericalAccuracy=F_c/F',
        'Each numerator is a successful audit count within its own population. These fractions evaluate different answer properties, not the retriever itself.',
        ['S', 'Supported claims.'],
        ['C', 'All evaluated claims.'],
        ['V', 'Valid supporting claim-citation pairs.'],
        ['P', 'All evaluated pairs.'],
        ['F_c', 'Correct evaluated financial figures.'],
        ['F', 'All evaluated figures.'],
      ),
      f(
        'Growth=\\frac{Revenue_{new}-Revenue_{old}}{Revenue_{old}}',
        'Growth uses the old revenue as the denominator and requires matching currency units and periods.',
        ['Revenue_{new}', 'Revenue for the later comparable period.'],
        ['Revenue_{old}', 'Revenue for the earlier comparable period.'],
      ),
    ],
    trace: [
      ['Claim audit', '3 supported /5 claims=.60', 'Two claims lack evidence support.'],
      [
        'Citation audit',
        '2 correct /4 pairs=.50',
        'Some cited sources do not establish the attached claim.',
      ],
      ['Figure audit', '3 correct /4 figures=.75', 'One financial figure is wrong.'],
      [
        'Recompute growth',
        '($120m−$100m)/$100m=.20=20%',
        'A $20m increase is not 20 percentage points of margin.',
      ],
    ],
    interpretation:
      'A filing assistant must deliver traceable evidence and correct financial arithmetic, not merely a fluent or well-cited-looking answer.',
    comparison:
      'A faithful answer can omit important facts, and a numerically correct answer can cite the wrong source. Add completeness and task-success checks rather than treating one fraction as overall trustworthiness.',
    boundaries:
      'Zero evaluated claims, pairs or figures makes the corresponding raw ratio undefined; state not-applicable conventions. Source support is not automatically external truth. Revenue growth is undefined when old revenue is zero.',
    mechanismChecks: [
      c(
        'What denominator does citation correctness use?',
        'Evaluated claim-citation pairs',
        'It tests whether the source attached to a claim supports that claim.',
        'All generated words|Word count measures answer length, not the number of audited claim-source matches.',
        'All retrieved passages|Retrieved passages are a retrieval population; citation correctness audits the sources attached to answer claims.',
      ),
      c(
        'How does numerical accuracy differ from faithfulness?',
        'It separately checks figures, arithmetic and units.',
        'A source may support a relationship while an answer miscalculates its value.',
        'They always use the same denominator.|Faithfulness counts claims, whereas numerical accuracy counts evaluated figures; those totals can differ.',
        'Numerical accuracy counts source formatting.|Formatting concerns citation presentation; numerical accuracy requires correct arithmetic and financial units.',
      ),
      c(
        'What does a properly formatted citation prove by itself?',
        'Only that a citation is present, not that it supports the claim.',
        'Correctness requires checking the actual claim-source match.',
        'Every claim is true.|A source link can be formatted correctly while failing to support its attached claim.',
        'Every number is correct.|Citation presence does not recalculate numbers or detect mismatched units in the answer.',
      ),
    ],
    calculations: [
      c(
        'Three of five claims are supported. What is faithfulness?',
        '60%',
        '3/5=.60.',
        '75%|This could be the separate figure score.',
        '50%|This could be the separate citation score.',
      ),
      c(
        'Two of four claim-source pairs are valid. What is citation correctness?',
        '50%',
        '2/4=.50.',
        '25%|Two pairs, not one, are valid.',
        '100%|Citation presence is not validity.',
      ),
      c(
        'Revenue rises from $100m to $120m. What is growth?',
        '20%',
        '(120−100)/100=.20=20%, with the old value as denominator.',
        '16.67%|This divides by new revenue.',
        '120%|This reports new/old, not change/old.',
      ),
    ],
    applications: [
      c(
        'High faithfulness but low citation correctness is possible when what happens?',
        'Claims are supported somewhere, but attached sources do not support the correct claims.',
        'Claim support and claim-source alignment are distinct audits.',
        'The retriever uses no source material.|High faithfulness requires support in the supplied evidence; mismatched attached citations can fail even when evidence exists elsewhere.',
        'All numerical figures are necessarily wrong.|Citation mismatch does not force numerical errors; the figure audit is a separate check.',
      ),
      c(
        'Why inspect units when checking revenue arithmetic?',
        'Millions versus thousands can create large numerical errors.',
        'A correct formula with inconsistent units gives an incorrect figure.',
        'Citation formatting converts all currencies.|Citation formatting does not convert currencies or reconcile millions with thousands.',
        'Faithfulness automatically corrects unit mismatches.|A claim can appear supported while its numerical units are misstated; the numerical audit must catch the mismatch.',
      ),
      c(
        'An answer has no financial figures. How should numerical accuracy be reported?',
        'Not applicable/undefined under a stated rubric, rather than claiming observed perfection.',
        'There is no evaluated-figure denominator.',
        'Automatically 100% as a mathematical fraction|With zero evaluated figures there is no denominator; 0/0 is not observed 100% accuracy.',
        'Automatically 0% proving task failure|An absent figure population does not establish numerical failure; report the metric as not applicable under the rubric.',
      ),
    ],
  },
];
