#!/bin/bash

echo "starting with pid $$"

ROOT_DIR=$(pwd)/mitData
FETCH_EVALUATIONS_SCRIPT='/Users/alexandercai/Developer/web/harvard-concentration-planner/build/scripts/fetchEvaluations.js'
EXTEND_CLASS_SCRIPT='/Users/alexandercai/Developer/web/harvard-concentration-planner/build/scripts/cliHelper.js'
export GOOGLE_APPLICATION_CREDENTIALS='/Users/alexandercai/Developer/web/harvard-concentration-planner/serviceAccountKey.json'
export MY_HARVARD_COOKIE='_clck=j48mwa|1|ew8|0; OptanonAlertBoxClosed=2021-11-09T16:15:25.157Z; OptanonConsent=isIABGlobal=false&datestamp=Mon+Nov+29+2021+16:29:47+GMT-0500+(Eastern+Standard+Time)&version=6.15.0&hosts=&consentId=44fa3662-4b23-4918-9e16-713114936874&interactionCount=1&landingPath=NotLandingPage&groups=C0001:1,C0002:1,C0003:1,C0004:1,C0005:1&geolocation=US;&AwaitingReconsent=false; MOD_AUTH_CAS=27ad20fc13609dc056a8a93d55994db9; hrvihprd-858p-8080-PORTAL-PSJSESSIONID=Y9QUg07nXKrulg3bQ13XLtqiGw_xZih4!1709796157; ExpirePage=https://portal.my.harvard.edu/psp/hrvihprd/; PS_TokenSite=https://portal.my.harvard.edu/psp/hrvihprd/?hrvihprd-858p-8080-PORTAL-PSJSESSIONID; PS_TOKEN=sAAAAAQDAgEBAAAAvAIAAAAAAAAsAAAABABTaGRyAk4AfQg4AC4AMQAwABT27DF+dzZNDtekX7uXEudSZYceSnAAAAAFAFNkYXRhZHicHYw7DoRADEPfAKKm5g6M2PAR9HwbhHYRLSfhZns4zCRKbNlObiCJI+eE/4hQWcuHGqNVl2LpyMZMvvNj4uBi4cvJKtzFBmpT0HRWaEy7CvxVPK/nafTM0wWnl2bwADPkDSs=; ps_theme=node:EMPL portal:EMPLOYEE theme_id:HU_BRANDING_THEME accessibility:N formfactor:3 piamode:2; ps_theme=node:EMPL portal:EMPLOYEE theme_id:HU_BRANDING_THEME accessibility:N formfactor:3 piamode:2; HPTabNameRemote=; PS_DEVICEFEATURES=width:1920 height:1080 pixelratio:1 touch:0 geolocation:1 websockets:1 webworkers:1 datepicker:1 dtpicker:1 timepicker:1 dnd:1 sessionstorage:1 localstorage:1 history:1 canvas:1 svg:1 postmessage:1 hc:0 maf:0; PS_LOGINLIST=https://csinternal.my.harvard.edu/hrvcsprd https://portal.my.harvard.edu/hrvihprd; hrvcsprd-clb-858p-8080-PORTAL-PSJSESSIONID=cZ4Ug10VKvLELrTGXfZXW_yvUwNzd2lE!-1561881161; AWSELB=B98D5B150620EF03BF44401303982FFCAA00B47465F0ED7F69FF3F143E9E2D577761F33BA15FDA7A2CE28DE3C53CFF2A74C9E4AD922BD5EEC55CD7432BB5EBA995D45DF291158DEAA9FA9E08B1B06BE05F663009FD273EC69503C8268E3D3129EC0BEB5A38D54C0072E12BC438E767141B8FFD083B; SignOnDefault=; PS_LASTSITE=https://portal.my.harvard.edu/psp/hrvihprd/; https://portal.my.harvard.edu/psp/hrvihprd/employee/empl/refresh=list:|; HPTabName=HU_CLASS_SEARCH; LastActiveTab=HU_CLASS_SEARCH; psback=""url":"https://portal.my.harvard.edu/psp/hrvihprd/EMPLOYEE/EMPL/h/?tab=HU_CLASS_SEARCH" "label":"Home" "origin":"PIA" "layout":"0" "refurl":"https://portal.my.harvard.edu/psp/hrvihprd/EMPLOYEE/EMPL/h/?tab=HU_CLASS_SEARCH""; AWSALB=xd+bgLZEJYO0WdFuQnZApyLrEOz5J+AyYLR6uAgQzrcXLD8tKZhoS7nEzaitXwh1xSUct2jJEl2GHwRaLhpulX+gegz9EtaySza9tntrlugTHCaE/bLwD4dj1wGj; AWSALBCORS=xd+bgLZEJYO0WdFuQnZApyLrEOz5J+AyYLR6uAgQzrcXLD8tKZhoS7nEzaitXwh1xSUct2jJEl2GHwRaLhpulX+gegz9EtaySza9tntrlugTHCaE/bLwD4dj1wGj; PS_TOKENEXPIRE=01_Jan_2022_07:23:14_GMT'
MEILI_PRIVATE='083c82ddd5e12eefd7162a127d346e90bc2c1fd9e5b5ebe4e9fe90a079549139'
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
    fi
done

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
