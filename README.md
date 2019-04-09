# Opinionated minimal Expo (react-native) + Typescript app

## Features:

- Expo
- Typescript, including configuration for
    - Prettify (with custom script to prevent prettifing already prettified files)
    - Linting
- Custom version management:
    - for example `git tag v1.2.3 && make build-all` -- starts builds with:
        - version name `1.2.3`, build number `102003`
        - expo release channel `1.2.x`