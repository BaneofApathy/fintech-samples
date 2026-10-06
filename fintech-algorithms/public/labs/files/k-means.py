import numpy as np
from sklearn.datasets import make_blobs
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score, adjusted_rand_score
# Create fictional points; seed 9 controls the data, not the later rerun.
X, _ = make_blobs(n_samples=600, centers=4, n_features=5,
    cluster_std=[.7, 1.0, .8, 1.2], random_state=9)
# Put each feature on a comparable scale before measuring distance.
Z = StandardScaler().fit_transform(X)
# Try each group count on the same points; inertia falls as groups are added.
for k in range(2, 7):
    # Ten starts reduce dependence on one unlucky set of initial centers.
    km = KMeans(n_clusters=k, n_init=10, random_state=9)
    labels = km.fit_predict(Z)
    print(k, "Silhouette:", round(silhouette_score(Z, labels),3), "Inertia:", round(km.inertia_,1))
# Compare two four-group fits on the same points, changing only initialization.
segment = KMeans(n_clusters=4, n_init=10, random_state=9).fit_predict(Z)
rerun = KMeans(n_clusters=4, n_init=10, random_state=19).fit_predict(Z)
print("Seed stability ARI:", adjusted_rand_score(segment, rerun))
print("Segment counts:", np.bincount(segment))
