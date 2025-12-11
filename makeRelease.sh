#!/usr/bin/env bash

# Vérifier si un paramètre est fourni
if [ -z "$1" ]; then
  echo "Erreur : aucun paramètre fourni."
  echo "Utilisation : $0 <parametre>"
  exit 1
fi

# Afficher le paramètre
echo "Le paramètre fourni est : $1"
git fetch
git stash
git checkout master
git pull
git checkout -b release/$1
git stash pop
Git commit -a -m "chore(): $1"
git push
