#!/bin/bash
# Save this as music-sorter.sh in the root of your project

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run the application with all arguments passed through
node "$DIR/dist/index.js" "$@"
