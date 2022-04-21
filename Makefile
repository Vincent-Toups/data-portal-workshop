.PHONY: clean
.PHONY: d3-vis
.PHONY: demo-ae-vis

clean:
	rm -rf models
	rm -rf figures
	rm -rf derived_data
	rm -rf sentinels
	rm -rf .created-dirs

.created-dirs:
	mkdir -p models
	mkdir -p figures
	mkdir -p derived_data
	mkdir -p sentinels
	touch .created-dirs

# It is usefual to propogate the panas_na and panas_pa values forward
# in time for subsequent analysis which attempts to cluster the state
# of each person in the study regardless of time so that we can track
# their progress through a lower dimensional space.
derived_data/clinical-outcomes-preprocessed.csv: .created-dirs pre-process.R source_data/clinical_outcomes.csv
	Rscript pre-process.R

# Here we train and serialize an auto-encoder (and an encoder) for the
# state of patients (regardless of time). The encoder projects patient
# state down to 2 dimensions. Hopefully this projection allows us to
# understand their progress in a simple way. In practice it turns out
# that this encoder just encodes average pain, so we don't find it all
# that useful.
models/clinical-outcomes-ae\
 models/clinical-outcome-enc\
 derived_data/clinical-outcomes-with-ae.csv: \
  train-clinical-outcomes-ae.py\
  .created-dirs\
  derived_data/clinical-outcomes-preprocessed.csv\
  train-clinical-outcomes-ae.py
	python3 train-clinical-outcomes-ae.py

# Attempt a clustering based on clinical outcomes but ignoring
# time. See above. Not all that useful. There aren't distinct clusters
# except in the sense that people report different levels of pain on a
# quantized scale. Not very useful.
derived_data/clinical-outcomes-with-clustering.csv\
 figures/clinical-outcomes-clustering.png:\
  cluster-clinical-outcomes.py\
  .created-dirs\
  derived_data/clinical-outcomes-with-ae.csv
	python3 cluster-clinical-outcomes.py

# Plots of various non-projected properties of clinical outcomes per
# cluster. Not very interesting because the clusters are not very
# interesting and the AE projection is just (roughly) back pain
# intensity.
# Note this uses a sentinal value because we produce many scripts.
sentinels/cluster-plots.txt: .created-dirs\
 derived_data/clinical-outcomes-with-clustering.csv\
 cluster-plots.R
	Rscript cluster-plots.R

# Similar to above.
sentinels/boxplots.txt: .created-dirs\
 source_data/clinical_outcomes.csv\
 box-scatters.R
	Rscript box-scatters.R


# Augment the clinical outcomes data (with its AE projection) with
# time points so that we can view them in a d3 visualization. Not
# useful.
derived_data/clinical_outcomes-d3.csv: .created-dirs\
 derived_data/clinical-outcomes-with-clustering.csv\
 augment-with-experimental-time.R\
 derived_data/demographic_ae.csv
	Rscript augment-with-experimental-time.R

# Train a (variational) auto-encoder for demographic data. This allows
# us to see some obvious demographic groups and makes (tuning)
# clustering easier. See "explain_encoding.R" for code which helps us
# understand what these clusters represent.  Produce two targets here:
# One with the normalized data (sdf) and one with the original data.
models/demographics-ae models/demographics-enc derived_data/normalized_demographics.csv: demographics-ae.py\
 source_data/demographics.csv
	python3 demographics-ae.py

derived_data/demographic_ae_sdf.csv derived_data/demographic_ae.csv figures/demo-projection.png: demographic-clustering.py\
 models/demographics-ae\
 models/demographics-enc\
 derived_data/normalized_demographics.csv
	python3 demographic-clustering.py

# Since our clustering is based on a variational auto-encoder it is
# difficult to understand what the clusters represent.  Here we use
# gradient boosting to train a tree model on the raw data to predict
# each cluster. From this model we can extract the important variables
# for each cluster and report their medians. We simply save the labels
# here for future use.
derived_data/cluster_labels.csv: .created-dirs explain_encoding.R derived_data/demographic_ae_sdf.csv
	Rscript explain_encoding.R

# Produce a figure which shows the clinical outcomes for our
# demographic clusters. Use the labels we calculated above to make the
# results comprehensible.
figures/outcomes_by_demographic_clustering.png: .created-dirs\
 demo-outcomes.R\
 derived_data/clinical-outcomes-with-clustering.csv\
 derived_data/cluster_labels.csv\
 derived_data/demographic_ae.csv
	Rscript demo-outcomes.R

# dummy target to show a d3 visualization.
d3-vis: derived_data/clinical_outcomes-d3.csv
	python3 -m http.server 8888

demo-ae-vis:
	lighttpd -D -f lighttpd.conf

derived_data/meta-data.R: source_data/clinical_outcomes.csv source_data/demographics.csv gen-meta-data.R
	Rscript gen-meta-data.R


