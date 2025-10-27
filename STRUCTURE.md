# Project Structure

```
SVG-Path-Merger/
├── .vscode/
│   └── extensions.json       # Recommended VSCode extensions
├── src/
│   ├── main.js               # JavaScript entry point
│   └── style.css             # Tailwind CSS styles
├── .gitignore                # Git ignore file
├── .prettierrc               # Prettier configuration
├── index.html                # HTML entry point
├── package.json              # npm dependencies and scripts
├── postcss.config.js         # PostCSS configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── vite.config.js            # Vite configuration
├── README.md                 # Main documentation
└── STRUCTURE.md              # This file
```

## File Descriptions

### Configuration

- **vite.config.js**: Vite configuration for build and development server
- **tailwind.config.js**: Custom Tailwind configuration (colors, extensions, etc.)
- **postcss.config.js**: PostCSS configuration for Tailwind and Autoprefixer
- **package.json**: Dependency management and npm scripts

### Source

- **src/main.js**: Main application logic
  - Event handling
  - SVG parsing and merging
  - Preview rendering
  - Clipboard management

- **src/style.css**: Tailwind directives and custom components
  - Tailwind layer imports
  - Custom utility classes
  - Checkerboard pattern styles

### HTML

- **index.html**: Application HTML structure
  - Uses Tailwind classes
  - Two sections (input/output)
  - Preview areas
  - Statistics display

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Create production build
npm run preview  # Preview production build
```

## Development Workflow

1. Modify files in `src/`
2. Changes are reflected instantly thanks to Vite's HMR
3. For production build, run `npm run build`
4. Optimized files will be in the `dist/` folder

## Technologies Used

- **Vite 5.x**: Ultra-fast build tool
- **Tailwind CSS 3.x**: Utility-first CSS framework
- **PostCSS**: CSS processing
- **Autoprefixer**: Browser compatibility
