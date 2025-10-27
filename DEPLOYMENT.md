# Deployment Instructions

This document explains how to deploy the SVG Path Merger application to GitHub Pages.

## 🚀 Automatic Deployment

The application is configured to automatically deploy to GitHub Pages using GitHub Actions whenever changes are pushed to the `main` branch.

### Prerequisites

1. **Enable GitHub Pages** in your repository:
   - Go to your repository on GitHub
   - Navigate to `Settings` → `Pages`
   - Under "Build and deployment":
     - Source: Select **"GitHub Actions"**
   - Save the settings

2. **Workflow permissions**:
   - Go to `Settings` → `Actions` → `General`
   - Scroll to "Workflow permissions"
   - Select **"Read and write permissions"**
   - Check **"Allow GitHub Actions to create and approve pull requests"**
   - Save

### How It Works

The `.github/workflows/deploy.yml` workflow:
1. Triggers on every push to the `main` branch
2. Installs Node.js dependencies
3. Builds the application with Vite
4. Deploys the `dist/` folder to GitHub Pages

### Manual Trigger

You can also manually trigger the deployment:
1. Go to the `Actions` tab on GitHub
2. Select the "Deploy to GitHub Pages" workflow
3. Click "Run workflow"
4. Select the branch and click "Run workflow"

## 🔗 Access Your Deployment

Once deployed, your application will be available at:
```
https://[username].github.io/SVG-Path-Merger/
```

Replace `[username]` with your GitHub username.

## 🛠️ Local Production Build

To test the production build locally:

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

The preview will be available at `http://localhost:4173`

## 📝 Configuration

### Base URL

The base URL is configured in `vite.config.js`:
```javascript
base: process.env.NODE_ENV === 'production' ? '/SVG-Path-Merger/' : '/',
```

If you rename the repository, update this value accordingly.

### Custom Domain

To use a custom domain:
1. Add a `CNAME` file in the `public/` directory with your domain
2. Configure your DNS provider to point to GitHub Pages
3. Update the `base` in `vite.config.js` to `/`

## 🐛 Troubleshooting

### Build Fails
- Check the Actions tab for detailed error logs
- Ensure all dependencies are properly listed in `package.json`
- Verify Node.js version compatibility (currently set to Node 20)

### 404 Errors
- Verify the base URL in `vite.config.js` matches your repository name
- Check that GitHub Pages is enabled in repository settings
- Ensure the workflow has proper permissions

### Assets Not Loading
- Verify the `base` configuration in `vite.config.js`
- Check browser console for CORS or path errors
- Ensure `.nojekyll` file exists in the `public/` directory

## 📊 Monitoring

You can monitor deployments in the `Actions` tab of your repository:
- View build logs
- Check deployment status
- Debug any issues

## 🔄 Rolling Back

To rollback to a previous version:
1. Go to the `Actions` tab
2. Find the successful deployment you want to restore
3. Re-run that workflow

Or manually:
```bash
git revert [commit-hash]
git push origin main
```
