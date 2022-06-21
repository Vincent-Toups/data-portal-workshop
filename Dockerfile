FROM rocker/verse
ARG linux_user_pwd
SHELL ["/bin/bash", "-o", "pipefail", "-c"]
RUN adduser rstudio sudo
RUN apt update && apt install -y software-properties-common
RUN add-apt-repository ppa:kelleyk/emacs
RUN DEBIAN_FRONTEND=noninteractive apt update && DEBIAN_FRONTEND=noninteractive apt install -y emacs28
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
RUN Rscript --no-restore --no-save -e "install.packages('svglite')"
RUN apt update && apt install -y x11-apps
RUN Rscript --no-restore --no-save -e "remotes::install_github('eddelbuettel/rcppcorels')"
RUN Rscript --no-restore --no-save -e "tinytex::tlmgr_install(c(\"wrapfig\",\"ec\",\"ulem\",\"amsmath\",\"capt-of\"))"
RUN Rscript --no-restore --no-save -e "tinytex::tlmgr_install(c(\"hyperref\",\"iftex\",\"pdftexcmds\",\"infwarerr\"))"
RUN Rscript --no-restore --no-save -e "tinytex::tlmgr_install(c(\"kvoptions\",\"epstopdf\",\"epstopdf-pkg\"))"
RUN Rscript --no-restore --no-save -e "tinytex::tlmgr_install(c(\"hanging\",\"grfext\"))"
