# watch the tail of a scrape
# usage: sh watch.sh

export NOW='now'
touch $NOW
while sleep 5
do NOW=`find data -newer $NOW -name '*.json' | tee /dev/fd/2 | tail -1`
echo ------------------------------------------------- `date +%H:%M:%S`
done