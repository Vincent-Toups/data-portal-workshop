library(tidyverse);

df <- read_csv("derived_data/clinical-outcomes-with-clustering.csv");

demo <- read_csv("derived_data/demographic_ae.csv") %>% select(id, cluster) %>%
    transmute(id=id, demographic_cluster=cluster);

group_names <- tibble(group=c(1,2,3),
                      group_name=c("PRT","Saline","SOC"));

demographic_cluster_names <- tibble(demographic_cluster=c(0,1,2,3),
                                  demographic_cluster_name=c("less_white_less_affluent_younger","white_affluent_older","more_employment_stress_younger","more_affluent_hispanic_middle_aged"));


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

times <- tibble(redcap_event_name=useful_events, time=seq(length(useful_events)));

df <- df %>% inner_join(times, by="redcap_event_name");

group_sums <- df %>% group_by(time, group_name, demographic_cluster_name) %>%
    summarize(mean_bpi=mean(bpi_intensity),
              sd_bpi=sd(bpi_intensity));



ggplot(group_sums, aes(time, mean_bpi)) +
    geom_line(aes(group=factor(group_name),
                  color=factor(group_name))) +
    facet_wrap(~demographic_cluster_name);
