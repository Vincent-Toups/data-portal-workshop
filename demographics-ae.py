import keras
from keras import layers
import pandas as pd
import numpy as np
from dfply import *
from plotnine import *
from sklearn.cluster import SpectralClustering

data = pd.read_csv("source_data/demographics.csv");

ae_columns = ['education', 'ethnicity', 'hispanic',
              'employment_status', 'exercise', 'handedness', 'sses',
              'married_or_living_as_marri', 'age', 'weight', 'gender',
              'backpain_length','american_alaskan_native',
              'asian_or_pacific',
              'black_nh',
              'white_nh',
              'other'];

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

def pre_process_data(df,data_columns=ae_columns):
    subdf = one_hot_encode_ethnicity(df);
    subdf = subdf[data_columns];
    for c in data_columns:
        c_values = np.nan_to_num(subdf[c],copy=True, nan=-1.0);        
        mn = c_values.min();
        mx = c_values.max();
        subdf[c] = (c_values - mn)/(mx-mn);
    return subdf;

    

sdf = pre_process_data(data);

def build_nn(data_columns=ae_columns,
             n_intermediate=1,
             encoded_dimension=2,
             intermediate_size=6):
    n_input = len(data_columns);

    input = keras.Input(shape=(n_input,));
    e = layers.Dropout(0.1, input_shape=(n_input,))(input);
    e = layers.GaussianNoise(0.05)(e);
    e = layers.Dense(intermediate_size, activation='relu')(e);
    for i in range(n_intermediate-1):
        e = layers.Dense(intermediate_size, activation='relu')(e);

    e = layers.Dense(encoded_dimension, activation='relu')(e);        

    d = layers.Dense(intermediate_size, activation='relu')(e);
    for i in range(n_intermediate-1):
        d = layers.Dense(intermediate_size, activation='relu')(d);

    d = layers.Dense(n_input, activation='linear')(d);

    ae = keras.Model(input, d);
    encoder = keras.Model(input, e);
    ae.compile(optimizer='adam', loss='mean_absolute_error');

    return (ae,encoder)

early_stopper = keras.callbacks.EarlyStopping(monitor='loss', patience=500, min_delta=0.0000001);

(ae, enc) = build_nn();
ae.fit(sdf, sdf, epochs=10000, batch_size=250, shuffle=True, verbose=2);

proj = pd.DataFrame(enc.predict(sdf),columns=['AE1','AE2'])

sc = SpectralClustering(n_clusters=4);
proj['cluster'] = sc.fit_predict(proj);


plt = (ggplot(proj,aes('AE1','AE2')) + geom_point(aes(color="factor(cluster)")));
plt.save("figures/demo-projection.png")

data['cluster'] = proj['cluster'];
data['AE1'] = proj['AE1'];
data['AE2'] = proj['AE2'];

demographic_reduction 


