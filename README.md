# SVG Path Merger

A simple and elegant web application to merge all `<path>` elements from an SVG into a single path.

## 🌐 Live Demo

**[Try it online](https://firestar300.github.io/SVG-Path-Merger/)** 🚀

## 🎯 Features

- **Automatic merging**: Combines all `<path>` elements from an SVG into a single path
- **Real-time preview**: Visualize the original SVG and merged SVG side by side
- **Detailed statistics**: Number of paths, file sizes, and reduction percentage
- **One-click copy**: Easily copy the merged SVG to clipboard
- **Modern interface**: Clean and responsive design with Tailwind CSS
- **Optimized build**: Built with Vite for maximum performance

## 🚀 Installation and Usage

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

The application will be accessible at `http://localhost:3000`

### Production

```bash
# Create an optimized production build
npm run build

# Preview the production build
npm run preview
```

### Using the Application

1. Paste your SVG code in the left field
2. The application will automatically merge all `<path>` elements
3. The result will appear in the right field
4. Click "Copy" to copy the merged SVG

## 🚀 Deployment

The application is automatically deployed to GitHub Pages via GitHub Actions on every push to the `main` branch.

### Manual Deployment

```bash
# Build for production
npm run build

# The dist/ folder contains the production-ready files
```

## 💡 Example

**Input:**

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <path d="M 10 10 L 30 10 L 30 30 L 10 30 Z" fill="#4f46e5"/>
  <path d="M 40 10 L 60 10 L 60 30 L 40 30 Z" fill="#6366f1"/>
  <path d="M 70 10 L 90 10 L 90 30 L 70 30 Z" fill="#818cf8"/>
</svg>
```

**Output:**

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <path d="M 10 10 L 30 10 L 30 30 L 10 30 Z M 40 10 L 60 10 L 60 30 L 40 30 Z M 70 10 L 90 10 L 90 30 L 70 30 Z" fill="#4f46e5"/>
</svg>
```

## 🛠️ Technologies

- **Vite** - Fast and modern build tool
- **Tailwind CSS** - Utility-first CSS framework
- **JavaScript ES6+** - Modern JavaScript
- **HTML5** - Semantic structure

## 📝 Notes

- The `fill`, `stroke`, and `stroke-width` attributes from the first path are preserved
- Complex transformations may require manual processing
- The application runs entirely client-side (no data is sent to any server)

## 🎨 Screenshots

The interface includes:

- Two text fields for SVG code (input and output)
- Two preview areas with checkerboard background
- Real-time statistics
- Intuitive action buttons

## 🔒 Privacy

All operations are performed locally in your browser. No data is transmitted to any external server.

## 📄 License

This project is free to use for any personal or commercial purpose.

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.
