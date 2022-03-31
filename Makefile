.PHONY: clean

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

derived_data/clinical-outcomes-preprocessed.csv: .created-dirs pre-process.R source_data/clinical_outcomes.csv
	Rscript pre-process.R

models/clinical-outcomes-ae\
 models/clinical-outcome-enc\
 derived_data/clinical-outcomes-with-ae.csv: \
  train-clinical-outcomes-ae.py\
  .created-dirs\
  derived_data/clinical-outcomes-preprocessed.csv\
  train-clinical-outcomes-ae.py
	python3 train-clinical-outcomes-ae.py

derived_data/clinical-outcomes-with-clustering.csv\
 figures/clinical-outcomes-clustering.png:\
  cluster-clinical-outcomes.py\
  .created-dirs\
  derived_data/clinical-outcomes-with-ae.csv
	python3 cluster-clinical-outcomes.py

sentinels/cluster-plots.txt: derived_data/clinical-outcomes-with-clustering.csv cluster-plots.R
	Rscript cluster-plots.R

sentinels/boxplots.txt: source_data/clinical_outcomes.csv box-scatters.R
	Rscript box-scatters.R

derived_data/clinical_outcomes-d3.csv: derived_data/clinical-outcomes-with-clustering.csv augment-with-experimental-time.R
	Rscript augment-with-experimental-time.R


