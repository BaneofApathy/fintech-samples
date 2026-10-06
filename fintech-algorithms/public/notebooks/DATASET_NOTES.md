# Dataset notes

The browser labs use fixed-seed synthetic samples or small, hand-written examples. None contains customer data or supplies a benchmark for production performance. Keep the dataset, split, and random seed fixed when comparing model settings.

## Logistic regression

The computer creates 5,000 fictional examples. Each has eight numeric inputs and an outcome label; about 10 in every 100 labels are positive. A stratified split puts 70% of examples in the training set and 30% in the test set while keeping roughly the same positive share in both. Seed 7 makes the random sample repeatable.

This example uses scikit-learn for the model and NumPy through scikit-learn. The scaling rule is learned from training examples only, then reused on test examples. The constant-guess reference also uses only the training outcomes.

## Decision trees and random forests

The computer creates 2,000 fictional rows. Each row has 12 numeric features (input details), and about 3 in every 100 rows have the positive label. Seven features carry information about that label. A stratified split keeps roughly the same positive share in the 70% training group and 30% test group. Seed 11 makes the generated rows repeatable.

This notebook uses scikit-learn. The forest evaluates trees one at a time to keep the run predictable and gives extra weight to the rare positive class while fitting. Average precision adds the precision gained at each recall step; it is not the same calculation as trapezoidal area under a precision–recall curve.

## Gradient boosting

The computer creates 3,000 fictional rows with 20 numeric inputs. About 8 in every 100 outcomes are positive, and 1% of labels are deliberately noisy. A stratified split keeps roughly that outcome mix in the 70% training group and 30% test group. Seed 21 makes the examples repeatable.

This notebook uses scikit-learn. Boosting uses a learning rate of 0.05 and limits each tree to 15 leaves. Use the training rows to fit the models, a separate validation group to choose settings, and keep the final test rows for one last check.

## K-means clustering

The computer creates 600 fictional rows in five numeric dimensions. The example begins with four groups that have different spreads. Seed 9 controls how the rows are generated. StandardScaler then centers each column around its average and expresses values in standard-deviation units so columns with larger raw numbers do not automatically dominate distance.

This example uses NumPy and scikit-learn. Each K-means fit tries ten starting center arrangements and keeps the best fit by inertia. Seed 9 creates the data; seeds 9 and 19 initialize the two four-cluster comparisons. Changing one seed does not change the generated rows.

## Isolation Forest

The computer creates 1,000 fictional background transactions and adds five rows designed to look unusual. Each row has four numbers: amount, hour, activity count, and how much activity differs from that customer’s usual level. Seed 12 makes the generated sample repeatable. The five planted rows are known only because the exercise inserted them; they are not confirmed fraud cases.

This notebook uses NumPy and scikit-learn. score_samples returns smaller numbers for more isolated rows, so the code reverses the sign to rank the most unusual first. The contamination setting chooses a threshold for flagging rows; changing it alone changes how many are flagged, not the score order. Check the installed library behavior before applying this cutoff in production.

## Time-series forecasting

The notebook generates 365 fictional daily values beginning January 1, 2025. A steady trend adds about 1.1 units per day, a repeating seven-day pattern adds seasonal movement, and random noise makes days vary around that pattern. Seed 4 makes the series repeatable. The first 337 days are training history; the final 28 are held back to test a forecast made without seeing them.

The notebook uses NumPy to generate the series, pandas to attach dates, statsmodels for SARIMAX, and scikit-learn to calculate MAE. Fitting stops after 50 optimizer iterations; a convergence warning means the numerical search may not have settled, so check it before interpreting the output. Twenty-eight test days provide only a small check of 95% interval coverage.

## Graph methods

This teaching graph is written by hand: four account points, two device points, one merchant point, one address point, and seven relationship lines. It has no transaction outcomes, dates, or fraud labels, so it can show connections but cannot measure fraud-detection performance.

NetworkX stores and measures this small graph. The graph has no timestamps, so the code cannot tell whether a relationship was already known at the time a past decision was made. In a real evaluation, filter links by their recorded time before building the graph; otherwise later information can make an earlier decision look better than it was.

## Financial text classification

There are 12 hand-written training sentences (4 for each label) and 6 labeled test sentences. The test set is tiny and hand-made, so its scores are practice numbers, not evidence that the model understands finance in general.

The browser notebook uses scikit-learn: TF-IDF turns words into weighted counts and logistic regression maps those counts to one of the three labels. It does not download or run FinBERT. The separate native example uses the pretrained FinBERT language model and needs transformers, PyTorch, and an initial model download.

[Native Python example](native/transformers.py)

## Retrieval for RAG

The notebook uses four hand-written passages and one question. Passages 1 and 3 are manually marked relevant to customer concentration. Those marks are teaching labels and must be updated when the question changes; they are not judgments made by the search model.

The browser uses NumPy and scikit-learn to rank word patterns; it does not generate an answer. The separate native example uses Sentence-Transformers to compare semantic text vectors and needs an initial model download. Relevance and answerability are supplied annotations, not model judgments.

[Native Python example](native/rag.py)

## Portfolio optimization

The four expected returns are assumed annual rates: 6%, 8%, 10%, and 4%. The 4×4 covariance matrix summarizes each asset’s modeled variability and how pairs tend to move together. It is supplied directly; it was not estimated from historical returns in this notebook.

NumPy stores the estimates and calculates portfolio variance; SciPy’s SLSQP routine searches for weights that reduce variance while meeting the limits. The code checks whether the search succeeded and stops if it did not. Four 20% caps can add to only 80%, so they cannot satisfy the rule that weights total 100%.

## Q-learning for execution

The computer runs 2,000 simulated practice episodes. Seed 5 fixes the random price changes so the exercise can be repeated. Each episode has ten steps, starts with ten units to buy, and charges more impact for larger orders plus a penalty for units left at the end.

NumPy runs the simulator. Training uses random price changes; deterministic evaluation removes that noise so the policies can be compared on one fixed path. The same impact and unfinished-inventory penalty are applied to the learned policy and TWAP. A zero-noise evaluation is not a test of performance across real market conditions.

## Monte Carlo credit-loss simulation

There are 1,000 equal loans and 2,500 simulated scenarios. For each loan, the assumed default chance (PD) is 2.5%, the amount owed (EAD) is $10,000, and the lost share after default (LGD) is 45%. Seed 17 makes the random draws repeatable. The dependence setting allows borrowers’ defaults to move together; it is a model assumption, not observed proof.

NumPy generates the random outcomes and SciPy provides the normal-distribution calculations. More paths generally make random sampling wiggle less, but cannot validate the 2.5% default chance, 45% loss share, or Gaussian dependence assumption. A precise answer under a wrong assumption is still misleading.

