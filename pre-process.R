library(tidyverse);

df <- read_csv("source_data/clinical_outcomes.csv");
just_panas <- df %>% select(id, redcap_event_name, panas_pa, panas_na) %>% filter(complete.cases(.))

panas_averages <- just_panas %>% group_by(id) %>% summarize(panas_pa=mean(panas_pa), panas_na=mean(panas_na));

dfe <- df %>% left_join(panas_averages, by="id", suffix=c("","_fill")) %>%
    mutate(panas_pa=panas_pa_fill,
           panas_na=panas_na_fill) %>%
    select(-panas_na_fill, -panas_pa_fill);

dfe %>% write_csv("derived_data/clinical-outcomes-preprocessed.csv");
