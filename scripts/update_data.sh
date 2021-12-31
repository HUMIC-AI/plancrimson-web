#!/bin/bash

echo "starting with pid $$"

ROOT_DIR=$(pwd)
BATCH_SIZE=15

FORCE=

for ARG in $@; do
    if [[ $ARG == "-f" ]]; then
        FORCE="yes"
    fi
done

if [[ -n $FORCE ]]; then
    rm -rf "$ROOT_DIR/outData"
fi

export GOOGLE_APPLICATION_CREDENTIALS='/Users/alexandercai/Developer/web/harvard-concentration-planner/serviceAccountKey.json'
export MY_HARVARD_COOKIE='_clck=j48mwa|1|ew8|0; OptanonAlertBoxClosed=2021-11-09T16:15:25.157Z; OptanonConsent=isIABGlobal=false&datestamp=Mon+Nov+29+2021+16:29:47+GMT-0500+(Eastern+Standard+Time)&version=6.15.0&hosts=&consentId=44fa3662-4b23-4918-9e16-713114936874&interactionCount=1&landingPath=NotLandingPage&groups=C0001:1,C0002:1,C0003:1,C0004:1,C0005:1&geolocation=US;&AwaitingReconsent=false; PS_TokenSite=https://portal.my.harvard.edu/psp/hrvihprd/?hrvihprd-858p-8080-PORTAL-PSJSESSIONID; ps_theme=node:EMPL portal:EMPLOYEE theme_id:HU_BRANDING_THEME accessibility:N formfactor:3 piamode:2; ps_theme=node:EMPL portal:EMPLOYEE theme_id:HU_BRANDING_THEME accessibility:N formfactor:3 piamode:2; HPTabNameRemote=; hrvihprd-858p-8080-PORTAL-PSJSESSIONID=FAcMSRNFHw30tUpfEvU3TBpRxrySw5uq!1709796157; PS_TOKEN=rQAAAAQDAgEBAAAAvAIAAAAAAAAsAAAABABTaGRyAk4AfQg4AC4AMQAwABRoKTdt3uIECjQGEk7UEMMuJnLK1G0AAAAFAFNkYXRhYXicHYxJDkBQEESfIdbW7vCFNh7AuBFBbJ3EzRxO0ZUaOqnuGwgD3/Pkj88/cU1OiVELmVLUszCSrOwMHFxMbJzM8lWpozQVTWdONGmh3YkNqTSTmpDS6mXD167gBTOnDSg=; PS_DEVICEFEATURES=width:1440 height:900 pixelratio:2 touch:0 geolocation:1 websockets:1 webworkers:1 datepicker:1 dtpicker:1 timepicker:1 dnd:1 sessionstorage:1 localstorage:1 history:1 canvas:1 svg:1 postmessage:1 hc:0 maf:0; PS_LOGINLIST=https://csinternal.my.harvard.edu/hrvcsprd https://portal.my.harvard.edu/hrvihprd; SignOnDefault=; hrvcsprd-clb-858p-8080-PORTAL-PSJSESSIONID=U4QNEK9Gy4XBxLVs5a7ZO1kRadesgv2r!-1044681886; AWSELB=B98D5B150620EF03BF44401303982FFCAA00B47465C920DD59A230BA369EDC1509063B69A75FDA7A2CE28DE3C53CFF2A74C9E4AD92DB69E81C97866C43EB9D104F5267BEE06CEE4561632F27D30F5D4873488A82AEB1FE7699C694B90E0F7503E6725DBD61590527DED9CD862B14C36494B51B1B14; ExpirePage=https://csinternal.my.harvard.edu/psp/hrvcsprd/; PS_LASTSITE=https://portal.my.harvard.edu/psp/hrvihprd/; HPTabName=HU_CLASS_SEARCH; LastActiveTab=HU_CLASS_SEARCH; MOD_AUTH_CAS=786a3eec025092360bb4a60966edc77b; https://portal.my.harvard.edu/psp/hrvihprd/employee/empl/refresh=list:|; psback=""url":"https://portal.my.harvard.edu/psp/hrvihprd/EMPLOYEE/EMPL/h/?tab=HU_CLASS_SEARCH&SearchReqJSON=%7B%22PageNumber%22%3A1%2C%22PageSize%22%3A%22%22%2C%22SortOrder%22%3A%5B%22SCORE%22%5D%2C%22Facets%22%3A%5B%5D%2C%22Category%22%3A%22HU_SCL_SCHEDULED_BRACKETED_COURSES%22%2C%22SearchPropertiesInResults%22%3Atrue%2C%22FacetsInResults%22%3Atrue%2C%22SaveRecent%22%3Afalse%2C%22TopN%22%3A%22%22%2C%22ExcludeBracketed%22%3Atrue%2C%22SearchText%22%3A%22(%20ac%20207%20)%20(ACAD_CAREER%3A%5C%22FAS%5C%22)%22%2C%22DeepLink%22%3Afalse%7D" "label":"Home" "origin":"PIA" "layout":"0" "refurl":"https://portal.my.harvard.edu/psp/hrvihprd/EMPLOYEE/EMPL/h/?tab=HU_CLASS_SEARCH&SearchReqJSON=%7B%22PageNumber%22%3A1%2C%22PageSize%22%3A%22%22%2C%22SortOrder%22%3A%5B%22SCORE%22%5D%2C%22Facets%22%3A%5B%5D%2C%22Category%22%3A%22HU_SCL_SCHEDULED_BRACKETED_COURSES%22%2C%22SearchPropertiesInResults%22%3Atrue%2C%22FacetsInResults%22%3Atrue%2C%22SaveRecent%22%3Afalse%2C%22TopN%22%3A%22%22%2C%22ExcludeBracketed%22%3Atrue%2C%22SearchText%22%3A%22(%20ac%20207%20)%20(ACAD_CAREER%3A%5C%22FAS%5C%22)%22%2C%22DeepLink%22%3Afalse%7D""; AWSALB=IFnSiZK3uo0FYJOfym4A4YRhNd1nrFB+RWNUgCceUUEapam9Z7UOfXhsqVSL1lZ9nldmEHkaIjNE6aDvopWUDDrk2/VKq3/wZMsj4dSCbTMInYf9vzY6lfOkn6Ns; AWSALBCORS=IFnSiZK3uo0FYJOfym4A4YRhNd1nrFB+RWNUgCceUUEapam9Z7UOfXhsqVSL1lZ9nldmEHkaIjNE6aDvopWUDDrk2/VKq3/wZMsj4dSCbTMInYf9vzY6lfOkn6Ns; PS_TOKENEXPIRE=30_Dec_2021_23:30:29_GMT'

PREFIX='SearchReqJSON={"ExcludeBracketed":true,"PageNumber":'
SUFFIX=',"PageSize":"","SortOrder":["SCORE"],"Facets":[],"Category":"HU_SCL_SCHEDULED_BRACKETED_COURSES","SearchPropertiesInResults":true,"FacetsInResults":true,"SaveRecent":true,"TopN":"","SearchText":"( * ) (ACAD_CAREER:\"NONH\")","DeepLink":false}'

function getPage() {
    curl --location --request POST 'https://portal.my.harvard.edu/psc/hrvihprd/EMPLOYEE/EMPL/s/WEBLIB_IS_SCL.ISCRIPT1.FieldFormula.IScript_Search' \
        --header "Cookie: $MY_HARVARD_COOKIE" \
        --header 'Content-Type: application/x-www-form-urlencoded' \
        --data-urlencode "${PREFIX}$1${SUFFIX}"
}

echo "building node.js scripts"

npx tsc@latest --noEmit false --outDir build --module commonjs

if [[ $? -ne 0 ]]; then
    echo "failed building typescript project"
    exit 1
fi

mkdir -p "$ROOT_DIR/outData"

if [[ -z $FORCE ]]; then
    read -p "Load evaluations? "
fi
if [[ -z $FORCE && $REPLY =~ ^[Yy] ]]; then
    echo "downloading evaluations"
    node "$ROOT_DIR/build/scripts/fetchEvaluations.js" >"$ROOT_DIR/outData/evaluations.json"
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
        node "$ROOT_DIR/build/scripts/cliHelper.js" "$OUT_FILE" >"$UPDATED_FILE" 2>"$BATCH_PATH/update_errors/$PAGE_NUMBER.txt"
        echo "=== UPDATED page $PAGE_NUMBER"
    fi
}

echo "sending initial request"
TOTAL_PAGES=$(getPage 1 | jq '.[2].TotalPages')

if [[ $? -ne 0 || -z TOTAL_PAGES ]]; then
    echo "could not get my.harvard request"
    exit 1
fi

N_BATCHES=$((((TOTAL_PAGES - 1) / BATCH_SIZE) + 1))

echo "Total pages: $TOTAL_PAGES to be loaded in $N_BATCHES batches of $BATCH_SIZE"

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
    BATCH_PATH="$ROOT_DIR/outData/batch$((BATCH + 1))"
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
        sleep 0.5
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
            -X POST 'http://127.0.0.1:7700/indexes/courses/documents' \
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
