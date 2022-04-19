library(tidyverse)
library(jsonlite)

datasets <- c("source_data/clinical_outcomes.csv",
              "source_data/demographics.csv");

clinical_outcomes <- read_csv(datasets[1]);
demographics <- read_csv(datasets[2]);

all_data <- clinical_outcomes %>% inner_join(demographics, by=c("id","group"));

columns <- names(all_data);

output <- list(columns=columns);

remove.na <- function(x){
    x[!(is.na(x) | is.nan(x))]
}

for(column in columns) {
    output[[column]] <- remove.na(unique(all_data[[column]]))
    output[[paste(column,"_type",sep="")]] <- unbox(mode(remove.na(output[[column]])[[1]]));
    if(mode(output[[column]][[1]])=="numeric"){
        output[[paste(column,"_range",sep="")]] <- c(min(output[[column]], na.rm = TRUE),
                                                     max(output[[column]], na.rm = TRUE))
    }    
}

filename <- "derived_data/meta-data.json";

if(file.exists(filename)){
    file.remove(filename);
}

cat(toJSON(output), file=filename, append=FALSE)
