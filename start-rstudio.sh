docker build . --build-arg linux_user_pwd="$(cat .password)" -t ashar
docker run -v $(pwd):/home/rstudio/ashar-ws -p 9999:8787 -v `readlink -f ~/.gitconfig`:/home/rstudio/.gitconfig -e PASSWORD="$(cat .password)" -it ashar 
