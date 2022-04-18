FROM rocker/verse
RUN apt update -y && apt install -y scilab
CMD scilab -nw 
