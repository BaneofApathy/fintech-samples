import numpy as np
from scipy.optimize import minimize
# These decimal rates and matrix entries are supplied teaching assumptions, not historical estimates.
mu = np.array([.06,.08,.10,.04])
Sigma = np.array([[.040,.012,.018,.006],[.012,.055,.020,.008],
    [.018,.020,.090,.010],[.006,.008,.010,.025]])
# w @ Sigma @ w is modeled portfolio variance; its square root is volatility in return units.
def variance(w): return w @ Sigma @ w
target_return = .07
asset_cap = .50
constraints = [{"type":"eq","fun":lambda w:w.sum()-1},
    {"type":"ineq","fun":lambda w:w @ mu-target_return}]
# Every share must stay from 0 to 50%; first check that four caps can still fill 100%.
bounds = [(0,asset_cap)]*4
x0 = np.repeat(.25,4)
if len(mu) * asset_cap < 1:
    raise ValueError(f"Infeasible: {len(mu)} asset caps of {100*asset_cap:g}% allow only {100*len(mu)*asset_cap:g}% total allocation; the weights must sum to 100%.")
# SLSQP searches for a low-variance choice while respecting these rules; check its status.
result = minimize(variance,x0,method="SLSQP",bounds=bounds,constraints=constraints)
print("Feasible solve:",result.success,result.message)
if not result.success: raise ValueError("Solver did not find a feasible portfolio")
w = result.x
print("Weights:",w.round(3))
print("Return:",round(w @ mu,4))
print("Volatility:",round(np.sqrt(variance(w)),4))
print("Equal-weight volatility:",round(np.sqrt(variance(x0)),4))
print("Constraint checks:",abs(w.sum()-1)<1e-6,w @ mu >= target_return-1e-6,w.min()>=-1e-6,w.max()<=asset_cap+1e-6)
