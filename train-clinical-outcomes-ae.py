import keras
from keras import layers, backend
import pandas as pd
import numpy as np
from dfply import *
from plotnine import *
from numpy.random import seed
from tensorflow.random import set_seed as tf_set_seed

seed(1000);
tf_set_seed(1000);


df = pd.read_csv("derived_data/clinical-outcomes-preprocessed.csv");

standard_data_columns = ['pain_avg', 'bpi_intensity',
                                      'bpi_interference', 'odi', 'promis_dep', 'promis_anger',
                                      'promis_anxiety', 'promis_sleep', 'pcs',
                                      'tsk11', 'pgic'];

def pre_process_data(df,data_columns=standard_data_columns):
    subdf = df[data_columns];
    for c in data_columns:
        c_values = np.nan_to_num(subdf[c],copy=True, nan=-1.0);        
        mn = c_values.min();
        mx = c_values.max();
        subdf[c] = (c_values - mn)/(mx-mn);

    return subdf;

sdf = pre_process_data(df);

def build_nn(data_columns=standard_data_columns,
             n_intermediate=2,
             encoded_dimension=2,
             intermediate_size=6):
    n_input = len(data_columns);

    input = keras.Input(shape=(n_input,));
    e = layers.Dropout(0.1, input_shape=(n_input,))(input);
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



def build_vae(data_columns=standard_data_columns,
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


early_stopper = keras.callbacks.EarlyStopping(monitor='loss', patience=500, min_delta=0.0000001);

(ae, enc) = build_vae();
ae.fit(sdf, sdf, epochs=50000, batch_size=250, shuffle=True, verbose=1, callbacks=[early_stopper]);

predictions = pd.DataFrame(ae.predict(sdf), columns=sdf.columns);

def plot_res(real, prediction, col):
    df = pd.DataFrame({"real":real[col],
                    "prediction":prediction[col]});
    plt = (ggplot(df, aes("real","prediction")) +
           geom_point() +
           xlim(0,1) +
           ylim(0,1) +
           coord_fixed() +
           labs(x="real",y="predicted",title=col));
    plt.save(f"figures/nn_predictions_{col}.png");

for c in sdf.columns:
    plot_res(sdf, predictions, c);

proj = pd.DataFrame(enc.predict(sdf), columns=["AE1","AE2"]);

sdf_ex = (sdf >> mutate(AE1=proj['AE1'], AE2=proj['AE2']))

df_ex = (df >> mutate(AE1=proj['AE1'], AE2=proj['AE2']));

(ggplot(sdf_ex,aes('AE1','AE2')) + geom_point(aes(color='pain_avg'))).save(f"figures/ae-projection.png");

ae.save("models/clinical-outcomes-ae")
enc.save("models/clinical-outcomes-enc")
df_ex.to_csv("derived_data/clinical-outcomes-with-ae.csv", index=False);

