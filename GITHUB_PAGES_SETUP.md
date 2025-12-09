# 🚀 GitHub Pages Deployment Guide

## ✅ Is it Free?

**YES! GitHub Pages is 100% FREE** for public repositories with these generous limits:

- Unlimited bandwidth (soft limit ~100GB/month)
- Unlimited visitors
- Free SSL certificate (HTTPS)
- Custom domain support (optional)
- No credit card required

## 📋 Prerequisites

- GitHub account (free)
- Git installed on your computer
- Your repository pushed to GitHub

## 🔧 Step-by-Step Setup

### 1. Update Vite Config (Already Done! ✅)

The `vite.config.ts` has been updated with:

```typescript
base: "/ShapeMadness/"; // Your repo name
```

**⚠️ IMPORTANT**: If your GitHub repo name is different, update this line!

### 2. Create GitHub Actions Workflow (Already Done! ✅)

A deployment workflow has been created at:
`.github/workflows/deploy.yml`

This will automatically build and deploy on every push to `main` or `dev` branches.

### 3. Enable GitHub Pages in Your Repository

#### A. Go to Repository Settings

1. Open your repository on GitHub: `https://github.com/AnonUserThatsVeryAnon/ShapeMadness`
2. Click **Settings** tab (top right)
3. Scroll down to **Pages** in the left sidebar

#### B. Configure GitHub Pages

1. **Source**: Select "GitHub Actions"
2. **Branch**: Will be handled by the workflow
3. Click **Save**

### 4. Push Your Changes

```bash
# Add the new workflow file
git add .github/workflows/deploy.yml

# Add updated vite config
git add vite.config.ts

# Commit
git commit -m "Add GitHub Pages deployment workflow"

# Push to trigger deployment
git push origin dev  # or main, depending on your branch
```

### 5. Wait for Deployment

1. Go to **Actions** tab in your GitHub repo
2. You'll see a workflow running called "Deploy to GitHub Pages"
3. Wait 2-3 minutes for it to complete
4. Once green ✅, your site is live!

### 6. Access Your Game

Your game will be available at:

```
https://anoususerthatsvveryanon.github.io/ShapeMadness/
```

## 🎮 Testing Locally Before Deploy

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

Then open: `http://localhost:4173`

## 🔄 Future Updates

Every time you push to `main` or `dev` branch:

1. GitHub Actions automatically builds your game
2. Deploys to GitHub Pages
3. Live site updates in ~2 minutes

## 🐛 Troubleshooting

### Issue: 404 Page Not Found

**Solution**: Make sure `base: '/ShapeMadness/'` in `vite.config.ts` matches your exact repo name (case-sensitive!)

### Issue: Workflow Fails

**Solution**:

1. Check the Actions tab for error logs
2. Ensure GitHub Pages is set to "GitHub Actions" source
3. Make sure you have write permissions to the repo

### Issue: Site Shows Old Version

**Solution**:

1. Hard refresh: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
2. Clear browser cache
3. Wait a few minutes for CDN to update

### Issue: Assets Not Loading

**Solution**:

1. Verify `base` path in vite.config.ts
2. Check browser console for 404 errors
3. Ensure all paths are relative (not absolute)

## 📊 Current Setup Status

✅ Vite config updated with base path
✅ GitHub Actions workflow created
✅ Production build tested (231 KB gzipped)
⏳ Needs: GitHub Pages enabled in repo settings
⏳ Needs: Push to GitHub to trigger deployment

## 🎯 Next Steps

1. **Enable GitHub Pages** in your repo settings (Source: GitHub Actions)
2. **Push these changes** to GitHub
3. **Watch the deployment** in the Actions tab
4. **Share your game** with the world! 🎮

## 💡 Pro Tips

- **Custom Domain**: You can add a custom domain (e.g., `shapemadness.com`) for free!
- **Analytics**: Add Google Analytics to track visitors
- **SEO**: Add meta tags in `index.html` for better sharing on social media
- **Monitoring**: GitHub shows deployment history and traffic stats

## 📝 Cost Breakdown

| Feature                 | Cost                    |
| ----------------------- | ----------------------- |
| Hosting                 | **FREE**                |
| SSL Certificate         | **FREE**                |
| Bandwidth (100GB/month) | **FREE**                |
| Custom Domain           | **$12/year** (optional) |
| **Total**               | **$0/year**             |

---

**You're all set!** Your game will be live once you push and enable GitHub Pages. Good luck! 🚀
