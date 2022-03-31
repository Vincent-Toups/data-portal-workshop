import keras as k
import pandas as p
import numpy as n
from dfply import *
from plotnine import *
from sklearn.decomposition import PCA

@dfpipe
def dropna_in_column(df,column_name):
    return df.dropna(subset=[column_name]);


data = (p.read_csv("source_data/clinical_outcomes.csv") >> dropna_in_column("group") >> mutate(group = X.group.astype(int)))

initial = data >> mask(X.redcap_event_name == "baseline")

def col_types(df):
    return [(c,type(df[c])) for c in df.columns];

@dfpipe
def numeric_columns(df):
    numerics = ['int16', 'int32', 'int64', 'float16', 'float32', 'float64']
    newdf = df.select_dtypes(include=numerics)
    return newdf

@dfpipe
def drop_na_columns(df):
    return df.dropna(axis=1, how='any')

pca = PCA(n_components = 13);

baseline = data >> mask(X.redcap_event_name=="baseline");

numerical_data = baseline >> numeric_columns() >> drop_na_columns() >> drop(X.id, X.group);

def pcs_names(n):
    return [f'PC{i+1}' for i in range(n)]
                        
transformed = p.DataFrame(pca.fit_transform(numerical_data), columns=pcs_names(pca.n_components));

baseline['PC1'] = list(transformed['PC1']);
baseline['PC2'] = list(transformed['PC2']);


plt = (ggplot(baseline, aes('PC1','PC2',color='pain_avg')) + geom_point());

plt.save(filename="figures/baseline-basic-pca.png");

