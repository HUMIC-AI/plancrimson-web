#!/bin/bash

function count() {
    if [[ -z "$1" ]]; then
        echo "pass directory to get documents from"
    else
        cat "$1"/batch*/allExtended.json | jq -s '[.[] | .[] | .id] | unique | length'
    fi
}

function load() {
    if [[ -z "$1" ]]; then
        echo "pass directory to get documents from"
    else
        if [[ -n "$MEILI_IP" ]]; then
            HOST="$MEILI_IP"
            if [[ -z "$MEILI_PRIVATE" ]]; then
                echo "must set MEILI_PRIVATE api key"
                exit 1
            fi
        else
            HOST='http://localhost:7700'
        fi
        read -p "load $(count $1) documents into $HOST? "
        if [[ $REPLY =~ ^[Yy] ]]; then
            ls "$1"/batch*/allExtended.json | xargs -I{} curl \
                -X POST "$HOST/indexes/courses/documents" \
                -H "X-Meili-API-Key: $MEILI_PRIVATE" \
                -H 'Content-Type: application/json' \
                --data-binary "@{}"
        else
            echo "skipping"
        fi
    fi
}

if [[ $1 == 'count' || $1 == 'load' ]]; then
    $@
else
    echo "unrecognized command"
fi
