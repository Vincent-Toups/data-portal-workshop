library(tidyverse);

df <- read_csv("derived_data/clinical-outcomes-with-clustering.csv");
cluster_labels <- read_csv("derived_data/cluster_labels.csv");

demo <- read_csv("derived_data/demographic_ae.csv") %>% select(id, cluster) %>%
    transmute(id=id, demographic_cluster=cluster);

group_names <- tibble(group=c(1,2,3),
                      group_name=c("PRT","Saline","SOC"));

tidy_up_label <- function(s){
    s %>%
        str_replace("gender\\(1\\.000000\\)","Female") %>%
        str_replace("gender\\(0\\.000000\\)","Male") %>%
        str_replace("married_or_living_as_marri\\(1\\.000000\\)","Married") %>%
        str_replace("married_or_living_as_marri\\(0\\.000000\\)","Unmarried") %>%
        str_replace("white_nh\\(0\\.000000\\)","Nonwhite") %>%
        str_replace("white_nh\\(1\\.000000\\)","White") %>%
        str_replace("Cluster ([0-6])\\.000000:", "Demo Grp \\1 :: ") 
}

demographic_cluster_names <- cluster_labels %>% rename(demographic_cluster=cluster,
                                                       demographic_cluster_name=cluster_label) %>%
    mutate(demographic_cluster_name=tidy_up_label(demographic_cluster_name));



df <- df %>% inner_join(demo, by="id") %>%
    inner_join(group_names, by="group") %>%
    inner_join(demographic_cluster_names, by="demographic_cluster");

useful_events <- c("baseline",
                   "t2_arm_1",
                   "1_month_follow_up_arm_1",
                   "2_month_follow_up_arm_1",
                   "3_month_follow_up_arm_1",
                   "6_month_follow_up_arm_1",
                   "12_month_follow_up_arm_1");

times <- tibble(redcap_event_name=useful_events, time=c(-1,0,1,2,3,6,12));

df <- df %>% inner_join(times, by="redcap_event_name");

big_enoughs <- (demo %>% group_by(demographic_cluster) %>% tally() %>% arrange(desc(n)) %>% pull(demographic_cluster))[1:4]

df <- df %>% filter(demographic_cluster %in% big_enoughs);


group_sums <- df %>% group_by(time, group_name, demographic_cluster_name) %>%
    summarize(mean_bpi=mean(bpi_intensity),
              sd_bpi=sd(bpi_intensity));



the_plot <- ggplot(group_sums, aes(time, mean_bpi)) +
    geom_line(aes(group=factor(group_name),
                  color=factor(group_name))) +
    geom_errorbar(aes(x=time, ymin=mean_bpi-sd_bpi/2, ymax=mean_bpi+sd_bpi/2,
                      group=factor(group_name),
                      color=factor(group_name)),
                  width=0.3) +
    facet_wrap(~demographic_cluster_name,nrow=2) +
    labs(title="Ashar data by (semi)-supervised demographic clustering.") +
    theme(strip.text.x = element_text(size = 6));

ggsave("figures/outcomes_by_demographic_clustering.png", the_plot);
ggsave("figures/outcomes_by_demographic_clustering.svg", the_plot);

