#!/bin/bash

# Convert TTF fonts to WOFF2 format
# Requires: woff2 (brew install woff2)

FONT_DIR="$(dirname "$0")/../src/app/fonts/Inter"

# Check if woff2_compress is installed
if ! command -v woff2_compress &> /dev/null; then
    echo "woff2 not found. Installing via Homebrew..."
    brew install woff2
fi

echo "Converting TTF files to WOFF2..."

# Convert variable fonts (main ones)
for ttf in "$FONT_DIR"/*.ttf; do
    if [ -f "$ttf" ]; then
        echo "Converting: $ttf"
        woff2_compress "$ttf"
    fi
done

# Convert static fonts
for ttf in "$FONT_DIR"/static/*.ttf; do
    if [ -f "$ttf" ]; then
        echo "Converting: $ttf"
        woff2_compress "$ttf"
    fi
done

echo ""
echo "Conversion complete!"
echo ""

# Ask before deleting
read -p "Delete original TTF files? (y/n): " confirm
if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
    echo "Deleting TTF files..."
    find "$FONT_DIR" -name "*.ttf" -delete
    echo "TTF files deleted."
else
    echo "TTF files kept."
fi

