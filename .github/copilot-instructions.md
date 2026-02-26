---
applyTo: "**"
---
# BlotLab — Western Blot Densitometry

## Domain
- Image-based quantification of protein expression from western blot gel images
- Rolling ball background subtraction (morphological erosion + dilation with spherical structuring element)
- Lane detection via vertical intensity projection and peak/valley finding
- Band ROI detection via horizontal intensity profiling within each lane
- Integrated intensity (sum of pixel values within ROI) as densitometry signal
- Normalization to loading control band (GAPDH, β-actin, tubulin)
- Fold change relative to control lane

## Key Algorithms
- Rolling ball: `corrected = original - background` where background is computed by rolling a sphere under the intensity surface
- Integrated intensity: `I = Σ(pixel values within ROI)`
- Normalization: `normalized = target_intensity / loading_control_intensity`
- Fold change: `fold = normalized_sample / normalized_control`

## Validation Sources
- Synthetic test images with known pixel values (exact match expected)
- ImageJ rolling ball output on same images (cross-validation)
- scikit-image rolling_ball Python implementation as reference

## Tech Notes
- Image processing runs entirely client-side (Canvas API + typed arrays)
- Use Web Workers for large images to avoid blocking UI
- No server needed for MVP



# Code Implementation Flow

<important>Mandatory Development Loop (non-negotiable)</important>

## Git Workflow
- **Work directly on master** — solo developer, no branch overhead
- **Commit after every completed unit of work** — never leave working code uncommitted
- **Push after each work session** — remote backup is non-negotiable
- **Tag milestones**: `git tag v0.1.0-mvp` when deploying or reaching a checkpoint
- **Branch only for risky experiments** you might discard — delete after merge or abandon

## Preparation & Definitions
- Use Typescript as default language, unless told otherwise
- Work using TDD with red/green flow ALWAYS
- If its a webapp: Add always Playwright E2E tests
- Separate domain logic from CLI/UI/WebAPI, unless told otherwise
- Every UI/WebAPI feature should have parity with a CLI way of testing that feature

## Validation
After completing any feature:
- Run all new unit tests, validate coverage is over 90%
- Use cli to test new feature
- If its a UI impacting feature: run all e2e tests
- If its a UI impacting feature: do a visual validation using Playwright MCP, take screenshots as you tests and review the screenshots to verify visually all e2e flows and the new feature. <important>If Playwright MCP is not available stop and let the user know</important>

If any of the validations step fail, fix the underlying issue.

## Finishing
- Update documentation for the project based on changes
- <important>Always commit after you finish your work with a message that explain both what is done, the context and a trail of the though process you made </important>


# Deployment

- git push master branch will trigger CI/CD in Github
- CI/CD in Github will run tests, if they pass it will be deployed to Vercel https://blotlab.vercel.app/
- Umami analytics and Feedback form with Supabase database