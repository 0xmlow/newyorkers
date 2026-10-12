#!/bin/bash
# Copy site/ into the scratchpad the headless server reads (a server cannot read the Desktop).
rsync -a --delete "$(dirname "$0")/../site/" /private/tmp/claude-501/sk/site/
