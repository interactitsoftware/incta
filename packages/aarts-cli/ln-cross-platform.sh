#!/bin/sh
windows() { [[ -n "$WINDIR" ]]; }
if [[ -z "$2" ]]; then
    # Link-checking mode.
    if windows; then
        echo Link-checking mode: WINDOWS
        fsutil reparsepoint query "$1" > /dev/null
    else
        [[ -h "$1" ]]
    fi
else
    # Link-creation mode.
    if windows; then
        echo Link-creation mode: windows
        # Windows needs to be told if it's a directory or not. Infer that.
        # Also: note that we convert `/` to `\`. In this case it's necessary.
        if [[ -d "$2" ]]; then
            cmd <<< "mklink /D /J \"$1\" \"${2//\//\\}\"" > /dev/null
        else
            cmd <<< "mklink \"$1\" \"${2//\//\\}\"" > /dev/null
        fi
    else
        # You know what? I think ln's parameters are backwards.
        ln -s "$2" "$1"
    fi
fi