library(tidyverse)
library(gbm)

data <- read_csv("source_data/clinical_outcomes.csv") %>%
    filter(group==1 & redcap_event_name %in%
           c("12_month_follow_up_arm_1","6_month_follow_up_arm_1")) %>%
    group_by(id) %>%
    summarise(bpi_intensity=mean(bpi_interference)) %>%
    inner_join(read_csv("source_data/demographics.csv"), by=c("id")) %>%
    mutate(responder=bpi_intensity<1);

ggplot(data, aes(bpi_intensity)) +
    geom_histogram(aes(fill=factor(responder))) +
    geom_vline(xintercept=1);

the.formula <- responder ~ education +
    employment_status +
    exercise +
    sses +
    handedness +
    married_or_living_as_marri +
    age +
    weight +
    gender +
    backpain_length;

model <- glm(the.formula, family=binomial(link=logit),
             data %>% mutate(ethnicity = factor(ethnicity)));

print(summary(model))




restricted.the.formula <- responder ~ employment_status + exercise + age + weight + gender + employment_status*employment_status

