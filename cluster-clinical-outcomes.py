import pandas as pd
import numpy as np
from dfply import *
from plotnine import *
from sklearn.cluster import SpectralClustering
from sklearn.cluster import DBSCAN

df = pd.read_csv("derived_data/clinical-outcomes-with-ae.csv");

for_clustering = (df >> select(X.AE1, X.AE2));

clusterer = DBSCAN(eps=0.25);
labels = clusterer.fit_predict(for_clustering);
df['cluster'] = labels;

(ggplot(df, aes('AE1','AE2')) + geom_point(aes(color='factor(cluster)'))).save("figures/clinical-outcomes-clustering.png");

df.to_csv("derived_data/clinical-outcomes-with-clustering.csv", index=False);
