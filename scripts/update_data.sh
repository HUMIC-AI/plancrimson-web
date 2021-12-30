#!/bin/bash

echo "starting with pid $$"

ROOT_DIR="/Users/alexandercai/Developer/web/harvard-concentration-planner"
BATCH_SIZE=50

FORCE=

for ARG in $@; do
    if [[ $ARG == "-f" ]]; then
        FORCE="yes"
    fi
done

export MY_HARVARD_COOKIE='_clck=j48mwa|1|ew8|0; OptanonAlertBoxClosed=2021-11-09T16:15:25.157Z; OptanonConsent=isIABGlobal=false&datestamp=Mon+Nov+29+2021+16:29:47+GMT-0500+(Eastern+Standard+Time)&version=6.15.0&hosts=&consentId=44fa3662-4b23-4918-9e16-713114936874&interactionCount=1&landingPath=NotLandingPage&groups=C0001:1,C0002:1,C0003:1,C0004:1,C0005:1&geolocation=US;&AwaitingReconsent=false; ExpirePage=https://portal.my.harvard.edu/psp/hrvihprd/; PS_TokenSite=https://portal.my.harvard.edu/psp/hrvihprd/?hrvihprd-858p-8080-PORTAL-PSJSESSIONID; PS_TOKEN=qwAAAAQDAgEBAAAAvAIAAAAAAAAsAAAABABTaGRyAk4AfQg4AC4AMQAwABTIQetbFGlt+y+FMw1uMsVsS2ZxvWsAAAAFAFNkYXRhX3icHYy5DYBADASHR8TE9MAJzCdy3gQhQKRUQmcUx+o8sncC2y8QR2EQKL8QX2lLSY3RikKWjGzMZDsnExcPCwc3q3KXDdSmRdNZrjZNo/de4WiEk5XeC9H5x/w05A0t; ps_theme=node:EMPL portal:EMPLOYEE theme_id:HU_BRANDING_THEME accessibility:N formfactor:3 piamode:2; ps_theme=node:EMPL portal:EMPLOYEE theme_id:HU_BRANDING_THEME accessibility:N formfactor:3 piamode:2; HPTabNameRemote=; PS_DEVICEFEATURES=width:1440 height:900 pixelratio:2 touch:0 geolocation:1 websockets:1 webworkers:1 datepicker:1 dtpicker:1 timepicker:1 dnd:1 sessionstorage:1 localstorage:1 history:1 canvas:1 svg:1 postmessage:1 hc:0 maf:0; hrvcsprd-clb-858p-8080-PORTAL-PSJSESSIONID=easIrn8O4O7Re-nLkeimfenq3GdYbcYT!1556269902; AWSELB=B98D5B150620EF03BF44401303982FFCAA00B474656CFEAAD1153DD509396C8FF6B86BDF715FDA7A2CE28DE3C53CFF2A74C9E4AD92A589093BF6E1445731F8CBFCE31D8C165BEB1E9A88005AA986882988A019AFDCB1FE7699C694B90E0F7503E6725DBD61F845204535EBFFA75EDA6B33461234FE; PS_LOGINLIST=https://csinternal.my.harvard.edu/hrvcsprd https://portal.my.harvard.edu/hrvihprd; PS_LASTSITE=https://portal.my.harvard.edu/psp/hrvihprd/; HPTabName=HU_CLASS_SEARCH; LastActiveTab=HU_CLASS_SEARCH; MOD_AUTH_CAS=ef8d6bd8c40944e8187cb5f881b9d9c9; hrvihprd-858p-8080-PORTAL-PSJSESSIONID=MNYJZedqc7zHi7epeGnuBF2meSMGuMpv!1709796157; SignOnDefault=61426604; https://portal.my.harvard.edu/psp/hrvihprd/employee/empl/refresh=list: ?tab=hu_sss|?rp=hu_sss|?tab=remoteunifieddashboard|?rp=remoteunifieddashboard; psback=""url":"https://portal.my.harvard.edu/psp/hrvihprd/EMPLOYEE/EMPL/h/?tab=HU_CLASS_SEARCH&SearchReqJSON={%22PageNumber%22:1,%22PageSize%22:%22%22,%22SortOrder%22:[%22SCORE%22],%22Facets%22:[],%22Category%22:%22HU_SCL_SCHEDULED_BRACKETED_COURSES%22,%22SearchPropertiesInResults%22:true,%22FacetsInResults%22:true,%22SaveRecent%22:false,%22TopN%22:%22%22,%22ExcludeBracketed%22:true,%22SearchText%22:%22*%22,%22DeepLink%22:false}" "label":"Home" "origin":"PIA" "layout":"0" "refurl":"https://portal.my.harvard.edu/psp/hrvihprd/EMPLOYEE/EMPL/h/?tab=HU_CLASS_SEARCH&SearchReqJSON={%22PageNumber%22:1,%22PageSize%22:%22%22,%22SortOrder%22:[%22SCORE%22],%22Facets%22:[],%22Category%22:%22HU_SCL_SCHEDULED_BRACKETED_COURSES%22,%22SearchPropertiesInResults%22:true,%22FacetsInResults%22:true,%22SaveRecent%22:false,%22TopN%22:%22%22,%22ExcludeBracketed%22:true,%22SearchText%22:%22*%22,%22DeepLink%22:false}""; AWSALB=wZLUlzJxBkj/jfbQ+imX050CUBirTd6ECIfhDRwXiKclc0eq/8Bl7tJYWkXYLjPMOVVnWExXkJw8zS1CANSRdXsqtXRH0Y1U7tFrAd941DPE25HQmMA/bDT+VNGl; AWSALBCORS=wZLUlzJxBkj/jfbQ+imX050CUBirTd6ECIfhDRwXiKclc0eq/8Bl7tJYWkXYLjPMOVVnWExXkJw8zS1CANSRdXsqtXRH0Y1U7tFrAd941DPE25HQmMA/bDT+VNGl; PS_TOKENEXPIRE=30_Dec_2021_03:33:15_GMT'
export Q_REPORTS_COOKIE='_clck=j48mwa|1|ew8|0; OptanonAlertBoxClosed=2021-11-09T16:15:25.157Z; OptanonConsent=isIABGlobal=false&datestamp=Mon+Nov+29+2021+16:29:47+GMT-0500+(Eastern+Standard+Time)&version=6.15.0&hosts=&consentId=44fa3662-4b23-4918-9e16-713114936874&interactionCount=1&landingPath=NotLandingPage&groups=C0001:1,C0002:1,C0003:1,C0004:1,C0005:1&geolocation=US;&AwaitingReconsent=false; JSESSIONID=3177F9C4F74186D5A16DCB6B140D064E'
export EXPLORANCE_COOKIE='cookiesession1=678B2900234567898901234ABCEFBA23; GDPR_tokenf17de2b2277e4e8c38e7a9303a75868af96b9afa7d12939a7012b3869de24863=f17de2b2277e4e8c38e7a9303a75868af96b9afa7d12939a7012b3869de24863; ASP.NET_SessionId=tgziigg3z0dxpnze1q0p1kej; CookieName=C6759024D9FBCDFAFDDFA503692A0ABBB5754D7A930E800D49B78B0AC47AEC17973F9D8E3278513F106DC2C87BDB5DC998F3C96505A355976BBB39849CDEF3B6DD2266044B66E505CC8F6C2F4D563AFF1DF2668E33AA506769543E8003D599F6E6A90EF45DDA9BA32A4A0604E5776873CBC1EE465D5203C37C63C1B9230F3C6A4C705FE717F35F4E06D0090F782AF8B1BAD17E4110797B74964101BA17C9B162C8F7722D1FB3E9BB1608729266449987'

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
        node "$ROOT_DIR/build/scripts/getEvaluations.js" "$OUT_FILE" >"$UPDATED_FILE" 2>"$BATCH_PATH/update_errors/$PAGE_NUMBER.txt"
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
    START_PAGE=$((START_PAGE_INPUT < NEXT_BATCH_START ? START_PAGE_INPUT : START_PAGE_AUX))
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
