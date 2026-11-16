#!/bin/bash
# usage: tools/dl.sh <subdir of work> <name> <url> [job id]  saves work/<subdir>/<name>.png and logs it in work/krea_runs.tsv
cd "$(dirname "$0")/.."; mkdir -p "work/$1"; curl -s -o "work/$1/$2.png" "$3" && echo -e "$1\t$2\t${4:-}\t$3" >> work/krea_runs.tsv && ls -la "work/$1/$2.png" | awk '{print $5, $9}'
