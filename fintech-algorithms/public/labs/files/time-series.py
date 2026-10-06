import numpy as np, pandas as pd
from statsmodels.tsa.statespace.sarimax import SARIMAX
from sklearn.metrics import mean_absolute_error
# Seed 4 makes this fictional trend, weekly cycle, and noise repeatable.
rng = np.random.default_rng(4)
t = np.arange(365)
y = 1000 + 1.1*t + 130*np.sin(2*np.pi*t/7) + rng.normal(0,45,365)
y = pd.Series(y,index=pd.date_range("2025-01-01",periods=365))
# Hold the final 28 dates back; fit using only earlier observations.
train,test = y.iloc[:-28],y.iloc[-28:]
model = SARIMAX(train,order=(1,1,1),seasonal_order=(1,0,1,7),
    enforce_stationarity=False).fit(disp=False,maxiter=50)
forecast = model.get_forecast(steps=28)
pred = forecast.predicted_mean
# MAE is the average absolute miss, in the series' original units.
print("MAE:", mean_absolute_error(test,pred))
# A simple reference repeats the last full training week four times.
seasonal_naive = np.tile(train.iloc[-7:].to_numpy(),4)
print("Seasonal naive MAE:",mean_absolute_error(test,seasonal_naive))
ci = forecast.conf_int().to_numpy()
# Coverage counts the share of test values inside their forecast intervals.
print("Interval coverage:", ((test.to_numpy()>=ci[:,0]) & (test.to_numpy()<=ci[:,1])).mean())
print(forecast.conf_int().tail())
