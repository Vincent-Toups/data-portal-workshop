library(tidyverse);

sde <- function(a,na.rm=T){
    sd(a,na.rm=na.rm)/sqrt(length(a));
}

data <- read_csv("./derived_data/clinical_outcomes-d3.csv") %>%
    mutate(`Treatment`=c("PRT","Saline","SOC")[group]) %>%
    group_by(time, Treatment) %>%
    summarize(bpi_intensity_mean=mean(bpi_intensity, na.rm=T),
              bpi_intensity_sd=sde(bpi_intensity,na.rm=T)) %>%
    ungroup();



the_plot <- ggplot(data, aes(time, bpi_intensity_mean)) +
    geom_line(aes(color=factor(Treatment))) +
    geom_errorbar(aes(ymin=bpi_intensity_mean-bpi_intensity_sd/2,
                      ymax=bpi_intensity_mean+bpi_intensity_sd/2,
                      color=factor(Treatment))) +
    theme(legend.position="bottom") +
    coord_fixed(ratio=0.75);

ggsave("figures/bpi_intensity_by_group.png",plot=the_plot);

