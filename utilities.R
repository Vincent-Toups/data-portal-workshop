library(tidyverse);

na.replace <- function(v, with){
    v[is.na(v)] <- with;
    v
}
