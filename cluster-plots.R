library(tidyverse);

df <- read_csv("derived_data/clinical-outcomes-with-clustering.csv");

cc <- df %>% group_by(cluster) %>% tally() %>% filter(n>20) %>% pull(cluster);

columns <- names(df %>% select(-AE1, -AE2, -cluster));

df_simple <- df %>% filter(cluster %in% cc);

sentinel <- "sentinels/cluster-plots.txt";
if(file.exists(sentinel)){
    file.remove(sentinel);
}

system2("touch sentinels/cluster-plots.txt");

for (column in columns) {
    plt <- ggplot(df_simple, aes_string(column)) + geom_density(aes(fill=factor(cluster)),alpha=0.5);
    ggsave(sprintf("figures/clustering-density-%s.png", column), plt);
    cat(sprintf("figures/clustering-density-%s.png", column), file=sentinel, sep="\n", append=TRUE);
}

plt <- ggplot(df, aes(AE1, AE2)) + geom_point(aes(color=panas_pa));
ggsave("figures/ae-project-panas-pa.png", plt);

plt <- ggplot(df, aes(AE1, AE2)) + geom_point(aes(color=panas_na));
ggsave("figures/ae-project-panas-na.png", plt);
