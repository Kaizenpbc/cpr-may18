# Git Workflow Guide

## Overview

This document outlines the Git workflow and best practices for the CPR Training Management System development team.

## Repository Structure

```
cpr-may18/
├── .git/                     # Git repository data
├── .github/                  # GitHub workflows and templates
├── frontend/                 # React frontend application
├── backend/                  # Node.js backend API
├── docs/                     # Project documentation
├── scripts/                  # Build and deployment scripts
├── .gitignore               # Git ignore rules
├── .gitattributes           # Git attributes configuration
├── README.md                # Main project documentation
└── package.json             # Root package configuration
```

## Branching Strategy

We follow a **Git Flow** branching model with the following branches:

### Main Branches

#### `main`
- **Purpose**: Production-ready code
- **Protection**: Protected branch, requires PR reviews
- **Deployment**: Automatically deploys to production
- **Merge**: Only from `develop` via release PRs

#### `develop`
- **Purpose**: Integration branch for features
- **Protection**: Protected branch, requires PR reviews
- **Deployment**: Automatically deploys to staging
- **Merge**: From feature branches and hotfixes

### Supporting Branches

#### Feature Branches (`feature/`)
- **Naming**: `feature/JIRA-123-short-description`
- **Purpose**: New features and enhancements
- **Base**: Created from `develop`
- **Merge**: Into `develop` via Pull Request
- **Lifetime**: Deleted after merge

#### Hotfix Branches (`hotfix/`)
- **Naming**: `hotfix/JIRA-456-critical-bug-fix`
- **Purpose**: Critical production fixes
- **Base**: Created from `main`
- **Merge**: Into both `main` and `develop`
- **Lifetime**: Deleted after merge

#### Release Branches (`release/`)
- **Naming**: `release/v1.2.0`
- **Purpose**: Prepare releases, final testing
- **Base**: Created from `develop`
- **Merge**: Into `main` and `develop`
- **Lifetime**: Deleted after merge

#### Bugfix Branches (`bugfix/`)
- **Naming**: `bugfix/JIRA-789-fix-login-issue`
- **Purpose**: Non-critical bug fixes
- **Base**: Created from `develop`
- **Merge**: Into `develop` via Pull Request
- **Lifetime**: Deleted after merge

## Workflow Examples

### 1. Feature Development

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/CPR-123-analytics-dashboard

# Work on feature
git add .
git commit -m "feat(analytics): add course request analytics dashboard

- Implement analytics API endpoints
- Add interactive charts with Recharts
- Include time-based filtering (3,6,12,24 months)
- Add summary statistics cards

Closes CPR-123"

# Push feature branch
git push origin feature/CPR-123-analytics-dashboard

# Create Pull Request to develop
# After review and approval, merge via GitHub
```

### 2. Hotfix Process

```bash
# Start from main
git checkout main
git pull origin main

# Create hotfix branch
git checkout -b hotfix/CPR-456-auth-token-expiry

# Fix the issue
git add .
git commit -m "fix(auth): resolve token expiry issue

- Fix JWT token refresh logic
- Add proper error handling for expired tokens
- Update token validation middleware

Fixes CPR-456"

# Push hotfix
git push origin hotfix/CPR-456-auth-token-expiry

# Create PR to main
# After merge to main, also merge to develop
git checkout develop
git pull origin develop
git merge hotfix/CPR-456-auth-token-expiry
git push origin develop

# Delete hotfix branch
git branch -d hotfix/CPR-456-auth-token-expiry
git push origin --delete hotfix/CPR-456-auth-token-expiry
```

### 3. Release Process

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create release branch
git checkout -b release/v1.2.0

# Update version numbers
npm version 1.2.0 --no-git-tag-version
cd frontend && npm version 1.2.0 --no-git-tag-version && cd ..
cd backend && npm version 1.2.0 --no-git-tag-version && cd ..

# Update CHANGELOG.md
git add .
git commit -m "chore(release): prepare v1.2.0

- Update version numbers
- Update CHANGELOG.md
- Final testing and bug fixes"

# Push release branch
git push origin release/v1.2.0

# Create PR to main
# After testing and approval:

# Merge to main
git checkout main
git pull origin main
git merge release/v1.2.0

# Tag the release
git tag -a v1.2.0 -m "Release v1.2.0

Features:
- Analytics dashboard
- Enhanced error handling
- Performance improvements

Bug fixes:
- Authentication token issues
- UI responsiveness fixes"

git push origin main --tags

# Merge back to develop
git checkout develop
git merge release/v1.2.0
git push origin develop

# Delete release branch
git branch -d release/v1.2.0
git push origin --delete release/v1.2.0
```

## Commit Message Convention

We follow the **Conventional Commits** specification:

### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **ci**: CI/CD changes
- **build**: Build system changes

### Scopes
- **auth**: Authentication/authorization
- **api**: Backend API
- **ui**: Frontend UI components
- **db**: Database changes
- **analytics**: Analytics features
- **portal**: Portal-specific changes
- **config**: Configuration changes

### Examples

```bash
# Feature
git commit -m "feat(analytics): add student participation metrics

- Implement attendance rate calculations
- Add no-show pattern analysis
- Include completion rate tracking

Closes CPR-234"

# Bug fix
git commit -m "fix(auth): resolve session timeout issue

The JWT token was not being refreshed properly when nearing expiration.
Added automatic refresh logic 5 minutes before expiry.

Fixes CPR-567"

# Documentation
git commit -m "docs(api): update endpoint documentation

- Add new analytics endpoints
- Update authentication examples
- Fix response schema formatting"

# Breaking change
git commit -m "feat(api)!: restructure user authentication

BREAKING CHANGE: The authentication API has been restructured.
- Changed login endpoint from /auth/login to /login
- Updated response format to include organizationName
- Removed deprecated /auth/validate endpoint

Migration guide available in docs/MIGRATION.md"
```

## Pull Request Guidelines

### PR Title Format
```
<type>[scope]: <description>
```

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing (if UI changes)

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] Responsive design verified (if UI changes)

## Related Issues
Closes #123
Fixes #456
```

### Review Process

1. **Self-Review**: Author reviews their own PR first
2. **Automated Checks**: CI/CD pipeline runs tests and linting
3. **Peer Review**: At least 2 team members review
4. **Approval**: All reviewers approve
5. **Merge**: Squash and merge to maintain clean history

## Git Configuration

### Initial Setup
```bash
# Configure user information
git config --global user.name "Your Name"
git config --global user.email "your.email@company.com"

# Configure line endings
git config --global core.autocrlf input  # Linux/Mac
git config --global core.autocrlf true   # Windows

# Configure default branch
git config --global init.defaultBranch main

# Configure pull strategy
git config --global pull.rebase false

# Configure editor
git config --global core.editor "code --wait"  # VS Code
```

### Useful Aliases
```bash
# Add to ~/.gitconfig or run as commands
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual '!gitk'
git config --global alias.lg "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"
git config --global alias.cleanup "!git branch --merged | grep -v '\\*\\|main\\|develop' | xargs -n 1 git branch -d"
```

## Best Practices

### 1. Commit Practices
- **Atomic Commits**: Each commit should represent a single logical change
- **Descriptive Messages**: Write clear, descriptive commit messages
- **Frequent Commits**: Commit early and often
- **Review Before Push**: Always review changes before pushing

### 2. Branch Management
- **Short-Lived Branches**: Keep feature branches small and short-lived
- **Regular Updates**: Regularly sync with develop/main
- **Clean History**: Use rebase for clean, linear history when appropriate
- **Delete Merged Branches**: Clean up branches after merging

### 3. Collaboration
- **Pull Before Push**: Always pull latest changes before pushing
- **Communicate Changes**: Use descriptive PR descriptions
- **Review Thoroughly**: Provide constructive feedback in reviews
- **Test Locally**: Test changes locally before creating PR

### 4. Security
- **No Secrets**: Never commit passwords, API keys, or secrets
- **Environment Files**: Use .env files (ignored by Git)
- **Sensitive Data**: Use environment variables for sensitive configuration
- **Regular Audits**: Regularly audit repository for accidentally committed secrets

## Common Commands

### Daily Workflow
```bash
# Start work day
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/new-feature

# Check status
git status

# Stage changes
git add .
git add specific-file.js

# Commit changes
git commit -m "feat: add new feature"

# Push branch
git push origin feature/new-feature

# Update branch with latest develop
git checkout develop
git pull origin develop
git checkout feature/new-feature
git rebase develop
```

### Maintenance Commands
```bash
# Clean up merged branches
git branch --merged | grep -v "\*\|main\|develop" | xargs -n 1 git branch -d

# Prune remote branches
git remote prune origin

# Reset to remote state
git reset --hard origin/develop

# Stash changes
git stash
git stash pop

# View commit history
git log --oneline --graph --decorate --all

# Find commits by message
git log --grep="analytics"

# Show changes in commit
git show <commit-hash>
```

### Emergency Commands
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Revert a commit (safe for shared branches)
git revert <commit-hash>

# Force push (use with caution)
git push --force-with-lease origin feature-branch

# Recover deleted branch
git reflog
git checkout -b recovered-branch <commit-hash>
```

## Troubleshooting

### Common Issues

#### Merge Conflicts
```bash
# When conflicts occur during merge/rebase
git status  # See conflicted files
# Edit files to resolve conflicts
git add resolved-file.js
git commit  # Complete merge
# or
git rebase --continue  # Continue rebase
```

#### Accidentally Committed to Wrong Branch
```bash
# Move commits to correct branch
git log --oneline  # Find commit hashes
git checkout correct-branch
git cherry-pick <commit-hash>
git checkout wrong-branch
git reset --hard HEAD~1  # Remove from wrong branch
```

#### Large File Issues
```bash
# Remove large file from history
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch large-file.zip' \
--prune-empty --tag-name-filter cat -- --all

# Alternative: use BFG Repo-Cleaner
java -jar bfg.jar --delete-files large-file.zip
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

## GitHub Integration

### Branch Protection Rules
- **main**: Require PR reviews, status checks, up-to-date branches
- **develop**: Require PR reviews, status checks
- **No direct pushes**: All changes via Pull Requests

### GitHub Actions
- **CI/CD Pipeline**: Automated testing and deployment
- **Code Quality**: ESLint, Prettier, TypeScript checks
- **Security Scanning**: Dependency vulnerability checks
- **Performance**: Bundle size analysis

### Issue Templates
- **Bug Report**: Structured bug reporting
- **Feature Request**: Feature proposal template
- **Documentation**: Documentation improvement requests

## Team Guidelines

### Code Review Checklist
- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No hardcoded values or secrets
- [ ] Error handling is appropriate
- [ ] Performance considerations addressed
- [ ] Security implications reviewed
- [ ] Accessibility requirements met

### Release Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Version numbers updated
- [ ] CHANGELOG.md updated
- [ ] Security review completed
- [ ] Performance testing done
- [ ] Backup procedures verified
- [ ] Rollback plan prepared

---

## Resources

- [Git Documentation](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Atlassian Git Tutorials](https://www.atlassian.com/git/tutorials)

---

**Last Updated**: January 2025  
**Version**: 1.0.0 