library(tidyverse);

df <- read_csv("derived_data/clinical-outcomes-with-clustering.csv");

useful_events <- c("baseline",
                   "t2_arm_1",
                   "1_month_follow_up_arm_1",
                   "2_month_follow_up_arm_1",
                   "3_month_follow_up_arm_1",
                   "6_month_follow_up_arm_1",
                   "12_month_follow_up_arm_1");

times <- tibble(redcap_event_name=useful_events, time=seq(length(useful_events)));

df <- df %>% inner_join(times, by="redcap_event_name");

df %>% write_csv("derived_data/clinical_outcomes-d3.csv");
