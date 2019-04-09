tsc: clean
	npm run tsc

npm-reinstall:
	rn -Rf node_modules
	npm install

npm-install:
	npm install

tsc-watch: clean
	npm run tsc-watch

lint:
	npm run lint

clean:
	rm -Rf build

prettier:
	tools/prettier_only_newer_files.py

expo: tsc
	expo start

expo-ios: tsc
	expo start --ios

expo-android: tsc
	expo start --android

generate-png:
	tools/create_pngs.sh

assert-all-commited:
	if [ -n "$(GIT_PORCELAIN_STATUS)" ]; \
	then \
	    echo 'YOU HAVE UNCOMMITED CHANGES'; \
	    git status; \
	    exit 1; \
	fi

update-app-json-and-version:
	tools/prepare_app_json.py
	source VERSION && echo "channel=$$CHANNEL"
	source VERSION && echo "version=$$VERSION"

over-the-air-update: assert-all-commited tsc update-app-json-and-version
	source VERSION && expo publish --release-channel $$CHANNEL

build-all: assert-all-commited tsc update-app-json-and-version
	source VERSION && expo build:android --release-channel $$CHANNEL
	source VERSION && expo build:ios --release-channel $$CHANNEL

build-android: assert-all-commited tsc update-app-json-and-version
	source VERSION && expo build:android --release-channel $$CHANNEL

build-ios: assert-all-commited tsc update-app-json-and-version
	source VERSION && expo build:ios --release-channel $$CHANNEL