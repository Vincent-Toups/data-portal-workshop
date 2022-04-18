library(gbm);
library(tidyverse);

data <- read_csv("derived_data/demographic_ae_sdf.csv") %>% select(-AE1, -AE2);

clusters <- data$cluster %>% unique();

set.seed(123);

cluster_labels <- c();
for(i in clusters){
    f <- formula(sprintf("in_cluster ~ %s", paste(names(data %>% select(-cluster)),collapse=" + ")))
    df <- data %>% mutate(in_cluster=cluster==i)
    model <- gbm(f, data=df);
    so <- summary(model);
    var <- so$var[1:4]
    sdf <- df %>% filter(in_cluster)
    cluster_label <- sprintf("Cluster %f: %s(%f), %s(%f), %s(%f), %s(%f)",
                             i,
                             var[1], median(sdf[var[1]] %>% pull(1)),
                             var[2], median(sdf[var[2]] %>% pull(1)),
                             var[3], median(sdf[var[3]] %>% pull(1)),
                             var[4], median(sdf[var[4]] %>% pull(1)));
    cluster_labels <- c(cluster_labels, cluster_label);
    print(cluster_label)
}

output <- tibble(cluster=clusters, cluster_label=cluster_labels);
write_csv(output, "derived_data/cluster_labels.csv");
