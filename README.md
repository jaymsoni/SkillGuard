## SkillGuard

[![CI](https://github.com/jaymsoni/SkillGuard/actions/workflows/ci.yml/badge.svg)](https://github.com/jaymsoni/SkillGuard/actions/workflows/ci.yml)

Repository: https://github.com/jaymsoni/SkillGuard

SkillGuard is an open‑source CLI that scans, scores, and pins Agent Skills (SKILL.md) for Claude Code, Cursor, and Codex before install.

- Deterministic, evidence-backed rules (no ML)
- Quality rubric v0 (structure only)
- `skill-lock.json` content-hash lockfile
- Safe install into target agent skill paths (dry-run to `.skillguard-out/` by default)

Apache-2.0 licensed.

## Install

Requires Node.js 22.12 or newer.

From source:

```bash
git clone https://github.com/jaymsoni/SkillGuard.git
cd SkillGuard
npm ci        # also builds dist/cli.cjs via the prepare script
npm link      # optional: puts `skillguard` on your PATH
```

## Usage

- Scan one skill or a directory of skills:

```bash
skillguard scan ./path/to/skill
skillguard scan ./path/to/skills --format json
```

Exit code is non-zero when critical findings are present.

- Write a lockfile (per-skill `skill-lock.json`):

```bash
skillguard lock ./path/to/skills
```

- Install a locked and verified skill (default installs to `./.skillguard-out/target-<name>/`):

```bash
skillguard install ./path/to/skill --target cursor
skillguard install ./path/to/skill --target claude --out-dir ./sandbox
```

Install refuses unless the scan policy passes (no critical findings) and the `skill-lock.json` content hash matches the current files. Real target directories (documented only):

- Cursor: `~/.cursor/skills/`
- Generic agents: `~/.agents/skills/`
- Claude (personal): `~/.claude/skills/`
- Claude (project): `.claude/skills/`

## What is a Skill?

A skill is a directory with `SKILL.md` (YAML frontmatter: required `name` + `description`; optional `license`, `compatibility`, `metadata`, `allowed-tools`) plus optional `scripts/`, `references/`, `assets/` per the [Agent Skills spec](https://agentskills.io/specification).

## Detectors (v0)

Deterministic pattern rules with file+line evidence:

- Prompt injection phrases (e.g. "ignore previous instructions", system-message impersonation)
- Obfuscation: base64 blobs that decode to shell, zero-width Unicode
- Remote execution: `curl|bash`, `wget|sh`, `eval $(echo ... | base64 -d)`
- Suspicious downloads: password-protected archives, curl to raw IP
- Hardcoded secrets: common API key patterns (sk-..., AKIA..., ghp_..., Slack, private keys). Placeholders like `YOUR_*`, `EXAMPLE`, `XXXX` are ignored.
- Missing/invalid `SKILL.md` frontmatter (name rules and description length)
- allowed-tools abuse (flags direct shell/exec tools conservatively)

## Quality Rubric (v0)

Simple structural score 0–100:

- Frontmatter valid (30)
- Description length reasonable (0/10/20)
- Body present (20)
- License present (5)
- Compatibility listed (5)
- Referenced files under `scripts/`, `references/`, `assets/` exist (up to 20)

## GitHub Action Example

`.github/workflows/ci.yml` runs build, tests, and scans this repo's fixtures (the clean fixture must pass; the intentionally malicious fixtures must fail). To add SkillGuard to your own repo:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '22'
- run: git clone --depth 1 https://github.com/jaymsoni/SkillGuard.git "$RUNNER_TEMP/skillguard"
- run: cd "$RUNNER_TEMP/skillguard" && npm ci
- run: node "$RUNNER_TEMP/skillguard/dist/cli.cjs" scan skills --format json
```

The job fails on critical findings.

## Threat Model & Positioning

SkillGuard is not a guarantee of safety. It enforces deterministic checks and a content hash. Think "npm audit" for Agent Skills: "scanned on date X" — not "safe forever". It differs from Snyk mcp-scan (PoS) by avoiding ML heuristics and focusing on transparent, reproducible rules plus a lockfile and install gate.

## Differences vs Snyk mcp-scan

- No ML; deterministic regex/rule-based detections
- No SaaS backend; runs locally
- Adds a `skill-lock.json` content hash to gate installs

## Local CI-equivalent

Run the project tests like CI:

```bash
npm ci
npm run build
npm test
node dist/cli.cjs scan tests/fixtures/skills/clean-skill --format json   # exits 0
npm run scan:ci   # scans all fixtures; exits 1 by design (malicious fixtures)
```

## FAQ

- How do I check if a Claude skill is safe?
  - Run: `skillguard scan /path/to/skill` (or a folder of skills). Exit code is non‑zero if critical findings are present. For JSON, append `--format json`.

- How do I pin/lock Agent Skills?
  - Run: `skillguard lock /path/to/skills`. This writes a per‑skill `skill-lock.json` with a content hash that must match at install time.

- Where do Claude skills live?
  - Personal: `~/.claude/skills/`. Project‑local: `.claude/skills/`.

- How do I install a locked, verified skill?
  - `skillguard install /path/to/skill --target claude` (or `cursor`, `agents`). By default, files are copied to `./.skillguard-out/target-<name>/`; use `--out-dir` to choose a directory. Installation is gated by a passing scan and matching lock hash.

- How does SkillGuard compare to Cisco skill-scanner / NVIDIA SkillSpector / Snyk agent-scan?
  - SkillGuard is a lightweight, deterministic scanner plus a lockfile and gated install. Those tools go deeper on dynamic/semantic detection. Use SkillGuard for fast, reproducible checks and provenance; use the others when you need deeper analysis.

## License

Apache-2.0
