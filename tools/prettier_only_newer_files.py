#!/usr/bin/env python3

import os as mod_os
import json as mod_json
import subprocess as mod_subprocess
import time as mod_time

CACHE_FILE_NAME = ".prettify_files_time"

def get_all_and_newer_files():
    all_files: Dict[str, int] = {}
    for root, dirs, files in mod_os.walk("src", topdown=False):
        for name in files:
            fn: str = mod_os.path.join(root, name)
            if fn.endswith(".ts") or fn.endswith(".tsx"):
                stat = mod_os.stat(fn)
                all_files[fn] = stat.st_mtime
    return all_files

def main():

    files = get_all_and_newer_files()
    try:
        with open(CACHE_FILE_NAME, "r") as f:
            jsn = f.read()
            cached: Dict[str, int] = mod_json.loads(jsn)
            print("loaded", CACHE_FILE_NAME)
    except:
        cached = {}
        print("not found", CACHE_FILE_NAME, "=> new")

    try:
        if mod_time.time() - mod_os.stat(CACHE_FILE_NAME).st_mtime > 60 * 60 * 12:
            cached = {}
            print("too old", CACHE_FILE_NAME, "=> new")
    except:
        cached = {}
        print("not found", CACHE_FILE_NAME, "=> new")

    newer_files: Array[str] = []
    for file, time in files.items():
        if not (file in cached):
            newer_files.append(file)
        elif time > cached[file]:
            newer_files.append(file)

    if len(newer_files) > 0:
        args: Array[str] = ["./node_modules/.bin/prettier", "--write"]
        args.extend(newer_files)
        mod_subprocess.run(args)

    with open(CACHE_FILE_NAME, "w") as f:
        files = get_all_and_newer_files()
        f.write(mod_json.dumps(files))
        print("written", CACHE_FILE_NAME)

main()