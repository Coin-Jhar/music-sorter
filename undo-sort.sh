#!/bin/bash

# Path variables
SOURCE="/data/data/com.termux/files/home/storage/music/Telegram"
SORTED="${SOURCE}/sorted-music"

# Create backup script
cat > ~/undo-sort.sh << 'EOF'
#!/bin/bash

SOURCE="/data/data/com.termux/files/home/storage/music/Telegram"
SORTED="${SOURCE}/sorted-music"

echo "Moving files back from sorted directory to original location..."

# Find all files in the sorted directory and move them back
find "$SORTED" -type f -name "*.mp3" -o -name "*.flac" -o -name "*.wav" -o -name "*.m4a" -o -name "*.ogg" -o -name "*.aac" | while read file; do
  filename=$(basename "$file")
  echo "Moving: $filename"
  mv "$file" "$SOURCE/"
done

echo "Cleanup empty directories..."
find "$SORTED" -type d -empty -delete

echo "Undo complete! All files returned to original location."
EOF

# Make it executable
chmod +x ~/undo-sort.sh
