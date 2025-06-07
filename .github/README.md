# GitHub Actions Configuration

This directory contains the CI/CD configuration for the CoachCompanion project using GitHub Actions.

## 🔧 Workflows Overview

### 1. **CI Workflow** (`ci.yml`)
**Triggers:** Push to `main`, Pull Requests to `main`

**What it does:**
- Runs tests on Node.js 18.x and 20.x
- Performs TypeScript type checking
- Runs unit tests with coverage reporting
- Builds the application
- Uploads coverage reports to Codecov
- Creates build artifacts

### 2. **PR Checks** (`pr-checks.yml`)
**Triggers:** PR opened, updated, reopened

**What it does:**
- Quality gate validation
- Lint checking (if configured)
- TypeScript compilation verification
- Unit test execution
- Test coverage threshold checking
- Build verification
- Security audit scanning
- Automated PR comments with results

### 3. **Deploy** (`deploy.yml`)
**Triggers:** Push to `main`, Manual dispatch

**What it does:**
- Runs final test suite
- Builds production bundle
- Deploys to production (placeholder for your deployment method)
- Creates deployment notifications
- Handles deployment failure notifications

### 4. **Branch Protection Setup** (`setup-branch-protection.yml`)
**Triggers:** Manual dispatch only

**What it does:**
- Configures branch protection rules automatically
- Sets up required status checks
- Enforces pull request reviews
- Applies restrictions to administrators

## 🛡️ Branch Protection

### Manual Setup
1. Go to **Settings** > **Branches** in your GitHub repository
2. Add protection rule for `main` branch
3. Enable the following:
   - Require pull request reviews (1 approval)
   - Require status checks to pass
   - Require branches to be up to date
   - Include administrators

### Automated Setup
Run the "Setup Branch Protection" workflow manually from the Actions tab.

### Required Status Checks
- `CI / test (18.x)` - Node.js 18 tests
- `CI / test (20.x)` - Node.js 20 tests  
- `CI / build` - Build verification
- `PR Checks / quality-gate` - Quality gates
- `PR Checks / security-scan` - Security scanning

## 📦 Dependabot Configuration

**File:** `dependabot.yml`

**Features:**
- Weekly dependency updates (Mondays at 9 AM EST)
- Groups patch updates together
- Limits open PRs to prevent spam
- Ignores major version updates for critical packages
- Automatically updates GitHub Actions

## 📝 Pull Request Template

**File:** `PULL_REQUEST_TEMPLATE.md`

**Includes:**
- Change type selection
- Testing checklist
- Breaking changes documentation
- Reviewer guidelines
- Quality gate requirements

## 🚀 Getting Started

### 1. Initial Setup
After adding these files to your repository:

```bash
# Commit and push the GitHub Actions configuration
git add .github/
git commit -m "Add GitHub Actions CI/CD configuration"
git push origin main
```

### 2. Configure Branch Protection
**Option A - Manual:**
Follow the instructions in `branch-protection-settings.md`

**Option B - Automated:**
1. Go to Actions tab in GitHub
2. Find "Setup Branch Protection" workflow
3. Click "Run workflow"
4. Enter "main" as target branch
5. Run the workflow

### 3. Test the Setup
1. Create a new branch: `git checkout -b test-ci`
2. Make a small change and push
3. Open a pull request
4. Verify all checks run and pass
5. Confirm merge is blocked until approved

## 📊 Coverage Reporting

To enable Codecov integration:
1. Sign up at [codecov.io](https://codecov.io)
2. Add your repository
3. Get the upload token
4. Add `CODECOV_TOKEN` to your repository secrets

## 🔒 Security Features

### Automated Security Scanning
- `npm audit` runs on every PR
- Dependency vulnerability checking
- Security-focused status checks

### Secret Management
Store sensitive data in GitHub repository secrets:
- `CODECOV_TOKEN` - For coverage reporting
- Add deployment keys/tokens as needed

## 🎯 Benefits

With this setup, you get:

- ✅ **Automated Testing** - All tests run automatically
- 🛡️ **Quality Gates** - Code quality enforced before merge
- 🔒 **Security Scanning** - Vulnerability detection
- 📊 **Coverage Tracking** - Test coverage monitoring
- 🚀 **Automated Deployment** - Streamlined releases
- 📝 **Standardized PRs** - Consistent PR format
- 🔄 **Dependency Updates** - Automated maintenance

## 🏥 Troubleshooting

### Common Issues

**Tests fail in CI but pass locally:**
- Check Node.js version differences
- Verify environment variables
- Check for platform-specific issues

**Branch protection not working:**
- Ensure you're a repository admin
- Check status check names match exactly
- Verify workflows have run at least once

**Dependabot PRs failing:**
- Review dependency compatibility
- Check for breaking changes in updates
- Ensure test coverage for updated packages

### Getting Help

- Check the Actions tab for detailed logs
- Review failed step outputs
- Ensure all required secrets are configured
- Verify branch protection settings match workflow names

## 📈 Monitoring

Monitor your CI/CD health:
- Check Actions tab regularly for failed workflows
- Review Dependabot PRs promptly
- Monitor coverage trends over time
- Keep an eye on build times and optimize as needed