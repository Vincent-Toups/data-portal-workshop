import keras
from keras import layers
import pandas as pd
import numpy as np
from dfply import *
import seaborn as sb
from plotnine import *

df = pd.read_csv("source_data/clinical_outcomes.csv");

def pre_process_data(df,data_columns=['pain_avg', 'bpi_intensity',
                                      'bpi_interference', 'odi', 'promis_dep', 'promis_anger',
                                      'promis_anxiety', 'promis_sleep', 'panas_pa', 'panas_na', 'pcs',
                                      'tsk11', 'sopa_emo', 'pgic', 'alcohol', 'opioid',
                                      'cannabis']):
    subdf = df[data_columns];
    for c in data_columns:
        c_values = np.nan_to_num(subdf[c],copy=True, nan=-1.0);        
        mn = c_values.min();
        mx = c_values.max();
        subdf[c] = (c_values - mn)/(mx-mn);

    return subdf;

sdf = pre_process_data(df);

sb.pairplot(sdf).savefig("figures/prepped-pairplot.png");

def build_nn(data_columns=['pain_avg', 'bpi_intensity',
                                      'bpi_interference', 'odi', 'promis_dep', 'promis_anger',
                                      'promis_anxiety', 'promis_sleep', 'panas_pa', 'panas_na', 'pcs',
                                      'tsk11', 'sopa_emo', 'pgic', 'alcohol', 'opioid',
                                      'cannabis'],
             n_intermediate=3,
             encoded_dimension=2,
             intermediate_size=10):
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
    ae.compile(optimizer='adam', loss='mean_squared_error');

    return (ae,encoder)

(ae, enc) = build_nn();
ae.fit(sdf, sdf, epochs=50000, batch_size=250, shuffle=True);

sdf_ae = pd.DataFrame(ae.predict(sdf), columns=sdf.columns).add_prefix('ae_');

both = pd.concat([sdf, sdf_ae], axis=1);
for c in sdf.columns:
    tmp = pd.DataFrame();
    tmp[c] = sdf[c];
    tmp['fit_'+c] = sdf_ae['ae_'+c];
    plt = (ggplot(tmp,aes(c, 'fit_'+c)) + geom_point() + xlim(0,1) + ylim(0,1) + coord_fixed());
    plt.save(f"{c}_predictions.png");

enc_rep = pd.DataFrame(enc.predict(sdf),columns=['AE1', 'AE2']);

df['AE1'] = enc_rep['AE1'];
df['AE2'] = enc_rep['AE2'];

df = df >> arrange(X.id)

plot = (ggplot(df, aes('AE1','AE2')) + geom_path(aes(group='id',color='factor(id)')))
plot.save('figures/ae-output.png');

plot = (ggplot(df, aes('AE1','AE2')) + geom_point(aes(color='factor(id)',shape='redcap_event_name')))
plot.save('figures/ae-output-points.png');
