import networkx as nx
G = nx.Graph()
edges = [("acct_A","device_7"),("acct_B","device_7"),
    ("acct_A","merchant_X"),("acct_B","merchant_X"),
    ("acct_B","address_4"),("acct_C","address_4"),("acct_D","device_99")]
G.add_edges_from(edges)
components = sorted(nx.connected_components(G),key=len,reverse=True)
print("Largest component:",sorted(components[0]))
print("Degrees:",sorted(G.degree,key=lambda x:x[1],reverse=True))
print("A/B common neighbors:",len(list(nx.common_neighbors(G,"acct_A","acct_B"))))
print("PageRank:",{k:round(v,3) for k,v in nx.pagerank(G).items()})
print("Baseline: account-only graph has no edges and therefore no shared-device evidence.")
