# PyBlocks

PyBlocks is a browser-based visual playground for learning Python. Arrange
blocks to build a program, then run it to see the generated Python and output.

## Project structure

- `site/index.html` — the complete static app (HTML, CSS, and JavaScript)
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
