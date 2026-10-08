# Launching skilldoorman v0: Deterministic Scans for Agent Skills

AI agent ecosystems are exploding — and so are the risks. Snyk's recent report on ToxicSkills found that ~36.8% of 3,984 skills had issues, 13.4% were critical, and 76 were confirmed malicious ([source](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/)). We need simple, transparent guardrails.

Introducing skilldoorman: an open-source CLI that scans Agent Skills (agentskills.io) using deterministic, evidence-backed rules. It scores skills, writes a content-hash lockfile, and only installs verified skills.

## What skilldoorman Does

- Scans a skill or directory of skills and reports file+line evidence
- Detects prompt-injection phrases, remote execution (`curl|bash`), base64 obfuscation, suspicious downloads, and hardcoded secrets
- Validates frontmatter per spec and applies a simple structural quality score (0–100)
- Writes `skill-lock.json` (sha256 over relevant files) with a score snapshot and scanner version
- Installs only when policy passes (no critical findings) and the lock hash matches

## Try It

```bash
npm ci
npm run build
node dist/cli.cjs scan tests/fixtures/skills --format json
node dist/cli.cjs lock tests/fixtures/skills/clean-skill
node dist/cli.cjs install tests/fixtures/skills/clean-skill --out-dir ./.skilldoorman-out
```

## What’s Not in v0

- Hosted registry or marketplace
- SSO or organizational policy management
- ML heuristics (by design) — we prioritize reproducibility and transparent evidence

If you want a deeper agent code scan with learning-based signals, check out Snyk's mcp-scan. Use skilldoorman alongside it to enforce deterministic gates and locked installs.

Apache-2.0. Contributions welcome.
