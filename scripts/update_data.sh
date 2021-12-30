#!/bin/bash

echo "starting with pid $$"

ROOT_DIR=$(pwd)
BATCH_SIZE=6

FORCE=

for ARG in $@; do
    if [[ $ARG == "-f" ]]; then
        FORCE="yes"
    fi
done

export MY_HARVARD_COOKIE='_clck=j48mwa|1|ew8|0; OptanonAlertBoxClosed=2021-11-09T16:15:25.157Z; OptanonConsent=isIABGlobal=false&datestamp=Mon+Nov+29+2021+16:29:47+GMT-0500+(Eastern+Standard+Time)&version=6.15.0&hosts=&consentId=44fa3662-4b23-4918-9e16-713114936874&interactionCount=1&landingPath=NotLandingPage&groups=C0001:1,C0002:1,C0003:1,C0004:1,C0005:1&geolocation=US;&AwaitingReconsent=false; MOD_AUTH_CAS=7cdb431e861de6e2d20c09a07eacef30; hrvihprd-858p-8080-PORTAL-PSJSESSIONID=iNsJ1HQ6laAAq4GbxGmVxJy1Q2XWSX6Z!1709796157; PS_TokenSite=https://portal.my.harvard.edu/psp/hrvihprd/?hrvihprd-858p-8080-PORTAL-PSJSESSIONID; PS_TOKEN=sQAAAAQDAgEBAAAAvAIAAAAAAAAsAAAABABTaGRyAk4AfQg4AC4AMQAwABREyQVHRXz3o8WxX6jkPh0CroY+tnEAAAAFAFNkYXRhZXicHYzBDoMwDENfAe3MmX+gYqGr1DtscEFoIK58CX+2j5tprNhWnOQCqrJwTvoryFVHngSMKHRyj5GFD83Kxpudk4kvB7N0lRsIpkXTWas2sZGyT3h6wevNK/OdB00S/AE1kA05; ps_theme=node:EMPL portal:EMPLOYEE theme_id:HU_BRANDING_THEME accessibility:N formfactor:3 piamode:2; ps_theme=node:EMPL portal:EMPLOYEE theme_id:HU_BRANDING_THEME accessibility:N formfactor:3 piamode:2; HPTabName=HU_SSS; HPTabNameRemote=; LastActiveTab=HU_SSS; PS_DEVICEFEATURES=width:1440 height:900 pixelratio:2 touch:0 geolocation:1 websockets:1 webworkers:1 datepicker:1 dtpicker:1 timepicker:1 dnd:1 sessionstorage:1 localstorage:1 history:1 canvas:1 svg:1 postmessage:1 hc:0 maf:0; PS_LOGINLIST=https://csinternal.my.harvard.edu/hrvcsprd https://portal.my.harvard.edu/hrvihprd; hrvcsprd-clb-858p-8080-PORTAL-PSJSESSIONID=eUgJ1IGD19-v3SI4bUnxrwbl0cAuUeHN!1556269902; AWSELB=B98D5B150620EF03BF44401303982FFCAA00B474656CFEAAD1153DD509396C8FF6B86BDF715FDA7A2CE28DE3C53CFF2A74C9E4AD92B69BCD356E39C7016524B66AD11B4CDB1DB427F59F54051E3142E4BD61339DDEB1FE7699C694B90E0F7503E6725DBD61F845204535EBFFA75EDA6B33461234FE; SignOnDefault=; ExpirePage=https://csinternal.my.harvard.edu/psp/hrvcsprd/; https://portal.my.harvard.edu/psp/hrvihprd/employee/empl/refresh=list:|; PS_TOKENEXPIRE=30_Dec_2021_05:34:25_GMT; psback=""url":"https://portal.my.harvard.edu/psp/hrvihprd/EMPLOYEE/EMPL/h/?tab=HU_SSS&jsconfig=%7B%22menuclicked%22%3A%22IS_SSS_SUMMARY_VIEWLnk%22%7D" "label":"Home" "origin":"PIA" "layout":"0" "refurl":"https://portal.my.harvard.edu/psp/hrvihprd/EMPLOYEE/EMPL/h/?tab=HU_SSS&jsconfig=%7B%22menuclicked%22%3A%22IS_SSS_SUMMARY_VIEWLnk%22%7D""; AWSALB=DfCrmMY5btOVtfVKDlH+jJ9GrGVinJ/09G17xB5ZWD3M1pbuqUCBZ8iyB/GH1wPtspgM4OeDNHyBKM86z1t5MFeCaEDTGY0IDkd0s4SIFisJdn1JKiHYd5mWPubs; AWSALBCORS=DfCrmMY5btOVtfVKDlH+jJ9GrGVinJ/09G17xB5ZWD3M1pbuqUCBZ8iyB/GH1wPtspgM4OeDNHyBKM86z1t5MFeCaEDTGY0IDkd0s4SIFisJdn1JKiHYd5mWPubs; PS_LASTSITE=https://csinternal.my.harvard.edu/psp/hrvcsprd/'

PREFIX='SearchReqJSON={"ExcludeBracketed":true,"PageNumber":'
SUFFIX=',"PageSize":"","SortOrder":["SCORE"],"Facets":[],"Category":"HU_SCL_SCHEDULED_BRACKETED_COURSES","SearchPropertiesInResults":true,"FacetsInResults":true,"SaveRecent":true,"TopN":"","SearchText":"( * ) (ACAD_CAREER:\"FAS\")","DeepLink":false}'

function getPage() {
    curl --location --request POST 'https://portal.my.harvard.edu/psc/hrvihprd/EMPLOYEE/EMPL/s/WEBLIB_IS_SCL.ISCRIPT1.FieldFormula.IScript_Search' \
        --header "Cookie: $MY_HARVARD_COOKIE" \
        --header 'Content-Type: application/x-www-form-urlencoded' \
        --data-urlencode "${PREFIX}1${SUFFIX}"
}

echo "building node.js scripts"

npx tsc@latest --noEmit false --outDir build --module commonjs

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
N_BATCHES=$((((TOTAL_PAGES - 1) / BATCH_SIZE) + 1))

START_PAGE_INPUT=1
if [[ -z $FORCE ]]; then
    read -p "Start at page? (between 1 and $TOTAL_PAGES) " START_PAGE_INPUT
fi

if [ $START_PAGE_INPUT -gt $TOTAL_PAGES ]; then
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
        sleep 2
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
            -X POST 'http://127.0.0.1:7700/indexes/classes/documents' \
            -H 'Content-Type: application/json' \
            --data-binary "@$BATCH_PATH/allExtended.json"
        echo
    fi

    if [[ -z $FORCE && $BATCH -lt $((N_BATCHES - 1)) ]]; then
        read -p "Done. Load next batch? "
        if [[ ! "$REPLY" =~ ^[Yy] ]]; then
            break
        fi
    fi
    sleep 2
done
