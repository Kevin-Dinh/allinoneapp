#!/bin/bash

## Convenience to run doh tests (in browser)
## assumes you have http-server installed  
## Version:
## 
## Usage: 
##
## Samples:
##
##    # runs all tests defined in module
##    ./build/test.sh
##    
##    # runs all tests with matching file name
##    ./build/test.sh json
##  
##    # runs all tests using given mid 
##    ./build/test.sh gjax/uri/Uri --grep

if [ "$1" == "-h" -o  "$1" == "--help" ]
then 
	. _usage.sh "${BASH_SOURCE[0]}" 2 --strip_hashes 1;
	exit 1
fi

if [[ "$1" ]] 
then
	query="$1"

	if [ "$2" == "-g" -o "$2" == "--grep" ]; then
		query=$(regexp-escape "$query")
		# find tests based on require, filter with test files only
		test="$(git grep -l "[\"']$query[\"']" -- tests/* | grep -F "$(list_tests --doh-unit-test)")"
	else
		# find tests based on name
		# if gjax is specified remove (test files do not contain gjax)
		query="$(xs-sed "s;^gjax/;;" <<< "$query")"
		query=$(regexp-escape "$query")
		test="$(list_tests --doh-unit-test | grep -i "$query")"
	fi
	
else
	test="gjax/tests/module"
fi	


# runnable with doh/runner.html
test_js=$(<<< "$test"  grep -v "\.html$")
test_js=$(<<< "$test_js" grep "." | prefix "gjax/" | xs-sed "s;\.js$;;" | join-lines ",")



# must be opened as standalone ? (REVIEW: I do not believe this)
test_html=$(<<< "$test" grep "\.html$")

echo "All Tests found:" 1>&2
echo 1>&2
echo "$test" | tr "," "\n" | md-indent 1>&2 
echo 1>&2
echo "Screen tests (run manually, or run module or all)" 1>&2
echo 1>&2 
echo "$test_html" | md-indent 1>&2 


if [[ $test_js ]]; then
	 http-server ../ -p 7777 &
	 xs-open http://localhost:7777/util/doh/runner.html?test="$test_js"
fi 	




