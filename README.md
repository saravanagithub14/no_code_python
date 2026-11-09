# PyBlocks

PyBlocks is a browser-based Python learning app with two pages: a visual coding
sandbox and a chapter-based learning path. Arrange blocks in the sandbox to
build a program, then run it to see the generated Python and output. Complete
chapter missions to earn XP, unlock levels, and save progress in your browser.

> **Learn Python is currently locked ("Coming soon").** The Sandbox nav shows it
> as disabled and `learn.html` shows a locked screen; the lessons are still in
> the page, just hidden. To unlock, remove `class="learn-locked"` from `<body>`
> in `site/learn.html` and restore the nav link in `site/index.html` (the exact
> markup is in the comment there).

## On phones and tablets

The sandbox stacks into one column with Example / Clear / Run in a bottom bar.
Tap a palette block to add it, swipe the palette to see more, drag a palette
block into the canvas to place it, and press and hold a canvas block to move it.

## Project structure

```
site/                    the deployed app (no build step)
  index.html             visual coding sandbox (default page)
  learn.html             gamified, chapter-by-chapter learning path
  css/sandbox.css        styles for the sandbox
  css/learn.css          styles for the learning path
  js/sandbox.js          block editor, Python ↔ block sync and runner
  js/python-check.js     Python-style syntax errors with suggested fixes
  js/learn.js            lessons, missions, XP and progress tracking
docs/DESIGN.md           UI/UX redesign brief
index.html               redirects root-based Pages deployments to the app
.github/workflows/       GitHub Pages deployment workflow
```

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
