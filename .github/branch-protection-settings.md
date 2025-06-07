# Branch Protection Settings

To enable automated PR checks and prevent direct pushes to main, configure these branch protection rules in your GitHub repository:

## How to Configure

1. Go to your GitHub repository: `https://github.com/omok/CoachCompanion`
2. Navigate to **Settings** > **Branches**
3. Click **Add rule** for the `main` branch
4. Configure the following settings:

## Recommended Branch Protection Rules

### Basic Protection
- ✅ **Restrict pushes that create files larger than 100MB**
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: **1**
  - ✅ Dismiss stale PR approvals when new commits are pushed
  - ✅ Require review from code owners (if CODEOWNERS file exists)

### Status Checks
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**

**Required Status Checks:**
- `CI / test (18.x)`
- `CI / test (20.x)` 
- `CI / build`
- `PR Checks / quality-gate`
- `PR Checks / security-scan`

### Additional Restrictions
- ✅ **Require conversation resolution before merging**
- ✅ **Include administrators** (applies rules to repo admins too)
- ✅ **Allow force pushes: Everyone** (set to disabled)
- ✅ **Allow deletions** (set to disabled)

## GitHub CLI Configuration (Alternative)

If you have GitHub CLI installed, you can configure branch protection with:

```bash
gh api repos/omok/CoachCompanion/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["CI / test (18.x)","CI / test (20.x)","CI / build","PR Checks / quality-gate","PR Checks / security-scan"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null
```

## Benefits

Once configured, this will:
- 🚫 Prevent direct pushes to `main` branch
- ✅ Require all tests to pass before merging
- 🔍 Require at least 1 code review approval
- 🛡️ Run security scans on all PRs
- 📊 Ensure type checking and build success
- 🧪 Validate test coverage requirements

## Verification

After setting up, test the protection by:
1. Creating a new branch with failing tests
2. Opening a PR - it should show failed checks
3. Attempting to merge - should be blocked until checks pass