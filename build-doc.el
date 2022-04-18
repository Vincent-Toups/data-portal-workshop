#!/snap/bin/emacs --script

(defvar filename (car command-line-args-left))
(setq filename
      (if filename filename "./script.org"))

(with-current-buffer (find-file filename)
  (org-html-export-to-html))


