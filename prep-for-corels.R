library(tidyverse);
library(reticulate);

`%without%` <- function(l,r){
    keepii <- !(l %in% r);
    l[keepii];
}

foreach <- function(items, fun){
    for(i in items){
        fun(i);
    }
}

event_time_map <- tibble(redcap_event_name=str_split("1_month_follow_up_arm_1 12_month_follow_up_arm_1 2_month_follow_up_arm_1 3_month_follow_up_arm_1 6_month_follow_up_arm_1 baseline eligibility_assess_arm_1", " ") %>% unlist(),
                         month=c(1, 12, 2, 3, 6, 0, -1)) %>% arrange(month);

group_name_map <- tibble(group=c(1,2,3), group_name=c("PRT","Saline","SOC"))
 
demo_data <- read_csv("source_data/demographics.csv") %>%
    inner_join(group_name_map, by="group");
outcome_data <- read_csv("source_data/clinical_outcomes.csv") %>%
    filter(!is.na(group) & !(redcap_event_name %in% c("t1_arm_1","t2_arm_1"))) %>%
    inner_join(event_time_map, by="redcap_event_name") %>%
    inner_join(group_name_map, by="group");

complete_outcomes <- outcome_data %>%
    group_by(id) %>%
    tally() %>%
    filter(n==max(n)) %>%
    select(id);

demo_data <- demo_data %>% inner_join(complete_outcomes, by="id");
outcome_data <- outcome_data %>% inner_join(complete_outcomes, by="id");

end_of_trial <- outcome_data %>%
    filter(month %in% c(6,12)) %>%
    group_by(id, group_name) %>%
    summarise(bpi_intensity=mean(bpi_intensity));

start_of_trial <- outcome_data %>% filter(month==0) %>%
    select(id, group_name, bpi_intensity);

response <- end_of_trial %>% inner_join(start_of_trial, by=c("id","group_name"),
                                        suffix=c(".e",".s")) %>%
    transmute(id=id, group_name=group_name, response=bpi_intensity.s - bpi_intensity.e) %>%
    group_by(1) %>%
    mutate(response={
        mn <- min(response, na.rm=T);
        mx <- max(response, na.rm=T);
        #browser()
        (response-mn)/(mx-mn);
    }) %>% ungroup() %>% select(-`1`);

ggplot(response, aes(response)) +
    geom_histogram(aes(fill=factor(group_name)),position="dodge")

response <- response %>%
    mutate(responder=response > 0.5);

age_info <- demo_data %>%
    mutate(age_tertile=ntile(age,3)) %>%
    group_by(age,age_tertile) %>%
    group_by(age_tertile) %>%
    mutate(age_tertile=sprintf("age_above:%d_to_%d",min(age),max(age))) %>%
    group_by(age, age_tertile) %>% tally() %>%
    select(-n) %>%
    group_by(age) %>%
    summarize(age=age[[1]], age_tertile=age_tertile[[1]]);

weight_info <- demo_data %>%
    mutate(weight_tertile=ntile(weight,3)) %>%
    group_by(weight,weight_tertile) %>%
    group_by(weight_tertile) %>%
    mutate(weight_tertile=sprintf("weight:above_%d_to_%d",min(weight),max(weight))) %>%
    group_by(weight, weight_tertile) %>% tally() %>%
    select(-n) %>%
    group_by(weight) %>%
    summarize(weight=weight[[1]], weight_tertile=weight_tertile[[1]]);

sses_info <- demo_data %>%
    mutate(sses_tertile=ntile(sses,3)) %>%
    group_by(sses,sses_tertile) %>%
    group_by(sses_tertile) %>%
    mutate(sses_tertile=sprintf("sses:above_%d_to_%d",min(sses),max(sses))) %>%
    group_by(sses, sses_tertile) %>% tally() %>%
    select(-n) %>%
    group_by(sses) %>%
    summarize(sses=sses[[1]], sses_tertile=sses_tertile[[1]]);

backpain_length_info <- demo_data %>% mutate(backpain_length_quintile=ntile(backpain_length,5)) %>%
    group_by(backpain_length,backpain_length_quintile) %>%
    group_by(backpain_length_quintile) %>%
    mutate(backpain_length_quintile=sprintf("backpain_length:%dm_to_%dm",as.integer(12*min(backpain_length)),as.integer(12*max(backpain_length)))) %>%
    group_by(backpain_length, backpain_length_quintile) %>% tally() %>%
    select(-n) %>%
    group_by(backpain_length) %>%
    summarize(backpain_length=backpain_length[[1]], backpain_length_quintile=backpain_length_quintile[[1]]);

demo_data <- demo_data %>% select(-group_name);

maps <- list(group=tibble(code=c(1,2,3), value=c("intervention:prt","intervation:saline","intervetion:standard_of_care")),
    education=tibble(code=c(1,2,3),
                              value=c("education:high_school", "education:some_college_or_vocational", "education:college_graduate")),
             ethnicity=tibble(code=c(1,2,3,4,5), value=c("ethnicity:native_alaskan_or_american",
                                                         "ethnicity:asian_or_pacific_islander",
                                                         "ethnicity:black_non_hispanic",
                                                         "ethnicity:white_non_hispanic",
                                                         "ethnicity:other_or_unknown")),
             hispanic=tibble(code=c(0,1),value=c("hispanic:no","hispanic:yes")),
             employment_status=tibble(code=c(1,2,3), value=c("employment:full_time",
                                                             "employment:part_time",
                                                             "employment:un_or_lightly")),
             married_or_living_as_marri=tibble(code=c(0,1), value=c("marital_status:single","marital_status:married_or_living_as")),
             handedness=tibble(code=c(1,2,3),value=c("handedness:right","handedness:left","handedness:ambidextrous")),
             sses=tibble(code=sses_info$sses,value=sses_info$sses_tertile),
             backpain_length=tibble(code=backpain_length_info$backpain_length, value=backpain_length_info$backpain_length_quintile),
             exercise=tibble(code=c(1,2,3,4,5),
                             value=c("exercise:almost_none","exercise:hour_per_week","exercise:three_hours_week","exercise:seven_hours_week","exercise:fourteen_or_more_hours_week")),
             gender=tibble(code=c(1,2,3), value=c("gender:male","gender:female","gender:other")),
             age=tibble(code=age_info$age, value=age_info$age_tertile),
             weight=tibble(code=weight_info$weight, value=weight_info$weight_tertile));


foreach(names(maps), function(name){
    demo_data$code <<- demo_data[[name]];    
    demo_data <<- demo_data %>% inner_join(maps[[name]], by="code");
    if(nrow(demo_data) != 92){
        browser();
    }
    demo_data[[name]] <<- demo_data[["value"]];
    demo_data <<- demo_data %>% select(-code,-value);
    ## if(nrow(demo_data) != 92){
    ##     browser();
    ## }
});

foreach(names(demo_data) %without% c("id"), function(col_name){
    cc <- demo_data[[col_name]];
    foreach(cc %>% unique(),function(value){
        demo_data[[value]] <<- 1*(value == cc);
    });
    demo_data <<- demo_data;
    demo_data[[col_name]] <<- NULL;
});

write_csv(demo_data, "derived_data/demo_data_rule_list.csv");

save_to_corels_format <- function(tbl, file=file, columns=names(tbl)){
    if(file.exists(file)){
        file.remove(file);
    }
    for (column in columns) {
        cat(sprintf("{%s} %s\n", column, paste(sprintf("%d", tbl[[column]]),collapse=" ")), file=file, append=TRUE);
    }
    tbl;
}

## demo_data <- demo_data %>% filter(`intervention:prt`==1);
## response <- response %>% filter(group_name=="PRT");

sorter <- demo_data %>% select(id) %>% mutate(sort_index=seq(length(id)));
response_corels <- response %>%
    right_join(sorter, by="id") %>%
    arrange(sort_index) %>%
    transmute(`pain:doesnt_improve`=1*(responder==FALSE),
              `pain:improves`=1*(responder==TRUE));

save_to_corels_format(demo_data,
                      columns=names(demo_data) %without% "id",
                      file="derived_data/demo_data.corels")

save_to_corels_format(response_corels,
                      columns = names(response_corels) %without% "id",
                      file="derived_data/response.corels");

if(dir.exists("/tmp/corels-run")){
    unlink("/tmp/corels-run", recursive = TRUE);
}

dir.create("/tmp/corels-run");

corels(rules_file="./derived_data/demo_data.corels",
       labels_file="./derived_data/response.corels",
       log_dir="/tmp/corels-run",
       verbosity_policy="loud",
       max_num_nodes=1000000,
       run_curiosity=TRUE);


