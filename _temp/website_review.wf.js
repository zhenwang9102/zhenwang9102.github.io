export const meta = {
  name: 'website-review',
  description: 'Read-only review of Zhen Wang personal academic site across pages and dimensions; propose practical (not fancy) improvements',
  phases: [
    { title: 'Review' },
    { title: 'Verify' },
  ],
}

const ROOT = '/Users/user/Zhen/zhenwang9102.github.io'
const PAGES = [
  ROOT + '/_layouts/default.html  (main landing page: header/bio, news, research overview, selected honors, contact links)',
  ROOT + '/page_pubs.html  (publications, By-Year + By-Topic views; ~1330 lines)',
  ROOT + '/page_research.html  (research overview narrative)',
  ROOT + '/page_posts.html  (blog index)',
  ROOT + '/page_honors_and_services.html  (honors, awards, reviewing/service)',
  ROOT + '/mpt.html  (legacy project page, old HTML4 + http jsapi + fixed 1100px width)',
  ROOT + '/_config.yml  (Jekyll config — stale Jekyll-Now template with another author github/email/url)',
]

const CONTEXT = [
  'This is the personal academic website of Zhen Wang, an AI/ML researcher (LLM reasoning, AI co-scientists, scientific foundation models) on the early-career/academic job-market track. Hosted on GitHub Pages with Jekyll. Files to review:',
  PAGES.map(p => '- ' + p).join('\n'),
  '',
  'Shared visual system: DM Sans (body) + Newsreader (headings), a UCSD navy/blue/yellow palette, CSS custom properties in :root, card-based news/paper components. Each HTML page currently carries its OWN inline <style> block (no shared stylesheet).',
  '',
  'CONSTRAINTS on your suggestions:',
  '- The user wants DECENT, PRACTICAL improvement directions, NOT fancy ones. Avoid: animations, dark-mode, redesigns, JS frameworks, trendy effects. Favor: correctness, consistency, accessibility, maintainability, content clarity — things a serious academic visitor or hiring committee notices.',
  '- READ-ONLY review. Do NOT edit any file. Only read and report.',
  '- Be concrete: cite specific file + line numbers (use Read to get them) and quote the offending snippet briefly.',
  '- Each finding needs a clear, low-risk suggested direction and an honest effort estimate.',
  '- Flag anything that is actually a non-issue or cosmetic-fancy as is_fancy:true.',
].join('\n')

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    dimension: { type: 'string' },
    summary: { type: 'string', description: '2-3 sentence overall read on this dimension' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          pages: { type: 'array', items: { type: 'string' } },
          evidence: { type: 'string', description: 'specific file:line + brief quoted snippet' },
          why_it_matters: { type: 'string' },
          suggested_direction: { type: 'string' },
          effort: { type: 'string', enum: ['low', 'medium', 'high'] },
          is_fancy: { type: 'boolean' },
        },
        required: ['title', 'severity', 'pages', 'evidence', 'why_it_matters', 'suggested_direction', 'effort', 'is_fancy'],
      },
    },
  },
  required: ['dimension', 'summary', 'findings'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    verdict: { type: 'string', enum: ['confirmed', 'overstated', 'wrong', 'actually_fancy'] },
    corrected_severity: { type: 'string', enum: ['high', 'medium', 'low'] },
    note: { type: 'string', description: 'what you actually found on re-read; corrected evidence if needed' },
  },
  required: ['title', 'verdict', 'corrected_severity', 'note'],
}

const DIMENSIONS = [
  { key: 'consistency', prompt: 'Review dimension: CONTENT ACCURACY & CROSS-PAGE CONSISTENCY. Read all pages. Look for: inconsistent venue/year formatting, author-name styling drift, a paper or honor appearing differently across pages (status, title, IF), stale "job market 2025-2026"-type text, the same fact stated two ways, duplicated/contradictory bio text, typos, inconsistent news date formats. Also check _config.yml: it still contains the original template author name/email/github/url (leonidk / lkeselman). Report what is wrong and where.' },
  { key: 'accessibility', prompt: 'Review dimension: ACCESSIBILITY. Read all pages. Look for: <img> without alt (profile photo, paper thumbnails in page_pubs.html), insufficient color contrast (light-gray text like #718096, yellow on white), links relying on color alone, missing lang attributes, non-semantic heading order, tap-target sizes, removed focus styles, and legacy mpt.html. Quantify where you can (e.g. "N of M images lack alt"). Give WCAG-aligned but practical fixes.' },
  { key: 'seo_meta', prompt: 'Review dimension: SEO, METADATA & SOCIAL SHARING. Read the <head> of each HTML page and _config.yml. Look for: missing/duplicated <title>, missing meta description, no Open Graph / Twitter Card tags (links shared on X/LinkedIn show no preview — the user posts research news), no favicon, no canonical URL, _config.yml url = "https://leonidk.com" (breaks jekyll-sitemap), no structured data (optional). Prioritize the few that actually matter for an academic.' },
  { key: 'responsive', prompt: 'Review dimension: MOBILE / RESPONSIVE. Read the <style> blocks and markup of each page. Look for: media-query coverage (do paper cards, header-top flex, honors year column, nav wrap, news grid collapse on phones?), fixed pixel widths (mpt.html is width:1100px — broken on mobile), horizontal-scroll risks, fonts too small, tap targets. Say which pages are solid and which break; cite the breakpoints that exist.' },
  { key: 'links', prompt: 'Review dimension: LINK HEALTH & CORRECTNESS. Read all pages, extract notable links. Flag: insecure http:// links (mpt.html loads http://www.google.com/jsapi and google.load jquery 1.3.2 — both dead), links to # or empty href, mismatched anchor text vs target, internal nav links that may 404, mixed arxiv /abs vs /pdf, placeholder links. No network access — judge by inspection and mark uncertainty. List highest-risk ones.' },
  { key: 'ia_content', prompt: 'Review dimension: INFORMATION ARCHITECTURE & CONTENT GAPS (from a hiring committee / collaborator / fellow researcher perspective). Read all pages. Assess: clear one-line "who I am + what I work on" above the fold? CV/resume PDF link present? "Selected Honors" vs full honors page coherent? Does the news feed bury the bio? Research narrative skimmable? Publications page navigable (By-Year/By-Topic toggle discoverable)? Contact/email obvious? Note legacy mpt.html reachability. Suggest practical IA improvements, not a redesign.' },
  { key: 'maintainability', prompt: 'Review dimension: CODE HYGIENE & MAINTAINABILITY. Read all HTML files. Big one: each page carries its own large duplicated inline <style> block, so a color/font change must be made in 5 places (the exact pain of manual cross-page edits). Look for: duplicated CSS, copy-pasted nav markup, inconsistent class names across pages, dead/legacy code (mpt.html; _layouts/post.html is 2 lines), stale _config.yml footer-links. Suggest a low-risk consolidation path (shared assets/style.css + a Jekyll include for nav/head) without a framework.' },
  { key: 'polish', prompt: 'Review dimension: TYPOGRAPHY & VISUAL POLISH (restrained, NOT fancy). Read the style blocks. Suggest only small tasteful refinements an academic site benefits from: vertical rhythm, line-length/measure on long text, heading scale, spacing between paper cards, the news-container max-height/scroll choice, link affordance. Explicitly mark anything that veers fancy (animations, gradients, hover transforms) as is_fancy:true and recommend AGAINST it. Keep this short and high-signal.' },
]

phase('Review')
log('Reviewing ' + DIMENSIONS.length + ' dimensions across ' + PAGES.length + ' files (read-only)')

async function verifyFinding(f, dimKey) {
  const prompt = [
    CONTEXT,
    '',
    'ADVERSARIALLY VERIFY this single review finding by re-reading the cited file(s). Confirm: (1) the issue is REAL and the evidence/line cite is accurate (quote what you actually find), (2) severity is fair, (3) it is genuinely a practical/decent improvement and NOT a fancy nice-to-have. If wrong, overstated, or actually fancy, say so and downgrade.',
    '',
    'FINDING:',
    'Title: ' + f.title,
    'Severity: ' + f.severity,
    'Pages: ' + (f.pages || []).join(', '),
    'Evidence: ' + f.evidence,
    'Why: ' + f.why_it_matters,
    'Suggested: ' + f.suggested_direction,
  ].join('\n')
  return agent(prompt, {
    label: 'verify:' + dimKey + ':' + (f.title || '').slice(0, 22),
    phase: 'Verify',
    agentType: 'Explore',
    schema: VERDICT_SCHEMA,
  })
}

const results = await pipeline(
  DIMENSIONS,
  d => agent(CONTEXT + '\n\n' + d.prompt, {
    label: 'review:' + d.key,
    phase: 'Review',
    agentType: 'Explore',
    schema: FINDINGS_SCHEMA,
  }),
  (review, dim) => {
    if (!review) return null
    const toCheck = review.findings.filter(f => (f.severity === 'high' || f.severity === 'medium') && !f.is_fancy)
    if (!toCheck.length) return Object.assign({}, review, { verified: [] })
    return parallel(toCheck.map(f => () => verifyFinding(f, dim.key)))
      .then(verdicts => Object.assign({}, review, { verified: verdicts.filter(Boolean) }))
  }
)

return { dimensions: results.filter(Boolean) }
