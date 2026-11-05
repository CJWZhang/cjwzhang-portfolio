# Portfolio deployment

This is a static HTML/CSS/JavaScript website. The dist/ folder contains all public assets.
Do not upload the source-photo folder, QA screenshots, or resume reference render.

## GitHub and Vercel

1. Push this isolated repository to your GitHub account.
2. Import the repository at https://vercel.com/new.
3. Use the repository root, framework preset **Other**, no install or build
   command, and output directory **dist**. The vercel.json file records these settings.
4. Deploy, then test the production URL in a signed-out browser. Visitors should
   not be prompted to log in. Check the production deployment protection settings
   if they are.
5. Add a custom domain under Vercel Project Settings → Domains when ready.
   A purchased domain is not required for the first deployment.

The local preview remains available with npm run dev.
Run node check-static.mjs --offline before pushing updates.

Official references:
- https://vercel.com/docs/git/vercel-for-github
- https://vercel.com/docs/builds/configure-a-build
