# ArticleVault

AI-powered article library. Drop any URL → Claude reads, summarizes, and catalogs it.

## Deploy in 5 minutes

### 1. GitHub
1. github.com → **New repository** → name it `article-vault` → **Create**
2. Click **uploading an existing file**
3. Drag in everything from this zip — make sure `api/analyze.js` is inside an `api/` folder
4. **Commit to main**

> If the `api/` folder doesn't appear after drag-and-drop, click **Add file → Create new file**, type `api/analyze.js` as the filename, and paste the contents in manually.

### 2. Vercel
1. vercel.com → **Add New Project** → **Import** your `article-vault` repo
2. Leave **all build fields blank** — the `vercel.json` handles everything
3. Under **Environment Variables**, add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your key from console.anthropic.com
4. Click **Deploy**

Done. Live URL in ~30 seconds.

## File structure
```
article-vault/
├── index.html       ← Full app (React via CDN, no build step)
├── api/
│   └── analyze.js   ← Serverless function (Anthropic + web search)
├── vercel.json      ← Routing config
├── .gitignore
└── README.md
```
