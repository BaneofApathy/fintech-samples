import numpy as np
from scipy.stats import norm
# Seed 17 repeats the random draws; each row below will be one possible portfolio outcome.
rng = np.random.default_rng(17)
n_sims,n_loans = 2500,1000
# PD is chance of default, EAD is amount owed, and LGD is the share lost after default.
pd = np.full(n_loans,.025)
ead = np.full(n_loans,10000.0)
lgd = np.full(n_loans,.45)
# rho controls a shared shock: positive values make defaults tend to occur together.
rho = .12
common = rng.normal(size=(n_sims,1))
idiosyncratic = rng.normal(size=(n_sims,n_loans))
latent = np.sqrt(rho)*common+np.sqrt(1-rho)*idiosyncratic
defaults = latent < norm.ppf(pd)
loss = (defaults*ead*lgd).sum(axis=1)
# Compare the simulated average with sum(PD × amount owed × lost share).
print("Expected loss:",loss.mean())
print("Analytical expected-loss baseline:",(pd*ead*lgd).sum())
print("95th percentile:",np.quantile(loss,.95))
print("99th percentile:",np.quantile(loss,.99))
breach = (loss>200000).mean()
print("P(loss > $200k):",breach)
print("Simulation SE:",np.sqrt(breach*(1-breach)/n_sims))
