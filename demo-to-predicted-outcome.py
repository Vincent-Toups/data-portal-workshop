import keras
from keras import layers, backend
import pandas as pd
import numpy as np
from dfply import *
from plotnine import *
from sklearn.cluster import SpectralClustering
from numpy.random import seed
from tensorflow.random import set_seed as tf_set_seed

seed(1000);
tf_set_seed(1000);

data = pd.read_csv("source_data/demographics.csv");

ae_columns = ['education', 'hispanic',
              'employment_status', 'exercise', 'handedness', 'sses',
              'married_or_living_as_marri', 'age', 'weight', 'gender',
              'backpain_length','american_alaskan_native',
              'asian_or_pacific',
              'black_nh',
              'white_nh',
              'other',
              'group_1', 'group_2', 'group_3'];

def one_hot_encode_ethnicity(df):    
    ethnicities = ['american_alaskan_native',
                   'asian_or_pacific',
                   'black_nh',
                   'white_nh',
                   'other'];
    i = 1;
    for ethnicity_code in ethnicities:
        df[ethnicity_code] = (df['ethnicity'] == i)*1;
        i = i + 1;
    return df;

def one_hot_encode_group(df):    
    groups = [1,2,3];
    for g in groups:
        df[f"group_{g}"] = (df['group'] == g)*1;
    return df;

def pre_process_data(df,data_columns=ae_columns):
    subdf = one_hot_encode_ethnicity(df);
    subdf = one_hot_encode_group(df);
    subdf = subdf[data_columns];
    for c in data_columns:
        c_values = np.nan_to_num(subdf[c],copy=True, nan=-1.0);        
        mn = c_values.min();
        mx = c_values.max();
        if mx-mn == 0:
            subdf[c] = 0;
        else:
            subdf[c] = (c_values - mn)/(mx-mn);
    subdf['id'] = df['id'];
    return subdf;

outcomes = pd.read_csv("derived_data/clinical_outcomes-d3.csv") >> select(X.id, X.group, X.bpi_intensity, X.time) >> mutate(bpi_intensity = X.bpi_intensity/10.0);

total_subjects = outcomes >> group_by(X.id) >> summarise(count=X.group.size);
total_subjects = total_subjects[total_subjects['count']==7] >> select(X.id);

outcomes = outcomes.join(total_subjects.set_index('id'),on=["id"],how="inner")
data = data.join(total_subjects.set_index('id'), on=['id'], how="inner");

sdf = pre_process_data(data);
outcomes_w = outcomes.pivot(index=['id'],columns='time',values='bpi_intensity');

all_data = sdf.join(outcomes_w, on=['id'])
def rename_number_columns(df):
    cols = {};
    for k in [-1,0,1,2,3,6,12]:
        cols[k] = f"time_{k}"
    return df.rename(columns=cols);

all_data = rename_number_columns(all_data);

all_data[all_data.isna().any(axis=1)]


def build_nn(n_input=len(ae_columns),
             n_intermediate=3,
             w_intermediate=10,
             n_output=7):

    input = keras.Input(shape=(n_input,));
    e = layers.Dropout(0.1, input_shape=(n_input,))(input);
    e = layers.Dense(w_intermediate, activation='relu')(e);
    for i in range(n_intermediate-1):
        e = layers.Dense(w_intermediate, activation='relu')(e);

    e = layers.Dense(n_output, activation='relu')(e);        
    nn = keras.Model(input, e);
    nn.compile(optimizer='adam', loss='mean_squared_error');

    return nn

y = all_data[['time_-1', 'time_0','time_1', 'time_2', 'time_3', 'time_6', 'time_12']];
X = all_data[['education', 'hispanic', 'employment_status', 'exercise', 'handedness',
              'sses', 'married_or_living_as_marri', 'age', 'weight', 'gender',
              'backpain_length', 'american_alaskan_native', 'asian_or_pacific',
              'black_nh', 'white_nh', 'other','group_1','group_2','group_3']];

nn = build_nn();
nn.fit(X,y, batch_size=25, epochs=15000, shuffle=True, verbose=2);
 
predicted = pd.DataFrame(nn.predict(X),columns=['time_-1', 'time_0','time_1', 'time_2', 'time_3', 'time_6', 'time_12']);
predicted['id'] = list(all_data['id'])

predicted = predicted.melt(id_vars='id');
