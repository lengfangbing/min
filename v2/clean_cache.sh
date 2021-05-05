#!/bin/bash

# basic cache delete script
# 14. 05. 2020, Bence Vági, vagi.bence@gmail.com

preproc=""
ans=""
slash="/"

if [[ -t 0 ]]
then
        preproc="$(deno info | grep 'Remote modules cache:')"
else
        while [ -z "$preproc" ]
        do
                read string
                preproc="$(echo $string | grep 'Remote modules cache:')"
        done
fi

if [[ -z "$preproc" ]]; then echo "directory not found, exiting"; exit 0; fi

if [[ $preproc == *"\\"* ]];
then
        denodir="$(echo $preproc | awk -F "\"" '{print $2}' | sed 's/\\\\/\\/g' | awk '{print $1"\\https"}')"
        slash="\\"
else
        denodir="$(echo $preproc | awk -F "\"" '{print $2}' | awk '{print $1"/https"}')"
fi

while [ -d $denodir$slash ]
do
        echo "Are you sure you want to delete the contents of this folder? (y/n)"
        echo "$denodir$slash"
        read ans </dev/tty
        if [[ $ans == "y" ]]; then
                rm -r $denodir$slash
                break
        elif [[ $ans == "n" ]]; then
                break
        fi
done

echo "exiting script"

exit 0