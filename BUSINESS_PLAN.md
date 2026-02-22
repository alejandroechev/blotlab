# BlotLab — Business Plan

## Product Summary
Browser-based western blot densitometry tool replacing the 15-step ImageJ workflow with drag-and-drop quantification. Rolling ball background subtraction, lane/band detection, loading control normalization, and fold change calculation — all client-side, no install.

## Market Analysis

### Target Users
- Academic researchers (molecular biology, biochemistry, cell biology)
- Graduate students and postdocs performing routine western blots
- Core facilities and teaching labs
- Biotech/pharma QC labs needing documented densitometry

### Competitor Landscape
| Tool | Price | Strengths | Weaknesses |
|------|-------|-----------|------------|
| **ImageJ/FIJI** | Free | Powerful, extensible, gold standard | Terrible UX, 15-step workflow, Java dependency |
| **Image Studio** (LI-COR) | ~$2,000/yr | Polished, hardware-integrated | Expensive, vendor lock-in |
| **Bio-Rad Image Lab** | Bundled w/ hardware | Integrated with Bio-Rad imagers | Only works with Bio-Rad equipment |
| **ImageQuant TL** | ~$3,000/yr | GE/Cytiva ecosystem | Legacy software, expensive |

### Competitive Position
ImageJ is dominant and free — this is the central challenge. BlotLab must win on **workflow speed and ease of use**, not feature depth. The value proposition is saving 10+ minutes per blot analysis and eliminating the error-prone multi-step ImageJ process. Commercial tools are hardware-bundled; BlotLab is hardware-agnostic.

### Market Size
- ~500K active western blot researchers globally
- ~2M western blots performed per year in US alone
- Densitometry software TAM: ~$50M/yr (dominated by bundled solutions)

## Current State Assessment

### Maturity: Early MVP
- **Test Coverage**: 13 tests (0 unit + 13 E2E) — lowest in portfolio
- **Core Engine**: Rolling ball background, lane detection, band quantification, normalization
- **Known Issues**: Lane detection sensitivity problems, no unit tests, single image only

### Survey Scores
| Metric | Score |
|--------|-------|
| Professional Use Ready | 40% |
| Scales to Real Workloads | 35% |
| Useful Today (Free Tier) | 60% |
| Incremental Premium Value | 50% |
| Major Premium Value | 65% |

### Critical Gap
⚠️ **Detection algorithm validation is insufficient for commercial use.** Lane and band detection must be rigorously validated against ImageJ output and synthetic test images before any paid tier. Unit test coverage must go from 0 to 90%+ on the engine before Phase 2.

## Revenue Phases

### Phase 1: Free Tier (Current)
**Goal**: Build user base, validate detection algorithms, establish credibility vs ImageJ.

Features (shipping today):
- Upload blot image (PNG, JPEG)
- Auto-detect lanes with manual adjustment
- Band ROI drawing with rolling ball background subtraction
- Raw and normalized band intensities
- Fold change relative to control lane
- CSV export of results
- Bar chart visualization

**Monetization**: None. Free forever at this tier.

**Priority Work**:
1. Unit test suite for engine (0 → 90%+ coverage)
2. Lane detection algorithm improvements and validation
3. Cross-validation against ImageJ output on reference images
4. Band detection robustness testing

### Phase 2: Pro Tier — $79–149/yr
**Target**: Researchers who process 5+ blots/week and need reliable, documented results.

| Feature | Effort | Description |
|---------|--------|-------------|
| Improved lane/band detection | L | ML-assisted or adaptive thresholding for robust detection across exposure levels and blot quality. Must match ImageJ accuracy. |
| Molecular weight markers | M | Annotate MW ladder lane, auto-calculate apparent MW for detected bands via Rf calibration curve |
| Multi-image batch processing | L | Queue multiple blot images, apply same lane/band template, aggregate results across blots |
| PDF lab report | M | Formatted report with blot image, lane annotations, intensity table, bar chart, methods description — ready for lab notebook |
| TIFF/raw image support | M | 16-bit TIFF and raw imager formats (LI-COR, Bio-Rad) with proper dynamic range handling |

**Key Milestone**: Detection algorithms must pass validation suite (synthetic + real blots matched to ImageJ output within 5%) before launching paid tier.

**Estimated Timeline**: 6–9 months after validation milestone.

### Phase 3: Enterprise/Advanced Tier — $199–349/yr
**Target**: Core facilities, pharma QC labs, and researchers publishing quantitative westerns.

| Feature | Effort | Description |
|---------|--------|-------------|
| Quantitative western (standard curve) | L | Load purified protein standards, fit calibration curve, convert band intensity to absolute protein quantity (ng) |
| Chemiluminescence dynamic range correction | L | Detect and correct for signal saturation in chemiluminescent blots using multi-exposure HDR merging |
| Journal-format figure export | M | Publication-ready figure panels with proper scale bars, annotations, and formatting per journal guidelines (Nature, Cell, JBC) |
| LIMS integration | XL | API for integration with laboratory information management systems — sample tracking, audit trail, 21 CFR Part 11 compliance path |

**Estimated Timeline**: 12–18 months after Phase 2 launch.

## Pricing Rationale

| Tier | Price | Justification |
|------|-------|---------------|
| Free | $0 | Must compete with free ImageJ — free tier is table stakes |
| Pro | $79–149/yr | 10× cheaper than Image Studio ($2K), saves 2+ hrs/week for active users |
| Enterprise | $199–349/yr | Quantitative western + compliance features justify premium; still 85% cheaper than LI-COR |

**Conversion funnel**: Free → Pro conversion target 5–8% (lower than other tools due to ImageJ competition). Enterprise conversion from Pro: 10–15%.

## Risk Assessment

### High Risk
- **ImageJ dominance**: Free, well-known, deeply embedded in academic workflows. Must be dramatically easier, not just slightly better.
- **Detection accuracy**: If lane/band detection is less reliable than ImageJ, no one will trust results for publication. Validation is non-negotiable.
- **Zero unit tests**: Current test suite is entirely E2E — engine correctness is unverified at the algorithm level.

### Medium Risk
- **Image format complexity**: TIFF variants, 16-bit depth, proprietary imager formats add significant engineering effort.
- **Reviewer trust**: Journal reviewers may question results from unknown software. Need published validation study or ImageJ comparison data.

### Low Risk
- **Browser performance**: Canvas API + typed arrays handle typical blot images (1–5 MP) easily. Web Workers available for larger images.
- **No server dependency**: Client-side processing eliminates hosting costs and data privacy concerns.

## Go-to-Market Strategy

### Phase 1: Credibility
1. Publish validation comparison: BlotLab vs ImageJ on 50+ blot images
2. Target bioinformatics Twitter/Bluesky and PubPeer communities
3. Submit to Journal of Open Source Software (JOSS)
4. Post on protocols.io as alternative densitometry workflow

### Phase 2: Growth
1. University site licenses for teaching labs
2. Integration with electronic lab notebooks (Benchling, RSpace)
3. Protocol video tutorials (YouTube)
4. Conference demos at ASBMB, Experimental Biology

## Success Metrics

| Metric | Year 1 Target | Year 2 Target |
|--------|---------------|---------------|
| Monthly active users | 500 | 3,000 |
| Blots analyzed/month | 2,000 | 15,000 |
| Pro subscribers | — | 150 |
| Unit test coverage | 90%+ | 95%+ |
| Detection accuracy vs ImageJ | ±5% | ±2% |

## Bottom Line
BlotLab's biggest challenge is not technical — it's competing with free. ImageJ is ugly but functional, and researchers are habitual users. The path to revenue requires **(1)** rock-solid detection accuracy validated against ImageJ, **(2)** a workflow that's 5× faster than the ImageJ process, and **(3)** features ImageJ can't match (batch processing, PDF reports, MW markers). Unit test coverage must be the immediate priority before any commercial ambitions.
