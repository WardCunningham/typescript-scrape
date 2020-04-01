# find sites one hop away
# echo fed.wiki.org | sh query.sh | sh query.sh

while read i; do cat data/$i/*; done | jq -r .[] | sort | uniq