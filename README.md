# New Movements website

Source code for [newmovements.com](https://newmovements.com), hosted on Cloudflare
Workers. The website renders the live catalog from ReAI. You only need access to
[this repository](https://github.com/beint-no/new-movements); the private operator
hub and ReAI backend source are not required.

## Start with your editor or coding assistant

Accept your GitHub repository invitation first, using the invited GitHub account.
Open the repository in your editor, or give your coding assistant this prompt:

> Use https://github.com/beint-no/new-movements. Clone it if it is not already
> available locally. Read README.md, AGENTS.md and sites/newmovements/AGENTS.md.
> Help me make this change: [describe the change]. Work in a separate branch and
> worktree, keep the existing design and English/Norwegian support, run npm run
> check, and open a pull request to main. Include screenshots for visual changes.
> Use the PR preview for review. Keep credentials out of Git and browser code.
> Leave the PR open for review; merging main publishes the website.

Describe the page, the desired result, and any reference screenshot. Keep each PR
focused on one change so it is easy to review or undo.

## Local setup

Install Git, Node.js 26 and npm 11.19 or newer. GitHub CLI (`gh`) is optional.
Authenticate Git with the GitHub account that has repository access.

```sh
git clone https://github.com/beint-no/new-movements.git
cd new-movements
git fetch origin
mkdir -p ~/.r-worktrees
git worktree add -b update-homepage ~/.r-worktrees/wt-new-movements-homepage origin/main
cd ~/.r-worktrees/wt-new-movements-homepage
npm ci
cp sites/newmovements/.dev.vars.example sites/newmovements/.dev.vars
```

Ask Greg for a read-only New Movements PREVIEW Site credential through a private
channel. Replace the placeholder `REAI_SITE_TOKEN` value in
`sites/newmovements/.dev.vars` with that credential. This file is ignored by Git;
never paste a credential into a PR, commit or browser script. The example value
does not authenticate. Local development does not require a Cloudflare deployment
token or Cloudflare login.

```sh
npm run dev
```

Open the local URL printed by Wrangler. A preview credential can read the catalog
but cannot create orders or submit payments. Use a new branch/worktree name for
each task; run `npm ci` and configure the ignored local credential in each new
worktree. Stop the local server with Ctrl+C when finished.

## Where to make changes

| Change | Location |
| --- | --- |
| Page markup, navigation and rendering | `sites/newmovements/storefront.mjs` |
| Editorial pages and journal content | `sites/newmovements/content.mjs` |
| English and Norwegian interface text | `sites/newmovements/locales.mjs` |
| Website styling | `sites/newmovements/public/assets/store.css` |
| Browser interactions | `sites/newmovements/public/assets/store.js` |
| Brand/editorial images | `sites/newmovements/public/brand-assets/` |
| Products, variants, prices, stock, product photos and collections | ReAI |

Read the relevant `AGENTS.md` before changing a folder. Keep brand work under
`sites/newmovements/`. Shared `packages/` contain the API and commerce integration;
change those only when the task requires it. Generated `dist/` files are not edited
or committed. Product data is managed in ReAI, not duplicated in website code.

## Review and publish

1. Make the change on your task branch. Check English and Norwegian (`/nb`), mobile
   and desktop; include screenshots for visual changes.
2. Run `npm run check` and fix any failures.
3. Commit, push your branch and open a PR into `main`:

   ```sh
   git add <the-files-you-changed>
   git commit -m "Describe the website change"
   git push -u origin update-homepage
   gh pr create --base main --fill
   ```

   Without `gh`, use GitHub's **Compare & pull request** button after pushing.
4. The **PR previews** workflow builds and checks same-repository PRs automatically.
   The PR gets a comment and deployment link with an isolated preview. New pushes
   update it. Confirm the preview's recorded commit matches your latest push.
   Preview checkout and other writes are disabled. Fork PRs do not get automatic
   previews. Closing or merging a PR removes its preview.
5. Review the preview together and wait for successful checks. **Squash and merge**
   into `main` when approved. **Deploy website** checks and publishes the merged
   revision automatically to [newmovements.com](https://newmovements.com). Wait for
   that workflow to succeed, then check the live page. A merge alone does not prove
   deployment succeeded. A draft PR also receives a preview, but does not publish
   production.

There is no shared `dev` branch: each PR has its own preview. Do not push directly
to `main` or run a production deploy from an unreviewed feature branch.

## If automation is unavailable

Private GitHub Actions runs depend on the organization's shared Actions quota.
On 29 October 2026 it was exhausted, so configured automatic workflows could not
run. Check the latest Actions result rather than assuming this remains the case.
Ask Greg if a check reports a spending-limit or quota error; do not merge expecting
an automatic release while deployment is blocked.

Authorized operators can still run `npm run preview:deploy -- review` with a
read-only PREVIEW credential and Cloudflare access, then remove it with
`npm run preview:remove -- review`. To release manually, deploy the reviewed,
merged `main` revision with `npm ci` and `npm run deploy` after authenticating
Cloudflare. The deploy command runs the checks and selects the New Movements
account. Normal deployment retains the existing production Site secret; do not
run `npm run secret` for routine releases.

Production Actions uses the `production` GitHub environment, restricted to `main`.
Its encrypted Cloudflare token is scoped to the New Movements account and domain.
Build/check jobs receive no production deployment credentials. PR preview
publishing uses the existing central controller and read-only Site credentials.

To undo a release, revert its merged PR on GitHub, review the revert, and merge
it to `main`. This triggers the same checked deployment process.
