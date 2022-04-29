docker run -p 8888:8888 -v $(pwd):/home/rstudio/work --workdir /home/rstudio/work -d -t ashar make demo-ae-vis
chromium-browser http://locahost:8888/demo-ae-vis.html
