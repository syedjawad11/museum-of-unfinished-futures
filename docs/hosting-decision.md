# Hosting decision — Museum of Unfinished Futures

Date: September 21, 2026
Status: Netlify Free approved by the founder on September 21, 2026; account authentication and deployment remain pending.

## Recommendation

Use Netlify Free for the contest release. The founder approved this choice on September 21, 2026.

Why:

- Netlify states that its Free plan may host commercial projects.[3]
- The Free plan costs $0, includes 300 credits per month, and has a hard monthly limit that cannot incur charges.[1]
- Netlify documents full support for the Next.js App Router, SSR, route handlers, Server Actions, redirects, rewrites, middleware, image optimization, and revalidation through its OpenNext adapter.[2]
- A local production-mode Netlify build of the actual repository completed successfully on September 21, 2026 using Netlify CLI 27.8.0, Netlify Build 37.0.0, and Next.js Runtime 5.16.0. It compiled Next.js 16.3.5 and packaged the server handler without changing the project repository.

## Cost and usage guard

Netlify Free supplies 300 credits per billing cycle. Netlify currently charges 15 credits for each production deploy and 10 credits per GB of bandwidth; web requests and compute also consume credits.[4] The account should remain on the Free plan so the hard limit prevents overage charges.[1]

For the contest period:

- Keep production deploys deliberate; use local builds and tests before deployment.
- Avoid automated or repeated production deploys.
- Check remaining credits before release and before the final submission update.
- Treat a paused site caused by exhausted credits as a release blocker.

## Alternatives assessed

### Vercel Hobby — rejected for this project

Vercel states that Hobby is restricted to non-commercial personal use. This project belongs to a product-first studio and is being entered in a prize competition, so using Hobby would create an avoidable terms risk.[5] A paid Vercel plan would require explicit spending approval.

### Cloudflare Workers Free — viable fallback, not first choice

Cloudflare Workers Free provides 100,000 requests per day.[7] However, Cloudflare's current Next.js guidance uses the `vinext` adapter, which Cloudflare labels beta and says may not support every Next.js feature.[6] Moving the release candidate to that adapter adds migration and regression risk close to submission, while the actual Netlify build already passes.

## Local compatibility evidence

Command executed in an isolated scratch copy:

`npx --yes netlify-cli@27.8.0 build --offline`

Result:

- Next.js production compilation passed.
- TypeScript passed.
- Dynamic routes `/`, `/exhibits/[slug]`, and `/studio/[[...tool]]` were recognized.
- Netlify packaged `___netlify-server-handler` successfully.
- Total Netlify build time: approximately 2 minutes 8 seconds.
- The tracked repository remained clean at commit `b511b75`.

This verifies build compatibility, not account access, live deployment, DNS, runtime behavior, or logged-out public availability. Those checks belong to the authorized deployment gate.

## Approval record

The founder approved Netlify Free and authorized deployment planning on September 21, 2026. This does not yet authorize account upgrades, paid resources, site creation, draft deployment, production deployment, or public release. See `docs/deployment-plan.md` for the remaining gates.

No account, site, paid resource, or deployment was created during this evaluation.

## Sources

[1] https://www.netlify.com/pricing — Netlify pricing and plans
[2] https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview — Next.js on Netlify
[3] https://www.netlify.com/blog/introducing-netlify-free-plan — Introducing Netlify Free
[4] https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work — How Netlify credits work
[5] https://vercel.com/docs/plans/hobby — Vercel Hobby Plan
[6] https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs — Next.js on Cloudflare Workers
[7] https://developers.cloudflare.com/workers/platform/pricing — Cloudflare Workers pricing
