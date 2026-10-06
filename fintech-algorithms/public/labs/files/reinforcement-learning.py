import numpy as np
rng = np.random.default_rng(5)
T,inventory0,actions = 10,10,np.array([0,1,2])
Q = np.zeros((T+1,inventory0+1,len(actions)))
alpha,gamma,eps = .15,.95,.20
impact_coefficient = .08
incomplete_penalty = 5.0
price_noise_sd = .10
for episode in range(2000):
    inv = inventory0
    for t in range(T):
        valid = np.where(actions<=inv)[0]
        a_idx = rng.choice(valid) if rng.random()<eps else valid[np.argmax(Q[t,inv,valid])]
        qty = actions[a_idx]
        impact = impact_coefficient*qty**2
        price_risk = rng.normal(0,price_noise_sd)*inv
        next_inv = inv-qty
        reward = -(impact+price_risk)
        if t==T-1: reward -= incomplete_penalty*next_inv
        next_valid = np.where(actions<=next_inv)[0]
        future = 0 if t==T-1 else Q[t+1,next_inv,next_valid].max()
        Q[t,inv,a_idx] += alpha*(reward+gamma*future-Q[t,inv,a_idx])
        inv = next_inv
policy,inv = [],inventory0
for t in range(T):
    valid = np.where(actions<=inv)[0]
    qty = actions[valid[np.argmax(Q[t,inv,valid])]]
    policy.append(int(qty));inv -= qty
cost = sum(impact_coefficient*q*q for q in policy)+incomplete_penalty*inv
print("Illustrative actions:",policy,"remaining:",int(inv))
print("Deterministic evaluation cost:",cost)
print("TWAP baseline cost:",T*impact_coefficient)
print("Reward:",-cost)
