# Version Control Strategy

## Overview

This document explains how code changes flow from development through to production, including when commits are made, when deployments happen, and how to roll back if needed.

---

## 1. The Pipeline

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   LOCAL FILES   │ ───► │   GIT COMMIT    │ ───► │     GITHUB      │ ───► │   PRODUCTION    │
│   (Your Mac)    │      │   (Local repo)  │      │    (Remote)     │      │    (Firebase)   │
└─────────────────┘      └─────────────────┘      └─────────────────┘      └─────────────────┘
      AUTO                  MANUAL                    MANUAL                   MANUAL
   (on edit)            (after features)          (after commit)           (explicit deploy)
```

---

## 2. Local File Storage

### When files are saved locally:
- **Immediately** - Every time I use `write_to_file` or `replace_file_content`, the file is saved to disk instantly
- **No staging** - There's no intermediate buffer; the change goes directly to your filesystem
- **Visible in IDE** - You can see changes immediately in your open files

### What this means:
- If I make an edit and then you close your laptop, the edit is preserved
- If I make a breaking change, the local file is immediately affected
- You can always `git checkout -- <file>` to restore from the last commit

---

## 3. Git Commits

### When I commit:
| Trigger | Example |
|---------|---------|
| **After completing a logical unit of work** | Added retry timestamp feature |
| **After fixing a bug** | Fixed video generation timeout |
| **After implementing a feature** | Added Save to Library button |
| **Before switching to a different task** | Committing current work before starting new feature |
| **At your explicit request** | "commit and push" or `/commit` |

### What triggers a commit:
- ✅ Completing a feature or fix
- ✅ Successful build (`npm run build` passes)
- ✅ User explicitly requests
- ❌ NOT every individual file edit
- ❌ NOT on a time schedule
- ❌ NOT based on lines of code count

### Commit message format:
```
<Type>: <Short description>

<Detailed explanation>
- Bullet points for specific changes
- Files modified
- Why the change was made
```

### Example:
```
Fix video generation: increase timeout to 10min and simplify storage

Changes:
- Increased video generation timeout from 5 to 10 minutes
- Simplified error messages (removed CORS references)
- saveGeneratedVideo() now saves URL directly to Firestore
- Removed unused Firebase Storage imports from visuals.ts
```

---

## 4. GitHub Pushes

### When I push to GitHub:
| Trigger | Frequency |
|---------|-----------|
| **Immediately after every commit** | Every time |

### Why push immediately:
1. **Backup** - Your code is safely stored remotely
2. **Collaboration** - Changes are visible to anyone with access
3. **Deployment readiness** - GitHub is the source for production deploys
4. **Rollback capability** - Every commit is preserved and accessible

### What this means:
- Every commit I make is pushed within seconds
- Your GitHub repository always reflects the latest committed state
- If your local machine fails, you lose nothing that was committed

---

## 5. Production Deployments

### When I deploy to Firebase:
| Trigger | Action |
|---------|--------|
| **Explicitly requested** | "deploy to production" or "deploy to Firebase" |
| **After major feature completion** | When testing is needed on live site |
| **After critical bug fixes** | When the fix needs to go live immediately |
| **After verification testing** | End of testing sessions |

### What I do NOT deploy:
- ❌ Every commit
- ❌ Work in progress
- ❌ Untested changes (unless urgent)

### Deployment command:
```bash
npm run build && firebase deploy --only hosting
```

### Current deployment requires:
- Valid Firebase authentication (may need `firebase login --reauth`)
- Successful build (no TypeScript errors)

---

## 6. Versioning Strategy

### Current approach: **Commit-based versioning**

Every commit is a potential rollback point. Commits are identified by:
1. **Commit hash** - e.g., `ae74a90`
2. **Commit message** - Human-readable description
3. **Timestamp** - When the commit was made

### Special version markers:

| Type | Purpose | Example |
|------|---------|---------|
| **Git Tags** | Mark significant releases | `v1.0.0-verified` |
| **Branch names** | Isolate major features | `feature/video-storage` |

### Current tags on this project:
```bash
git tag -l
# v1.0.0-verified  (E2E tested and verified release)
```

---

## 7. How to Roll Back

### Option A: Roll back a single file
```bash
# See file history
git log --oneline src/pages/SocialMediaRepurpose.tsx

# Restore file from specific commit
git checkout abc1234 -- src/pages/SocialMediaRepurpose.tsx
```

### Option B: Roll back entire project to a commit
```bash
# See commit history
git log --oneline -20

# Soft rollback (keeps files, ready to re-commit)
git reset --soft abc1234

# Hard rollback (discards all changes after that commit)
git reset --hard abc1234
```

### Option C: Roll back production only
```bash
# 1. Find the working commit
git log --oneline -20

# 2. Create a branch from that point
git checkout abc1234
git checkout -b hotfix/rollback

# 3. Deploy from that branch
npm run build && firebase deploy --only hosting

# 4. Return to main to continue work
git checkout main
```

### Option D: Revert a specific commit (non-destructive)
```bash
# Creates a NEW commit that undoes a previous one
git revert abc1234
git push origin main
```

---

## 8. Viewing History

### Recent commits:
```bash
git log --oneline -20
```

### Commits touching a specific file:
```bash
git log --oneline src/pages/SocialMediaRepurpose.tsx
```

### What changed in a commit:
```bash
git show abc1234
```

### Compare two commits:
```bash
git diff abc1234..def5678
```

---

## 9. Current Session Summary

### Commits made this session:

| Time | Commit | Description |
|------|--------|-------------|
| Earlier | `3c0caa9` | Add Social Media video storage |
| Earlier | `d238080` | Fix video generation: increase timeout to 10min |
| 5:08 AM | `ae74a90` | Add retry timestamp display |

### Files modified this session:
- `docs/SOCIAL_MEDIA_VIDEO_SYSTEM.md` - New documentation
- `docs/VERSION_CONTROL_STRATEGY.md` - This document
- `src/lib/visuals.ts` - Simplified video storage
- `src/pages/SocialMediaRepurpose.tsx` - Timeout increase, retry timestamps

---

## 10. Recommendations for Your Workflow

### To maximize rollback capability:

1. **Request commits at logical points**
   - "Commit what we have before moving on"
   - "Save this as a checkpoint"

2. **Use tags for major milestones**
   - After completing a major feature
   - Before making risky changes
   - After successful E2E testing

3. **Deploy less frequently than you commit**
   - Commits = checkpoints for developers
   - Deploys = releases for users

4. **Keep the `/commit` workflow handy**
   - Uses the workflow at `.agent/workflows/commit.md`
   - Stages, commits with message, and pushes

---

## 11. Quick Reference Commands

```bash
# See what's changed locally (not committed)
git status

# See recent commits
git log --oneline -10

# Undo local changes (before commit)
git checkout -- <file>

# See all tags
git tag -l

# Create a new tag
git tag v1.0.1-description

# Push tags to GitHub
git push origin --tags

# Deploy to production
firebase deploy --only hosting
```

---

## Summary

| Stage | When | Rollback Method |
|-------|------|-----------------|
| **Local edit** | Every file save | `git checkout -- <file>` |
| **Git commit** | After features/fixes | `git reset` or `git revert` |
| **GitHub push** | After every commit | Pull old commit, push again |
| **Production deploy** | On request | Deploy from older commit |

**Key principle:** Commits are cheap and frequent. Deploys are deliberate and tested. Every commit is a rollback point.
