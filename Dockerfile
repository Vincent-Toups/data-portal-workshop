FROM rocker/verse
ARG linux_user_pwd
SHELL ["/bin/bash", "-o", "pipefail", "-c"]
RUN adduser rstudio sudo
RUN apt update && apt install -y emacs
RUN apt update && apt install -y python3-pip sqlite3
RUN pip3 install beautifulsoup4 theano tensorflow keras sklearn pandas numpy pandasql
RUN Rscript --no-restore --no-save -e "install.packages('reticulate')"
RUN echo "rstudio:$linux_user_pwd" | chpasswd
RUN pip3 install dfply
RUN pip3 install plotnine
RUN Rscript --no-restore --no-save -e "install.packages('GGally')"
RUN pip3 install matplotlib seaborn
RUN pip3 install hy
RUN Rscript --no-restore --no-save -e "install.packages('gbm')"
RUN Rscript --no-restore --no-save -e "install.packages('r2d3')"
RUN apt update && apt install -y lighttpd
