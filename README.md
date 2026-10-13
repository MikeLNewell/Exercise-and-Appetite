# Exercise and Appetite Regulation: Week 4 Digital Laboratory Workbook

A free, responsive, offline-storage-first digital practical for Principles of Nutrition at the University of Bedfordshire. Built from the supplied **PoN (Week 4) Exercise and Appetite Regulation** document.

## What students can do

- Explore the background to exercise and appetite regulation, including leptin, acylated ghrelin and PYY.
- Prepare an anonymous participant record and calculate predicted HRmax and 60%/85% targets.
- Follow both exercise protocols for cycle ergometer or treadmill with a 25-minute optional timer.
- Complete four 0–100 VAS ratings at pre-exercise, immediately post-exercise, and 15 minutes post-exercise.
- Record resting HR and heart rate/RPE at 5, 10, 15 and 20 minutes; calculate mean values and achieved HRmax percentages.
- View live-calculated results tables, SVG plots and local group comparisons.
- Answer the six original follow-up questions.
- Store multiple incomplete or completed participant records locally; export individual/consolidated CSV; export and restore complete JSON backups.

## Important scientific decisions for lecturer review

1. **85% vs 80% HRmax discrepancy:** The high-intensity protocol is labelled 85% HRmax but its resistance/speed adjustment paragraph refers to 80% HRmax. The app shows this discrepancy rather than concealing it, and calculates the stated 85% target.
2. **VAS upper anchors:** The source gives four zero-point anchors but does **not** define verbal anchors at 100. The app says so explicitly, preserves the original zero anchors and does not invent 100-point wording.
3. **RPE scale:** No specific RPE scale is supplied. The app accepts numerical RPE as instructed by the lecturer and does not describe it as Borg 6–20 or CR10.
4. **Ergometer settings:** The equipment-specific original power/resistance relationship is retained as a reference and flagged for checking against the ergometer used.
5. **Physiological scope:** Students measure subjective appetite and HR/RPE, **not** hormone concentrations.
6. **Safety:** Screening and consent are confirmation checkboxes only. The app is not a substitute for in-person supervision or institutional laboratory risk assessments.

## Site architecture

- `site/index.html`: accessible application shell and navigation
- `site/styles.css`: responsive styles, no remote fonts or graphics
- `site/core.js`: pure calculations, CSV and JSON input validation, data model
- `site/app.js`: screens, local persistence, browser downloads, charts, timer
- `.github/workflows/pages.yml`: deployment to GitHub Pages from `main`
- `tests/core.test.cjs`: calculation, import/export and persistence-model tests

No frameworks, backend, external libraries, database, API keys or service subscriptions are required. The site is entirely static. All assets use relative paths, so **GitHub Pages repository subpaths work without base-path configuration**. This equivalent lightweight implementation avoids a build tool and third-party runtime dependencies.

## Preview and local development

You can double-click `site/index.html` to open the app, or start a local web server:

```bash
python3 -m http.server 8000 --directory site
```

Then visit http://localhost:8000. Python's server is only for local preview: the deployed site requires no application server.

Run automated calculation tests (Node.js 18+):

```bash
node --test tests/core.test.cjs
```

There is no npm install or production build step. The contents of `site/` are the production site.

## Deploy free on GitHub Pages

1. Create a **new public GitHub repository**, such as `Exercise-and-Appetite`, with the default branch named `main`.
2. Upload all project files and folders to the repository root, preserving `.github/workflows/pages.yml` and `site/`.
3. Go to **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
4. Push any new commit to `main` or run the workflow under **Actions → Deploy digital laboratory workbook to GitHub Pages**.
5. Open `https://MikeLNewell.github.io/Exercise-and-Appetite/`. GitHub will also display the exact live URL after deployment under Settings → Pages.

If your GitHub organisation restricts Pages or workflow permissions, your repository administrator may need to enable them. GitHub Pages hosting for a public repository is free within GitHub's stated allowances.

## Data and privacy

- Saved data are held only in this site's browser `localStorage` under `bedfordshire-exercise-appetite-lab-v1`.
- These data are not sent to GitHub, the university, or an external service by application code.
- Using a different device/browser/private window or clearing site data can remove saved records. **Export JSON before leaving the session.**
- Do not enter names, student IDs, sensitive medical details or signed forms. Anonymous participant IDs are sufficient.
- Browser exports are not anonymised beyond what the student entered. Review files before sharing.
- JSON import validates core record fields; duplicate session IDs require confirmation before replacement.
- Group comparisons include **only locally saved/imported records**, not an entire teaching cohort.

## Teaching content maintenance

Edit the lesson wording and stages in `site/app.js`. Changes to the original exercise protocol should be approved by the lecturer first. Test changes using `node --test tests/core.test.cjs`, preview the application, then commit to `main`; GitHub Actions republishes automatically.

## Known limitations

- Timer is in memory, not a durable stopwatch: it follows wall-clock time while the page remains open but resets on page refresh, and cannot alert if the page is closed. Use a laboratory stopwatch as backup.
- The age field accepts 16–100 years to avoid spurious data entry. This is an **interface validation choice**, not an eligibility rule from the source. Confirm appropriateness for your participants.
- Data are not shared across browsers/devices automatically. Import/export supports deliberate transfer instead.
- RPE is recorded numerically without changing the original lack of a specified scale; if comparing across records, ensure the same scale was used throughout the class.