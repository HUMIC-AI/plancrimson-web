#!/bin/bash

echo "starting with pid $$"

if [[ -z $MY_HARVARD_COOKIE ]]; then
    echo "must set MY_HARVARD_COOKIE env variable"
    exit 1
fi

if [[ -z $MEILI_PRIVATE ]]; then
    echo "must set MEILI_PRIVATE env variable"
    exit 1
fi

FETCH_EVALUATIONS_SCRIPT='/Users/alexandercai/Developer/web/harvard-concentration-planner/build/scripts/fetchEvaluations.js'
EXTEND_CLASS_SCRIPT='/Users/alexandercai/Developer/web/harvard-concentration-planner/build/scripts/cliHelper.js'
export GOOGLE_APPLICATION_CREDENTIALS='/Users/alexandercai/Developer/web/harvard-concentration-planner/serviceAccountKey.json'
BATCH_SIZE=15

# search query surroundings
PREFIX='SearchReqJSON={"ExcludeBracketed":true,"PageNumber":'
SUFFIX1=',"PageSize":"","SortOrder":["SCORE"],"Facets":[],"Category":"HU_SCL_SCHEDULED_BRACKETED_COURSES","SearchPropertiesInResults":true,"FacetsInResults":true,"SaveRecent":true,"TopN":"","SearchText":"'
SUFFIX2='","DeepLink":false}'

# default options
SEARCH_TEXT='( * ) (ACAD_CAREER:\"FAS\")'
MEILI_URL=http://127.0.0.1:7700

FORCE=

for ARG in $@; do
    if [[ $ARG == "-f" ]]; then
        FORCE="yes"
    else
        ROOT_DIR=$ARG
    fi
done

if [[ -z $ROOT_DIR ]]; then
    echo "must specify root directory"
    exit 1
fi

if [[ -n "$FORCE" && -e "$ROOT_DIR" ]]; then
    read -p "remove $ROOT_DIR? "
    if [[ $REPLY =~ ^[Yy] ]]; then
        rm -rf "$ROOT_DIR"
        echo "removed"
    else
        echo "exiting"
        exit 1
    fi
fi

read -p "Search text (default $SEARCH_TEXT): "

if [[ -n $REPLY ]]; then
    SEARCH_TEXT="$REPLY"
fi

echo "using search text '$SEARCH_TEXT'"

read -p "Meili URL (default $MEILI_URL): "

if [[ -n $REPLY ]]; then
    MEILI_URL="$REPLY"
fi

function getPage() {
    curl --location --request POST 'https://portal.my.harvard.edu/psc/hrvihprd/EMPLOYEE/EMPL/s/WEBLIB_IS_SCL.ISCRIPT1.FieldFormula.IScript_Search' \
        --header "Cookie: $MY_HARVARD_COOKIE" \
        --header 'Content-Type: application/x-www-form-urlencoded' \
        --data-urlencode "$PREFIX$1$SUFFIX1$SEARCH_TEXT$SUFFIX2"
}

echo "building node.js scripts"

npx tsc@latest --noEmit false --outDir build --module commonjs

if [[ $? -ne 0 ]]; then
    echo "failed building typescript project"
    exit 1
fi

mkdir -p "$ROOT_DIR"

if [[ -z $FORCE ]]; then
    read -p "Load evaluations? "
fi
if [[ -z $FORCE && $REPLY =~ ^[Yy] ]]; then
    echo "downloading evaluations"
    node "$FETCH_EVALUATIONS_SCRIPT" >"$ROOT_DIR/evaluations.json"
    if [[ $? -ne 0 ]]; then
        echo "error downloading evaluations"
        exit 1
    fi
    echo "done downloading evaluations"
fi

function loadData() {
    BATCH_PATH="$1"
    PAGE_NUMBER="$2"
    OUT_FILE="$BATCH_PATH/data/page-$PAGE_NUMBER.json"
    UPDATED_FILE="$BATCH_PATH/extended/page-$PAGE_NUMBER.json"

    if [ -f "$OUT_FILE" ]; then
        echo "=== data/$PAGE_NUMBER exists, skipping"
    else
        echo "loading page $PAGE_NUMBER"
        getPage "$PAGE_NUMBER" 2>"$BATCH_PATH/errors/$PAGE_NUMBER.txt" | jq -c '.[0].ResultsCollection' >"$OUT_FILE"

        if [ $? -eq "0" ]; then
            echo "=== LOADED page $PAGE_NUMBER"
        else
            echo "=== ERROR $PAGE_NUMBER with status $?"
            return
        fi
    fi

    if [ -f "$UPDATED_FILE" ]; then
        echo "=== $PAGE_NUMBER already updated, skipping"
    else
        echo "updating page $PAGE_NUMBER"
        node "$EXTEND_CLASS_SCRIPT" "$OUT_FILE" >"$UPDATED_FILE" 2>"$BATCH_PATH/update_errors/$PAGE_NUMBER.txt"
        echo "=== UPDATED page $PAGE_NUMBER"
    fi
}

echo "sending initial request"
sleep 1

DATA=$(getPage 1)
TOTAL_PAGES=$(echo $DATA | jq '.[2].TotalPages')
TOTAL_HITS=$(echo $DATA | jq '.[2].HitCount')
PAGE_SIZE=$(echo $DATA | jq '.[2].PageSize')

if [[ $? -ne 0 || -z TOTAL_PAGES ]]; then
    echo "could not get my.harvard request"
    exit 1
fi

N_BATCHES=$((((TOTAL_PAGES - 1) / BATCH_SIZE) + 1))

echo "===== SUMMARY ====="
echo "$TOTAL_HITS courses"
echo "in $TOTAL_PAGES pages of $PAGE_SIZE courses each"
echo "to be loaded in $N_BATCHES batches of $BATCH_SIZE pages each"

START_PAGE_INPUT=1
if [[ -z $FORCE ]]; then
    read -p "Start at page? (between 1 and $TOTAL_PAGES) " START_PAGE_INPUT
fi

if [[ $START_PAGE_INPUT -gt $TOTAL_PAGES ]]; then
    echo "must be between 1 and $TOTAL_PAGES"
    exit 1
fi

START_BATCH=$((((START_PAGE_INPUT - 1) / BATCH_SIZE) + 1))

for ((BATCH = START_BATCH - 1; BATCH < N_BATCHES; BATCH++)); do
    BATCH_PATH="$ROOT_DIR/batch$((BATCH + 1))"
    mkdir -p "$BATCH_PATH/data"
    mkdir -p "$BATCH_PATH/extended"
    mkdir -p "$BATCH_PATH/errors"
    mkdir -p "$BATCH_PATH/update_errors"

    NEXT_BATCH_START=$(((BATCH + 1) * BATCH_SIZE))
    START_PAGE_AUX=$((BATCH * BATCH_SIZE + 1))
    START_PAGE=$((START_PAGE_INPUT > START_PAGE_AUX ? START_PAGE_INPUT : START_PAGE_AUX))
    NEXT_BATCH=$((TOTAL_PAGES < NEXT_BATCH_START ? TOTAL_PAGES : NEXT_BATCH_START))
    echo "========== Loading batch $((BATCH + 1)) of $N_BATCHES (pages $START_PAGE to $NEXT_BATCH) =========="
    for ((PAGE_NUMBER = START_PAGE; PAGE_NUMBER <= NEXT_BATCH; PAGE_NUMBER++)); do
        loadData "$BATCH_PATH" "$PAGE_NUMBER" &
        sleep 1
    done

    wait

    echo "========== RESULTS =========="

    wc -c $(ls $BATCH_PATH/extended/page-*.json | sort -V)

    if [[ -z $FORCE ]]; then
        read -p "Done. Upload to MeiliSearch? "
    fi
    if [[ -n $FORCE || "$REPLY" =~ ^[Yy] ]]; then
        cat $BATCH_PATH/extended/page-*.json | jq -cs 'map(.[])' >"$BATCH_PATH/allExtended.json"
        curl \
            -X POST "$MEILI_URL/indexes/courses/documents" \
            -H "X-MEILI-API-KEY: $MEILI_PRIVATE" \
            -H 'Content-Type: application/json' \
            --data-binary "@$BATCH_PATH/allExtended.json"
        echo
    fi

    if [[ -z $FORCE && $BATCH -lt $((N_BATCHES - 1)) ]]; then
        read -p "Done. Load next batch? "
        if [[ ! "$REPLY" =~ ^[Yy] ]]; then
            exit 0
        fi
    fi

    sleep 2
done
