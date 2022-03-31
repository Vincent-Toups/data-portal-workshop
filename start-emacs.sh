docker build . --build-arg linux_user_pwd="$(cat .password)" -t ashar
x11docker --clipboard --share ~/.emacs-trash --share ~/.ssh --share ~/.gitconfig --share ~/.emacs.d --share `pwd` ashar emacs

