# Music Sorter

A command-line utility for organizing and sorting music files in Termux.

## Features

- Sort music by various metadata:
  - Artist
  - Album Artist
  - Album
  - Genre
  - Year
- Safely copy or move files
- Undo sorting operations
- Detailed logging

## Installation

```bash
# Clone the repository
git clone https://github.com/Coin-Jhar/music-sorter.git
cd music-sorter

# Install dependencies
pnpm install

# Build the project
pnpm run build
```

## Usage

```bash
# Sort by artist (copy instead of move)
pnpm run start sort --pattern artist --copy

# Sort by album artist
pnpm run start sort --pattern album-artist

# Sort by album
pnpm run start sort --pattern album

# Sort by genre
pnpm run start sort --pattern genre

# Sort by year
pnpm run start sort --pattern year

# Undo a sort operation
pnpm run start undo
```

## Configuration

Edit the `src/config/constants.ts` file to customize:
- Source and target directories
- Supported file extensions
- Sort patterns

## Testing

Run all unit and integration tests with:

```bash
pnpm test
```

## License

ISC
