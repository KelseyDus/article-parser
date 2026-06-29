# ArticleVault

AI-powered article library. Drop any URL → Claude reads, summarizes, and catalogs it.

## Deploy

### 1. GitHub
1. github.com → **New repository** → name it `article-vault` → **Create**
2. Click **uploading an existing file**
3. Drag in everything from this zip — make sure `api/analyze.js` lands inside an `api/` folder
4. **Commit to main**

> If the `api/` folder is missing after drag-and-drop: click **Add file → Create new file**, type `api/analyze.js` as the filename, paste the file contents in manually.

### 2. Vercel
1. vercel.com → **Add New Project** → **Import** your `article-vault` repo
2. **Leave ALL build settings blank** — Framework Preset: Other, everything else empty
3. Under **Environment Variables** add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your key from console.anthropic.com
4. **Deploy**

## File structure
```
article-vault/
├── index.html       ← Full app (React via CDN, no build step)
├── api/
│   └── analyze.js   ← Serverless function
├── vercel.json      ← Routing only (no build config)
└── .gitignore
```
