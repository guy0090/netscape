#!/bin/bash
# Description: Publishes the app to GitHub Releases.
# Configure vue.config.js to use the correct repository and release type (Default: draft).

GH_TOKEN=YOUR_ACCESS_TOKEN npm run electron:build -- -p always
