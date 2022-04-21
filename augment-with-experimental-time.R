library(tidyverse);

df <- read_csv("derived_data/clinical-outcomes-with-clustering.csv");

demo <- read_csv("derived_data/demographic_ae.csv") %>% select(id, cluster) %>%
    transmute(id=id, demographic_cluster=cluster);

df <- df %>% inner_join(demo, by="id");

useful_events <- c("baseline",
                   "t2_arm_1",
                   "1_month_follow_up_arm_1",
                   "2_month_follow_up_arm_1",
                   "3_month_follow_up_arm_1",
                   "6_month_follow_up_arm_1",
                   "12_month_follow_up_arm_1");

times <- tibble(redcap_event_name=useful_events, time=c(-1,0,1,2,3,6,12));

df <- df %>% inner_join(times, by="redcap_event_name");

df %>% write_csv("derived_data/clinical_outcomes-d3.csv");
