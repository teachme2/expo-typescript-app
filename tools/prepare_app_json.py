#!/usr/bin/env python3

import subprocess as mod_subprocess
import re as mod_re
import json as mod_json
import time as mod_time

from typing import *

def get_version(version_string: str) -> Tuple[str, str, int]:
	groups = mod_re.findall("^v(\\d+)\.(\\d+)\.(\\d+)$", version_string)
	if not groups:
		raise Exception("Invalid version: {}".format(version_string))

	major = int(groups[0][0])
	minor = int(groups[0][1])
	patch = int(groups[0][2])

	if major > 99:
		raise Exception("Major version must be <99")
	if minor > 99:
		raise Exception("Minor version must be <99")
	if patch > 999:
		raise Exception("Patch version must be <999")

	v = "{}.{}.{}".format(major, minor, patch)
	release_channel = "{}.{}.x".format(major, minor)

	return v, release_channel, major*100000 + minor*1000 + patch

def main():
	git_version = mod_subprocess.check_output(["git", "describe", "--tags"]).decode("utf-8")
	if git_version[0] != "v":
		raise Exception("Invalid version: {}".format(git_version))

	if "-g" in git_version:
		raise Exception("Invalid version: {}".format(git_version))

	version_string, release_channel, version_code = get_version(git_version)
	print(version_string)
	print(release_channel)
	print(version_code)

	with open("app.json") as f:
		original_json = f.read()
		app_json = mod_json.loads(original_json)

	prev_version_code = int(app_json["expo"]["android"]["versionCode"])
	print(prev_version_code)
	if prev_version_code >= version_code:
		raise Exception("version code {} > {}".format(prev_version_code, version_code))

	print("version: {}".format(version_string))
	print("expo release channel: {}".format(release_channel))
	print("version code {} (previously {})".format(version_code, prev_version_code))

	app_json["expo"]["version"] = version_string
	app_json["expo"]["ios"]["buildNumber"] = version_string
	app_json["expo"]["android"]["versionCode"] = version_code

	with open("app.json-{}".format(mod_time.time()), "w") as f:
		f.write(original_json)
	with open("app.json", "w") as f:
		f.write(mod_json.dumps(app_json, sort_keys=True, indent=4))
	with open("VERSION", "w") as f:
		f.write("VERSION={}\nCHANNEL={}".format(version_string, release_channel))

main()