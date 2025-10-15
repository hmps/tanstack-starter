#!/usr/bin/env bash

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CURRENT_WORKTREE_NAME="$(basename "$SCRIPT_DIR")"

# Files to copy
FILES_TO_COPY=(
    ".env.local"
    ".env.keys"
)

# Function to print colored messages
print_error() {
    echo -e "${RED}ERROR: $1${NC}" >&2
}

print_success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

print_info() {
    echo -e "${YELLOW}INFO: $1${NC}"
}

# Check if exactly one argument is provided
if [ $# -ne 1 ]; then
    print_error "Exactly one argument required"
    echo "Usage: $0 <worktree-name>"
    echo "Example: $0 main"
    echo "Example: $0 dev"
    exit 1
fi

SOURCE_WORKTREE_NAME="$1"

# Validate that the argument is either 'main' or 'dev'
if [[ "$SOURCE_WORKTREE_NAME" != "main" && "$SOURCE_WORKTREE_NAME" != "dev" ]]; then
    print_error "Argument must be either 'main' or 'dev'"
    echo "Provided: $SOURCE_WORKTREE_NAME"
    exit 1
fi

# Prevent copying from the same worktree
if [[ "$SOURCE_WORKTREE_NAME" == "$CURRENT_WORKTREE_NAME" ]]; then
    print_error "Cannot copy from the same worktree"
    echo "Current worktree: $CURRENT_WORKTREE_NAME"
    echo "Source worktree: $SOURCE_WORKTREE_NAME"
    exit 1
fi

# Construct the path to the source worktree
SOURCE_WORKTREE_PATH="$(dirname "$SCRIPT_DIR")/$SOURCE_WORKTREE_NAME"

# Check if the source worktree path exists
if [ ! -d "$SOURCE_WORKTREE_PATH" ]; then
    print_error "Source worktree directory does not exist: $SOURCE_WORKTREE_PATH"
    exit 1
fi

# Verify that the source path is a git worktree
if [ ! -f "$SOURCE_WORKTREE_PATH/.git" ]; then
    print_error "Source path is not a git worktree (missing .git file): $SOURCE_WORKTREE_PATH"
    exit 1
fi

# Read the .git file to verify it points to a worktree
GIT_FILE_CONTENT=$(cat "$SOURCE_WORKTREE_PATH/.git")
if [[ ! "$GIT_FILE_CONTENT" =~ ^gitdir:\ .*/\.bare/worktrees/ ]]; then
    print_error "Source path does not appear to be a valid git worktree"
    echo "Git file content: $GIT_FILE_CONTENT"
    exit 1
fi

print_info "Source worktree verified: $SOURCE_WORKTREE_PATH"
print_info "Current worktree: $SCRIPT_DIR"
echo ""

# Counter for copied files
COPIED_COUNT=0
SKIPPED_COUNT=0

# Find and copy all matching files
for FILE_PATTERN in "${FILES_TO_COPY[@]}"; do
    print_info "Searching for files matching: $FILE_PATTERN"
    
    # Find all files matching the pattern in the source worktree
    while IFS= read -r -d '' SOURCE_FILE; do
        # Get the relative path from the source worktree root
        RELATIVE_PATH="${SOURCE_FILE#$SOURCE_WORKTREE_PATH/}"
        
        # Construct the destination path
        DEST_FILE="$SCRIPT_DIR/$RELATIVE_PATH"
        DEST_DIR="$(dirname "$DEST_FILE")"
        
        # Create destination directory if it doesn't exist
        if [ ! -d "$DEST_DIR" ]; then
            print_info "Creating directory: $DEST_DIR"
            mkdir -p "$DEST_DIR"
        fi
        
        # Copy the file
        echo "  Copying: $RELATIVE_PATH"
        cp "$SOURCE_FILE" "$DEST_FILE"
        COPIED_COUNT=$((COPIED_COUNT + 1))
        
    done < <(find "$SOURCE_WORKTREE_PATH" -type f -name "$FILE_PATTERN" -print0 2>/dev/null)
done

echo ""
if [ $COPIED_COUNT -eq 0 ]; then
    print_info "No files were found to copy"
else
    print_success "Copied $COPIED_COUNT file(s) from '$SOURCE_WORKTREE_NAME' to '$CURRENT_WORKTREE_NAME'"
fi
