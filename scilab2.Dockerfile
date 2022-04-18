FROM rocker/verse
RUN apt update -y && apt install -y scilab
COPY hello.sl /
CMD scilab -nw -f /hello.sl
