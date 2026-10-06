"""Numerical contracts transcribed from the deck. No invented exercise data."""
SPECS = {}
def add(id, givens, solutions, latex, labels=None, units=None):
    units = units or {}
    SPECS[id] = dict(givens=givens, labels=labels or {k:k for k in givens}, deckSolution=solutions,
      latex=latex if isinstance(latex,list) else [latex], symbols=[], steps=[dict(id=k,title=k,
        expects='cells' if isinstance(v,list) else 'boolean' if isinstance(v,bool) else 'number',
        unit=units.get(k,''), tolerance=dict(rel=.005,abs=.00005),
        hints=[], mistakes=[]) for k,v in solutions.items()])

add('A01',dict(DTI=35,D=1,I=60,loan=10000,LGD=.4,threshold=.08),dict(z=-2.2,p=.09975,lossOnDefault=4000,EL=399,decision=True),
 [r'z=-3+0.04\,DTI+1.2D-0.03I',r'p=\frac{1}{1+e^{-z}}',r'EL=p\times EAD\times LGD'],
 dict(DTI='Debt-to-income ratio (percentage points)',D='Prior delinquency (0 or 1)',I='Annual income ($ thousands)',loan='Exposure at default ($)',LGD='Loss given default (proportion)',threshold='Review threshold (proportion)'),dict(p='proportion',lossOnDefault='$',EL='$'))
add('A02',dict(counts=[3,1,1,5],scores=[.75,.5,.25],threshold=.6),dict(parent=.48,newGini=.375,trustedGini=.2777778,weighted=.3166667,gain=.1633333,score=.5,decision=False,firstDecision=True),r'G=1-p_f^2-p_l^2,\quad G_{split}=\sum_j\frac{n_j}{N}G_j')
add('A03',dict(F0=-2,eta=.5,h1=.8,h2=.4,eta2=.25,threshold=.18),dict(F1=-1.6,F2=-1.4,p=.1978,smallF1=-1.8,smallF2=-1.7,smallP=.1545,decision=True,smallDecision=False),r'F_m=F_{m-1}+\eta h_m,\quad p=\frac{1}{1+e^{-F_m}}',units=dict(p='proportion',smallP='proportion'))
add('A04',dict(points=[10,20,60,70],centers=[10,60],newPoint=35),dict(groups=[1,1,2,2],c1=15,c2=65,d1=20,d2=30,group=1),r'\mu_j=\frac{1}{|C_j|}\sum_{i\in C_j}x_i')
add('A05',dict(paths=[2,3,1,4,5,3,6,5,7],c=4),dict(means=[2,4,6],scores=[.7071,.5,.3536],top=1),r'\bar h=\frac{1}{T}\sum_t h_t,\quad s=2^{-\bar h/c}')
add('A06',dict(previous=110,last=116,phi=.5,buffer=10,actual=125),dict(change=6,nextChange=3,next=119,secondChange=1.5,second=120.5,liquidity=129,modelError=6,baselineError=9),r'\Delta y_t=y_t-y_{t-1},\quad \widehat{\Delta y}_{t+1}=0.5\Delta y_t,\quad \hat y_{t+1}=y_t+\widehat{\Delta y}_{t+1}')
add('A07',dict(links=5),dict(components=2,sizes=[5,2],degrees=[1,2,1,1],edges=4,proof=False),r'\deg(v)=|N(v)|,\quad d(A,C)=\min_{\pi:A\to C}|\pi|')
add('A08',dict(logits=[0,1.0986122886681098],values=[-1,1],threshold=.7),dict(weights=[.25,.75],h=.5,classLogits=[1,0,-1],probabilities=[.6652,.2447,.0901],decision=False),[r'a_i=\frac{e^{s_i}}{\sum_j e^{s_j}}',r'h=\sum_i a_i v_i,\quad P_c=\frac{e^{\ell_c}}{\sum_j e^{\ell_j}}'])
add('A09',dict(q=[1,0],docs=[3,4,4,3,0,5],oldRevenue=100,newRevenue=120),dict(similarities=[.6,.8,0],growth=.2),r'\operatorname{sim}(q,d)=\frac{q\cdot d}{\|q\|\|d\|},\quad \operatorname{growth}=\frac{R_{new}-R_{old}}{R_{old}}',units=dict(growth='proportion'))
add('S01',dict(tables=8,intact=7,sections=10,present=9,cells=200,wrong=6),dict(integrity=.875,coverage=.9,error=.03,correct=.97),r'TIR=\frac{7}{8},\quad SC=\frac{9}{10},\quad NER=\frac{6}{200}',units={k:'proportion' for k in ['integrity','coverage','error','correct']})
add('S02',dict(required=[2,3,1,4],correct=[2,2,0,4]),dict(complete=2,exactness=.5,required=10,correct=8,completeness=.8),r'\operatorname{exactness}=\frac{N_{complete}}{N_{questions}},\quad \operatorname{completeness}=\frac{N_{correct\ components}}{N_{required\ components}}',units=dict(exactness='proportion',completeness='proportion'))
add('A10',dict(weights=[.4,.5,.6],stockReturn=.1,bondReturn=.04,stockVol=.2,bondVol=.05,minimum=.07,portfolio=100000),dict(returns=[.064,.07,.076],variances=[.0073,.010625,.0148],volatilities=[.08544,.10308,.12166],weight=.5,stockDollars=50000,bondDollars=50000),r'\mu_p=0.10w+0.04(1-w),\quad \sigma_p^2=w^2(0.20)^2+(1-w)^2(0.05)^2')
add('A11',dict(old=-5,reward=-2,next=[-4,-1],alpha=.5,gamma=.9,wait=-4.2),dict(best=-1,target=-2.9,error=2.1,updated=-3.95,decision=True,terminal=-2),r'Q_{new}=Q_{old}+\alpha\left[r+\gamma\max_a Q(s^{\prime},a)-Q_{old}\right]')
add('S03',dict(target=1000,arrival=50,shares=[400,400],prices=[50.1,50.2],close=50.3,fees=20),dict(completion=.8,slippage=120,opportunity=60,total=200,notional=50000,bps=40),r'IS=\sum_jq_j(p_j-p_0)+q_{unfilled}(p_T-p_0)+fees,\quad IS_{bps}=10^4\frac{IS}{q_{target}p_0}',units=dict(completion='proportion',slippage='$',opportunity='$',total='$',notional='$',bps='bps'))
add('S04',dict(costs=[2,3,4,5,6,7,8,9,20,30],baseline=12,tail=.2),dict(mean=9.4,p90=20,p95=30,tailMean=25,meanSaving=2.6,tailExtra=13),r'\bar c=\frac{1}{N}\sum_i c_i,\quad c_p=c_{(\lceil pN\rceil)},\quad TailMean=\operatorname{mean}(\text{worst }20\%)')
add('A12',dict(PD=.2,loan=10000,LGD=.5,reserve=5000,draws=[.1,.8,.6,.4,.05,.15,.9,.7,.3,.1]),dict(lossOnDefault=5000,losses=[5000,0,10000,0,5000],mean=4000,breach=.2,analytical=2000,exact=.04),r'L_j=\sum_i\mathbf1[U_{ij}<PD_i]EAD_iLGD_i,\quad E[L]=\sum_i PD_iEAD_iLGD_i',units=dict(breach='proportion',exact='proportion'))
C=dict(TP=15,FP=35,FN=5,TN=945)
add('M01',dict(N=1000,fraud=20,alerts=50,caught=15),dict(cells=[15,35,5,945],total=1000),r'FP=50-15,\quad FN=20-15,\quad TN=1000-TP-FP-FN')
add('M02',C,dict(accuracy=.96,mistakes=40,baseline=.98,caught=0,baselineMistakes=20),r'Accuracy=\frac{TP+TN}{N}',units=dict(accuracy='proportion',baseline='proportion'))
add('M03',C,dict(recall=.75,specificity=.9642857,balanced=.8571429,baseline=.5),r'BalancedAccuracy=\frac12\left(\frac{TP}{TP+FN}+\frac{TN}{TN+FP}\right)',units={k:'proportion' for k in ['recall','specificity','balanced','baseline']})
add('M04',dict(alertsA=50,caughtA=15,alertsB=10,caughtB=8,reviewCost=4),dict(precisionA=.3,precisionB=.8,costA=200,costB=40,perA=13.333333,perB=5),r'Precision=\frac{TP}{TP+FP},\quad CostPerCaught=\frac{CostPerReview\times N_{reviews}}{TP}',units=dict(precisionA='proportion',precisionB='proportion'))
add('M05',dict(fraud=20,caughtA=15,caughtB=8,loss=2000),dict(recallA=.75,recallB=.4,missedA=5,missedB=12,lossA=10000,lossB=24000,saving=14000),r'Recall=\frac{TP}{TP+FN},\quad ResidualLoss=FN\times c_{FN}',units=dict(recallA='proportion',recallB='proportion'))
add('M06',dict(TN=945,FP=35,volume=1000000),dict(specificity=.9642857,FPR=.0357143,total=1,falseAlerts=35714.2857),r'Specificity=\frac{TN}{TN+FP},\quad FPR=\frac{FP}{TN+FP}',units=dict(specificity='proportion',FPR='proportion',total='proportion'))
add('M07',dict(precision=.3,recall=.75,beta=2),dict(F1=.4285714,F2=.5769231,arithmetic=.525),r'F_1=\frac{2PR}{P+R},\quad F_\beta=\frac{(1+\beta^2)PR}{\beta^2P+R}')
add('M08',dict(scores=[.9,.8,.7,.4,.3,.1],labels=[1,0,1,0,1,0],thresholds=[.85,.65,.25]),dict(TP=[1,2,3],FP=[0,1,2],FPR=[0,1/3,2/3],TPR=[1/3,2/3,1]),r'TPR=\frac{TP}{TP+FN},\quad FPR=\frac{FP}{FP+TN}')
add('M09',dict(positive=[.9,.7,.3],negative=[.8,.4,.1]),dict(wins=6,pairs=9,AUC=.6666667,gini=.3333333),r'AUC=\frac{Wins+\tfrac12Ties}{N_+N_-},\quad Gini=2AUC-1')
add('M10',dict(defaultCounts=[5,12,18,20],otherCounts=[2,12,40,80],defaults=20,others=80),dict(TPR=[.25,.6,.9,1],FPR=[.025,.15,.5,1],gaps=[.225,.45,.4,0],KS=.45,cutoff=2),r'KS=\max_t|TPR(t)-FPR(t)|')
add('M11a',dict(labels=[1,0,1,0,0,1],fraud=3),dict(captured=[1,1,2,2,2,3],precision=[1,.5,2/3,.5,.4,.5],recall=[1/3,1/3,2/3,2/3,2/3,1]),r'C_K=\sum_{i=1}^Ky_i,\quad P@K=\frac{C_K}{K},\quad R@K=\frac{C_K}{F}')
add('M11b',dict(precisions=[1,2/3,.5],delta=1/3,starts=[1,.5,.4],ends=[1,2/3,.5]),dict(AP=.7222222,areas=[1/3,.1944444,.15],trapezoid=.6777778),r'AP=\sum_j\Delta R_jP_j,\quad Area_{trap}=\sum_j\Delta R_j\frac{P_{start,j}+P_{end,j}}{2}')
add('M12',dict(K5=5,caught5=3,K10=10,caught10=5,fraud=8,cost=2),dict(P5=.6,R5=.375,P10=.5,R10=.625,extraReviews=5,extraFrauds=2,extraCost=10,perExtra=5),r'P@K=\frac{TP_K}{K},\quad R@K=\frac{TP_K}{F}')
add('M13',dict(N=1000,fraud=20,K=50,caught=15),dict(prevalence=.02,precision=.3,lift=15,gain=.75,random=1,reviewShare=.05),r'Lift@K=\frac{Precision@K}{F/N},\quad Gain@K=\frac{TP_K}{F}')
add('M14',dict(counts=[100,100,100],predicted=[.05,.1,.2],defaults=[3,10,30],loss=4000),dict(expected=[5,10,20],observed=[.03,.1,.3],gaps=[-.02,0,.1],expectedTotal=35,actualTotal=43,EL=140000,realized=172000,difference=32000),r'ExpectedDefaults_b=n_b\bar p_b,\quad ObservedRate_b=\frac{d_b}{n_b}')
add('M15',dict(predicted=[.1,.8,.6,.2],outcomes=[0,1,0,0],baseline=.25),dict(terms=[.01,.04,.36,.04],brier=.1125,baseline=.1875,largest=.36),r'Brier=\frac1N\sum_i(p_i-y_i)^2')
add('M16',dict(outcomes=[1,0,0],A=[.8,.1,.99],B=[.8,.1,.6],threshold=.5),dict(LLA=1.6446,LLB=.4149,errors=1),r'LogLoss=-\frac1N\sum_i\left[y_i\ln p_i+(1-y_i)\ln(1-p_i)\right]')
add('M17a',dict(TPA=15,FPA=35,FNA=5,TPB=18,FPB=82,FNB=2,cFN=500,cFP=4,capacity=75),dict(costA=2640,costB=1328,savings=1312,volumeA=50,volumeB=100,excess=25),r'C=c_{FN}FN+c_{FP}FP,\quad V=TP+FP\le H')
add('M17b',dict(cFN=500,cFP=4,probs=[.005,.01,.1]),{'threshold':.0079365,'pass':[2.5,5,50],'review':[3.98,3.96,3.6]},r'C_{pass}=500p,\quad C_{review}=4(1-p),\quad p^*=\frac{4}{504}',units=dict(threshold='proportion'))
add('M18',dict(matrix=[8,1,1,1,3,0,2,0,0]),dict(perClass=[.7619048,.75,0],macro=.5039683,weighted=.6636905,micro=.6875,TP=11,FP=5,FN=5),r'F1_c=\frac{2TP_c}{2TP_c+FP_c+FN_c},\quad F1_{macro}=\frac1C\sum_cF1_c')
add('M19',dict(NA=1000,NB=1000,approvedA=600,approvedB=400,repayA=800,repayB=500,TPA=560,TPB=300),dict(selectionA=.6,selectionB=.4,ratio=.6666667,TPRA=.7,TPRB=.6,gap=.1,FPRA=.2,FPRB=.2),r'SR_g=\frac{Approvals_g}{N_g},\quad TPR_g=\frac{TP_g}{P_g},\quad FPR_g=\frac{FP_g}{N_g-P_g}')
add('M20',dict(actual=[100,120,80,150],predicted=[90,130,100,140],baseline=[100,100,100,100]),dict(MAE=12.5,baseline=22.5,reduction=.4444444,dollars=10000),r'MAE=\frac1n\sum_i|y_i-\hat y_i|')
add('M21',dict(A=[10,10,10,10],B=[0,0,0,-30]),dict(MAEA=10,MAEB=7.5,RMSEA=10,RMSEB=15),r'RMSE=\sqrt{\frac1n\sum_i e_i^2}')
add('M22',dict(actual=[100,120,80,150],predicted=[90,130,100,140],history=[80,100,120,140]),dict(MAE=12.5,MAPE=.125,WAPE=.1111111,naiveScale=20,MASE=.625),[r'MAPE=\frac1n\sum_i\frac{|y_i-\hat y_i|}{|y_i|}',r'WAPE=\frac{\sum_i|y_i-\hat y_i|}{\sum_i|y_i|},\quad MASE=\frac{MAE_{test}}{MAE_{naive,train}}'],units=dict(MAPE='proportion',WAPE='proportion'))
add('M23',dict(actual=[100,120,80,150],predicted=[90,130,100,140]),dict(actualMean=112.5,SSE=700,SST=2675,R2=.7383178),r'R^2=1-\frac{\sum_i(y_i-\hat y_i)^2}{\sum_i(y_i-\bar y)^2}')
add('M24',dict(lower=[90,100,85,130,100],upper=[120,120,105,160,110],actual=[110,125,95,150,105],widen=10),dict(coverage=.8,width=22,wideCoverage=1,wideWidth=42),r'Coverage=\frac1n\sum_i\mathbf1[L_i\le y_i\le U_i],\quad Width=\frac1n\sum_i(U_i-L_i)',units=dict(coverage='proportion',wideCoverage='proportion'))
add('M25',dict(tau=.95,forecast=130,actual=[150,120,130],equalError=10),dict(losses=[19,.5,0],average=6.5,under=9.5,over=.5,ratio=19),r'L_\tau(y,q)=\begin{cases}\tau(y-q)&y\ge q\\(1-\tau)(q-y)&y<q\end{cases}')
add('M26',dict(a=[2,4,6],b=[5,4,3]),dict(scores=[.6,0,-.5],mean=.0333333),r's_i=\frac{b_i-a_i}{\max(a_i,b_i)}')
add('M27a',dict(values=[1,2,8,9]),dict(c=5,c1=1.5,c2=8.5,I1=50,I2=1,I3=.5,reduction12=49,reduction23=.5),r'I_K=\sum_{j=1}^K\sum_{i\in C_j}(x_i-\mu_j)^2')
add('M27b',dict(overlap=[2,1,1,2]),dict(S=2,R=6,C=6,T=15,chance=2.4,ARI=-.1111111),r'ARI=\frac{S-RC/T}{(R+C)/2-RC/T}')
add('M28',dict(found=[1,1],relevant=[2,1],K=3),dict(recalls=[.5,1],precision=[1/3,1/3],meanRecall=.75,meanPrecision=1/3),r'Recall@K=\frac{RetrievedRelevant}{AllRelevant},\quad ContextPrecision@K=\frac{RetrievedRelevant}{K}')
add('M29a',dict(ranks=[1,2,4,0],newRank=2),dict(RR=[1,.5,.25,0],MRR=.4375,newMRR=.5625,improvement=.125),r'RR_q=\begin{cases}1/rank_q&\text{found}\\0&\text{not found}\end{cases},\quad MRR=\frac1Q\sum_qRR_q')
add('M29b',dict(grades=[1,3,0]),dict(DCG=5.4165,IDCG=7.6309,nDCG=.7098),r'DCG@K=\sum_{i=1}^K\frac{2^{rel_i}-1}{\log_2(i+1)},\quad nDCG@K=\frac{DCG@K}{IDCG@K}')
add('M30',dict(revenueOld=100,revenueNew=120,supported=3,claims=5,correctCitations=2,citations=4,correctFigures=3,figures=4),dict(growth=.2,faithfulness=.6,citation=.5,numerical=.75),r'Faithfulness=\frac{SupportedClaims}{AllClaims},\quad CitationCorrectness=\frac{CorrectPairs}{AllPairs}')
add('M31',dict(returnA=.09,returnB=.11,rf=.03,volA=.12,volB=.2,downA=.06,downB=.08),dict(excessA=.06,excessB=.08,sharpeA=.5,sharpeB=.4,sortinoA=1,sortinoB=1),r'Sharpe=\frac{\bar r-r_f}{\sigma},\quad Sortino=\frac{\bar r-target}{\sigma_{downside}}')
add('M32a',dict(values=[100,120,90,110,80,125]),dict(peaks=[100,120,120,120,120,125],drawdowns=[0,0,.25,1/12,1/3,0],MDD=1/3,finalReturn=.25),r'H_t=\max_{u\le t}V_u,\quad DD_t=\frac{H_t-V_t}{H_t},\quad MDD=\max_t DD_t')
add('M32b',dict(current=[.6,.3,.1],proposed=[.4,.4,.2],alternative=[.55,.35,.1],portfolio=1000000,costRate=.001,cap=.5),dict(changes=[-.2,.1,.1],turnover=.2,gross=400000,cost=400,violation=.05,violationDollars=50000),r'Turnover=\frac12\sum_i|w_i^{new}-w_i^{old}|,\quad Cost=GrossTradedValue\times c')
add('M32c',dict(fund=[.03,.01,.04,0],benchmark=[.02,.02,.03,.01],periods=12),dict(active=[.01,-.01,.01,-.01],mean=0,squares=.0004,monthly=.011547,annual=.04),r'TE=\sqrt{\frac{\sum_t(a_t-\bar a)^2}{n-1}},\quad TE_{annual}=TE_{monthly}\sqrt{12}',units=dict(monthly='proportion',annual='proportion'))
add('M33',dict(losses=[10,0,5,20,1,7,3,6,2,4],confidence=.8),dict(sorted=[0,1,2,3,4,5,6,7,10,20],VaR=7,ES=15,exceed=.2),r'VaR_p=L_{(\lceil pN\rceil)},\quad ES_p=\operatorname{mean}(\text{worst }(1-p)N\text{ losses})')
add('M34',dict(N=2500,breaches=250,newN=10000),dict(p=.1,SE=.006,lower=.08824,upper=.11176,newSE=.003),r'\hat p=\frac{k}{N},\quad SE=\sqrt{\frac{\hat p(1-\hat p)}{N}},\quad CI=\hat p\pm1.96SE',units={k:'proportion' for k in ['p','SE','lower','upper','newSE']})
add('M35',dict(exceptions=10,days=250,confidence=.99),dict(observed=.04,nominal=.01,expected=2.5,ratio=4),r'ExceptionRate=\frac{k}{N},\quad ExpectedCount=N(1-p)')
add('M36',dict(costs=[300,200,400],baseline=1200,hindsight=700,notional=1000000),dict(cost=900,reward=-900,saving=300,regret=200,savingBps=3,regretBps=2),r'Reward=-\sum_tCost_t,\quad Regret=Cost_{policy}-Cost_{best\ feasible}',units=dict(savingBps='bps',regretBps='bps'))
add('M37',dict(tasks=100,completed=90,verified=95,unsafe=4,executed=0,calls=200,errors=10),dict(success=.9,verification=.95,unsafeAttempt=.04,unsafeExecution=0,toolError=.05),r'Success=\frac{CorrectVerifiedCompletions}{Tasks},\quad UnsafeAttemptRate=\frac{TasksWithUnsafeAttempt}{Tasks}')
add('M38',dict(current=[.2,.8],reference=[.5,.5]),dict(terms=[.27489,.141],PSI=.41589,shift=.3),r'PSI=\sum_i(A_i-E_i)\ln\frac{A_i}{E_i}')
add('M39a',dict(counts=[95,4,1],times=[40,180,1000],deadline=100),dict(total=5520,mean=55.2,p95=40,p99=180,late=.05,onTime=.95),r'\bar\ell=\frac{\sum_g n_g\ell_g}{N},\quad \ell_p=\ell_{(\lceil pN\rceil)}')
add('M39b',dict(perMinute=12000,arrival=250,minutes=10,alerts=500,analysts=15,pace=20,days=3),dict(capacity=200,requestBacklog=30000,human=300,dailyBacklog=200,alertBacklog=600,requiredPace=100/3),r'Backlog_{API}=(ArrivalRate-Capacity)T,\quad HumanCapacity=N_{analysts}CasesPerAnalyst')
add('M39c',dict(requests=1000,spend=500,abstained=100,reviewCost=3,autoCorrect=800),dict(abstention=.1,coverage=.9,reviewSpend=300,totalCost=800,perRequest=.8,correct=900,perCorrect=8/9,autoAccuracy=8/9),r'CostPerCorrect=\frac{ModelSpend+ReviewSpend}{CorrectAutomatic+CorrectManual}')
add('M39d',dict(days=30,downtime=90,objective=.999),dict(scheduled=43200,available=43110,availability=.9979167,allowed=43.2,excess=46.8),r'Availability=\frac{ScheduledTime-Downtime}{ScheduledTime},\quad Allowance=ScheduledTime(1-SLO)')

# Supplemental source equations checked against all 86 rasterized formula slides.
EXTRA_FORMULAS = {
'A02':[r'\Delta G=G_{parent}-G_{split}',r'p_{forest}=\frac{1}{B}\sum_{b=1}^{B}p_b'],
'A04':[r'd_{ij}=|x_i-\mu_j|'],
'A08':[r'z_+=2h,\quad z_0=0,\quad z_-=-2h'],
'A09':[r'q\cdot d=q_1d_1+q_2d_2,\quad \|d\|=\sqrt{d_1^2+d_2^2}',r'g\%=100g'],
'S01':[r'\operatorname{Table\ integrity}=\frac{N_{intact}}{N_{tables}},\quad \operatorname{Section\ coverage}=\frac{N_{present}}{N_{required}}',r'\operatorname{Numeric\ extraction\ error}=\frac{N_{wrong}}{N_{cells}},\quad \operatorname{Correctness}=1-\frac{N_{wrong}}{N_{cells}}'],
'A10':[r'\sigma_p^2=w^2\sigma_s^2+(1-w)^2\sigma_b^2+2w(1-w)\rho\sigma_s\sigma_b,\quad \sigma_p=\sqrt{\sigma_p^2}',r'w\in\{0.40,0.50,0.60\},\quad \mu_p\ge0.07',r'\operatorname{Stock\ dollars}=Vw,\quad\operatorname{Bond\ dollars}=V(1-w)'],
'A11':[r'T=r+\gamma\max_a Q(s^{\prime},a),\quad\delta=T-Q_{old}'],
'S03':[r'q_u=Q-\sum_iq_i,\quad\operatorname{Completion}=\frac{\sum_iq_i}{Q},\quad V_0=QP_0'],
'A12':[r'\bar L=\frac1N\sum_jL_j,\quad\hat p_{breach}=\frac{\sum_j\mathbf1[L_j>B]}{N}'],
'M01':[r'TP+FN=F,\quad TP+FP=A,\quad TN+FP=N-F,\quad N=TP+FP+FN+TN'],
'M02':[r'\operatorname{Mistakes}=FP+FN'],
'M03':[r'\operatorname{Recall}=\frac{TP}{TP+FN},\quad\operatorname{Specificity}=\frac{TN}{TN+FP}'],
'M04':[r'C_{review}=c(TP+FP)'],
'M05':[r'FN=F-TP'],
'M06':[r'\operatorname{Specificity}+FPR=1,\quad\operatorname{Expected\ false\ alerts}=N_{legit}FPR'],
'M07':[r'\operatorname{Arithmetic\ mean}=\frac{P+R}{2}'],
'M08':[r'\hat y_i=\mathbf1[s_i\ge t]'],
'M10':[r'D(t)=\frac{TP(t)}{N_+},\quad L(t)=\frac{FP(t)}{N_-}'],
'M11b':[r'\Delta R_j=R_j-R_{j-1}'],
'M12':[r'\operatorname{Extra\ cost\ per\ extra\ fraud}=\frac{c(K_2-K_1)}{C_{K_2}-C_{K_1}}'],
'M13':[r'\pi=\frac FN,\quad\operatorname{Reviewed\ share}=\frac KN,\quad E[C_{random}]=K\pi'],
'M14':[r'EL=L\sum_bE_b,\quad L_{actual}=L\sum_bd_b'],
'M18':[r'F1_{weighted}=\frac{\sum_cn_cF1_c}{N}',r'F1_{micro}=\frac{2\sum_cTP_c}{2\sum_cTP_c+\sum_cFP_c+\sum_cFN_c}'],
'M19':[r'\operatorname{Ratio}_{B/A}=\frac{\operatorname{Selection}_B}{\operatorname{Selection}_A},\quad\Delta TPR=TPR_A-TPR_B'],
'M20':[r'\operatorname{Reduction}=\frac{MAE_{baseline}-MAE_{model}}{MAE_{baseline}}'],
'M21':[r'e_i=\hat y_i-y_i,\quad MAE=\frac1n\sum_i|e_i|'],
'M22':[r'd_{train}=\frac1{T-1}\sum_{t=2}^T|x_t-x_{t-1}|'],
'M23':[r'\bar y=\frac1n\sum_iy_i,\quad SSE=\sum_i(y_i-\hat y_i)^2,\quad SST=\sum_i(y_i-\bar y)^2'],
'M26':[r'\bar s=\frac1n\sum_is_i'],
'M27a':[r'\mu_j=\frac{\sum_{i\in C_j}x_i}{|C_j|}'],
'M27b':[r'\binom n2=\frac{n(n-1)}{2}'],
'M30':[r'\operatorname{Numerical\ accuracy}=\frac{\operatorname{Correct\ financial\ figures}}{\operatorname{All\ evaluated\ financial\ figures}}'],
'M31':[r'\bar r=\frac1n\sum_tr_t,\quad s_r=\sqrt{\frac{\sum_t(r_t-\bar r)^2}{n-1}}',r'd_r=\sqrt{\frac1n\sum_t\min(r_t-r_{target},0)^2}'],
'M32a':[r'\operatorname{Return}=\frac{V_{final}-V_{initial}}{V_{initial}}'],
'M32b':[r'\Delta w_i=w_i^{new}-w_i^{old},\quad\operatorname{Gross\ traded\ dollars}=2V\operatorname{Turnover}',r'\operatorname{Excess}_i=\max(w_i^{new}-u_i,0),\quad\operatorname{Dollar\ excess}_i=V\operatorname{Excess}_i'],
'M33':[r'\operatorname{Exceedance\ fraction}=\frac{\sum_i\mathbf1[L_i>VaR_p]}N'],
'M35':[r'\operatorname{Nominal\ rate}=1-p,\quad\operatorname{Rate\ ratio}=\frac{k/N}{1-p}'],
'M36':[r'\operatorname{Improvement}=C_{TWAP}-C_{policy}',r'\operatorname{Difference}_{bps}=\frac{\operatorname{Dollar\ difference}}V\times10000,\quad\operatorname{Value\ of\ 1bp}=V\times0.0001'],
'M37':[r'\operatorname{Verification}=\frac{N_{check}}{N_{tasks}},\quad\operatorname{Unsafe\ execution\ rate}=\frac{N_{unsafe}}{N_{tasks}},\quad\operatorname{Tool\ error\ rate}=\frac{N_{error}}{N_{calls}}'],
'M39a':[r'\operatorname{Deadline\ failure\ rate}=\frac{N_{late}}N,\quad\operatorname{On-time\ rate}=\frac{N-N_{late}}N'],
'M39b':[r'\mu=\frac{\operatorname{Capacity\ per\ minute}}{60},\quad\operatorname{Backlog}(T)=\max(\lambda-\mu,0)T',r'\operatorname{Alert\ backlog}(D)=\max(A-n_ac_a,0)D,\quad\operatorname{Required\ cases\ per\ analyst}=\frac A{n_a}'],
'M39c':[r'\operatorname{Abstention}=\frac{N_{abstain}}N,\quad\operatorname{Coverage}=\frac{N_{auto}}N,\quad\operatorname{Automatic\ accuracy}=\frac{N_{auto,correct}}{N_{auto}}',r'C_{total}=C_{model}+N_{abstain}C_{human},\quad\operatorname{Cost\ per\ request}=\frac{C_{total}}N'],
'M39d':[r'T=\operatorname{Days}\times24\times60,\quad\operatorname{Excess\ downtime}=\max(D-T(1-a^*),0)']
}
SPECS['S01']['latex']=EXTRA_FORMULAS.pop('S01')
for key,formulae in EXTRA_FORMULAS.items():SPECS[key]['latex'].extend(formulae)

# Learner-facing copy is authored per exercise, never inferred from a shared step ID.
import json as _json
from pathlib import Path as _Path
_EXERCISE_COPY = _json.loads((_Path(__file__).parent / 'exercise-copy.json').read_text())
if set(_EXERCISE_COPY) != set(SPECS):
    raise ValueError('Exercise copy must cover every numerical contract exactly once')
for exercise_id, spec in SPECS.items():
    copy = _EXERCISE_COPY[exercise_id]
    if set(copy['labels']) != set(spec['givens']):
        raise ValueError('Input-label coverage differs for ' + exercise_id)
    if set(copy['steps']) != {step['id'] for step in spec['steps']}:
        raise ValueError('Step-copy coverage differs for ' + exercise_id)
    spec['labels'] = copy['labels']
    spec['learning'] = copy
    for step in spec['steps']:
        authored = copy['steps'][step['id']]
        step.update(authored)
        step['mistakes'] = [dict(pattern='recompute', message=authored['hints'][0])]
