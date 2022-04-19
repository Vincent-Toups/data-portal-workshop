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
             intermediate_size=3):
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

def build_vae(data_columns=ae_columns,
             n_intermediate=1,
             encoded_dimension=2,
             intermediate_size=3):
    n_input = len(data_columns);

    input = keras.Input(shape=(n_input,));
    e = layers.Dropout(0.1, input_shape=(n_input,))(input);
    e = layers.GaussianNoise(0.05)(e);
    e = layers.Dense(intermediate_size, activation='relu')(e);
    for i in range(n_intermediate-1):
        e = layers.Dense(intermediate_size, activation='relu')(e);

    mu_layer = layers.Dense(encoded_dimension, name="encoder_mu")(e);
    log_var_layer = layers.Dense(encoded_dimension, name="encoder_log_var")(e);

    def sampler(mu_log_var):
        mu, log_var = mu_log_var;
        eps = backend.random_normal(backend.shape(mu), mean=0.0, stddev=1.0)
        sample = mu + backend.exp(log_var/2) * eps
        return sample

    encoder_output = layers.Lambda(sampler, name="encoder_output")([mu_layer, log_var_layer])

    d = layers.Dense(intermediate_size, activation='relu')(encoder_output);
    for i in range(n_intermediate-1):
        d = layers.Dense(intermediate_size, activation='relu')(d);

    d = layers.Dense(n_input, activation='linear')(d);

    ae = keras.Model(input, d);
    encoder = keras.Model(input, encoder_output);
    ae.compile(optimizer='adam', loss='mean_squared_error');

    return (ae,encoder)

(ae, enc) = build_vae();
ae.fit(sdf, sdf, epochs=30000, batch_size=25, shuffle=True, verbose=2);

sdf.to_csv("derived_data/normalized_demographics.csv", index=False);
ae.save("models/demographics-ae")
enc.save("models/demographics-enc")


