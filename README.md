# Daniel Cole Personal Site

Static v0 rebuild of `danielcole.design`, designed for GitHub Pages.

## File Structure

```text
/
├── index.html
├── styles.css
├── script.js
├── generative-field.js
├── CNAME
├── README.md
└── assets/
    ├── right-column-chunky-pixels.jpg
    ├── right-column-chunky-pixels.png
    ├── right-column-pixel-painting.jpg
    └── right-column-pixel-painting.png
```

The right column currently renders from `generative-field.js`. The image files
in `assets/` are retained as previous placeholder explorations.

## Live Links

The site currently links to:

- Resume: `https://drive.google.com/file/d/17N7e9mnLSyoye_IyOFVtPxUvAcp3EFg_/view?usp=sharing`
- Work sample: `https://drive.google.com/file/d/1Ql3j-zaH3bPBP2WYCVeoxsH0862dE7I4/view?usp=drive_link`
- Writing: `https://medium.com/macmillan-design/how-to-use-archetypes-in-design-a7a0d52e695a`
- Email: `coledan@gmail.com`
- LinkedIn: `https://www.linkedin.com/in/danielraycole/`
- Medium: `https://medium.com/@danielraycole`
- Are.na: `https://www.are.na/daniel-cole`

## Type Experiments

The current typography is the `stronger` preset on the root HTML element:

```html
<html lang="en" data-type="stronger">
```

To try a different preset, change `data-type` in `index.html` to one of:

- `default`
- `upright-headline`
- `quiet`
- `stronger`

To roll back, change it back to `default`. The preset values live near the top
of `styles.css` under `Type experiments`.

## Generative Field

The right column is a decorative canvas rendered by `generative-field.js`. On
load, it chooses one primitive from the configured shape options and gives that
single object a full 3D rotation. Tunable values live in the `config` object
near the top of that file, including:

- `cellSize`
- `objectScale`
- `selectedShape`
- `shapeOptions`
- `rotationSpeedX`
- `rotationSpeedY`
- `rotationSpeedZ`
- `tiltX`
- `tiltY`
- `tiltZ`
- `bayerSize`
- `baseInkDensity`
- `shadowInkDensity`
- `rimInkDensity`
- `toneThresholds`
- `toneCoverages`
- `backgroundColor`
- `inkColor`

## GitHub Pages Setup

1. Create a GitHub repository for the site, for example `personalsite`.
2. Commit and push these files to the repository's default branch.
3. In GitHub, open **Settings > Pages**.
4. Set **Build and deployment** to deploy from the default branch root.
5. Confirm the site works first at the default GitHub Pages URL:
   `https://YOUR-USERNAME.github.io/personalsite/`
6. In **Settings > Pages > Custom domain**, enter `danielcole.design`.
7. Keep **Enforce HTTPS** enabled once GitHub allows it.

## DNS Records

For an apex domain such as `danielcole.design`, GitHub Pages recommends four
`A` records pointing at GitHub Pages:

```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

If you also want `www.danielcole.design`, add a `CNAME` record:

```text
www -> YOUR-USERNAME.github.io
```

GitHub Pages can then redirect the `www` hostname to the apex domain if
`danielcole.design` remains the custom domain in Pages settings.

## Recommended Migration Order

1. Build and test the site locally.
2. Push to GitHub and test on the default `*.github.io` URL.
3. Configure the custom domain in GitHub Pages.
4. Add or update DNS records at the domain registrar.
5. Wait for GitHub Pages to verify the domain and issue the HTTPS certificate.
6. Enable **Enforce HTTPS**.
7. Keep the current Persona site live until the DNS switch has propagated.
