# PyBlocks

PyBlocks is a browser-based Python learning app with two pages: a visual coding
sandbox and a chapter-based learning path. Arrange blocks in the sandbox to
build a program, then run it to see the generated Python and output. Complete
chapter missions to earn XP, unlock levels, and save progress in your browser.

## Project structure

- `site/index.html` — the visual coding sandbox and default page
- `site/learn.html` — the gamified, chapter-by-chapter Python learning path
- `index.html` — redirects root-based Pages deployments to the app
- `.github/workflows/deploy-pages.yml` — publishes the app to GitHub Pages

There is no build step or package installation required.

## Run locally

Open `site/index.html` in a browser, or serve the `site` directory locally:

```powershell
python -m http.server 8000 --directory site
```

Then visit <http://localhost:8000>.

## Deploy to GitHub Pages

1. Push the repository to GitHub on the `main` branch.
2. In the repository, open **Settings → Pages**.
3. Set **Build and deployment → Source** to **GitHub Actions**.
4. The workflow deploys the contents of `site/` on every push to `main`.
   You can also run it manually from the **Actions** tab using
   **Deploy static site to GitHub Pages → Run workflow**.
5. Once the workflow succeeds, open the Pages URL shown in the workflow run or
   under **Settings → Pages**.
