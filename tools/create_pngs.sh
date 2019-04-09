#!/bin/sh

rsvg-convert -v > /dev/null 2>&1 || { echo "rsvg-convert is not installed, use: brew install librsvg." >&2; exit 1; }

for filePath in $(find assets -name '*.svg'); do
  echo $filePath
  pathNoExt="${filePath%.*}"
  rsvg-convert $filePath -o "${pathNoExt}.png"
  rsvg-convert $filePath -x 2 -y 2 -o "${pathNoExt}@2x.png"
  rsvg-convert $filePath -x 3 -y 3 -o "${pathNoExt}@3x.png"
done
