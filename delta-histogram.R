library(tidyverse);
d <- read_csv("derived_data/clinical_outcomes-d3.csv");
democc <- read_csv("derived_data/demographic_ae.csv") %>% select(-AE1, -AE2) %>%
    rename(demo_cluster=cluster);
d <- d %>% inner_join(democc, by="id");




keepers <- d %>% group_by(id, group) %>% tally() %>% filter(n==7) %>% pull(id);

with_deltas <- d %>%
    filter(id %in% keepers) %>% 
    select(id, group, redcap_event_name, time, bpi_intensity, demo_cluster) %>%
    group_by(id, group, demo_cluster) %>%
    arrange(time) %>%
    mutate(bpi_intensity_delta = bpi_intensity - lag(bpi_intensity)) %>%
    ungroup() %>% arrange(id, group, demo_cluster, time);

nt_deltas <- with_deltas %>% filter(group==3);
plt = ggplot(nt_deltas, aes(bpi_intensity_delta)) + geom_histogram()
ggsave("figures/soc_deltas.png", plot=plt);

plt = ggplot(with_deltas, aes(bpi_intensity_delta)) +
    geom_histogram(bins=20,aes(fill=factor(group)),alpha=0.5, position="dodge")
ggsave("figures/all_deltas.png", plot=plt);

ordered = nt_deltas %>% select(bpi_intensity_delta) %>% arrange(desc(bpi_intensity_delta)) %>%
    mutate(index=1:length(bpi_intensity_delta)) %>%
    
    with_deltas %>% group_by(group) %>% summarize(m=mean(bpi_intensity_delta, na.rm = T));
