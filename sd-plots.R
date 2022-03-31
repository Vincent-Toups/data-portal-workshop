library(tidyverse);

d <- read_csv("source_data/clinical_outcomes.csv");

colums_of_interest <- c("pain_avg", "bpi_intensity", "bpi_interference", "odi", "promis_dep",
                        "promis_anger", "promis_anxiety", "promis_sleep", "panas_pa",
                        "panas_na", "pcs", "tsk11", "sopa_emo", "pgic", "tx_satisfaction",
                        "alcohol", "opioid", "cannabis")

useful_events <- c("baseline",
                   "t2_arm_1",
                   "1_month_follow_up_arm_1",
                   "2_month_follow_up_arm_1",
                   "3_month_follow_up_arm_1",
                   "6_month_follow_up_arm_1",
                   "12_month_follow_up_arm_1");

times <- tibble(redcap_event_name=useful_events, time=factor(seq(length(useful_events)), seq(length(useful_events))));

d <- d %>% inner_join(times, by="redcap_event_name") %>%
    group_by(time, group) %>%
    summarize_at(colums_of_interest, ~ sd(., na.rm=T));


sentinel = "sentinels/sd-plots.txt";
if(file.exists(sentinel)){
    file.remove(sentinel);
}
system2("touch sentinels/sdplots.txt");


for (col in colums_of_interest) {
    p <- ggplot(d, aes_string("time",col)) +
        geom_line(aes(color=factor(group)));
    ggsave(sprintf("figures/sdplot-%s.png", col), p);
    cat(sprintf("figures/sdplot-%s.png", col), file=sentinel, sep="\n")
}
