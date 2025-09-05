# Firebase Studio - Zippclip

This is a Next.js video-sharing app, similar to TikTok, created in Firebase Studio.

## Getting Started

To get started, take a look at `src/app/(app)/home/page.tsx`.

## Pushing to GitHub

### First-Time Push to a New Repository

If you are pushing to a new GitHub repository for the first time, use the following commands in your terminal:

```bash
# (Only if you haven't already initialized a git repository)
git init -b main

# Add all the files to be tracked by Git
git add .

# Create your first commit to save your changes
git commit -m "Initial commit"

# Link your local project to your remote GitHub repository
# Replace the URL with your own repository's URL
git remote add origin https://github.com/your-username/your-repository.git

# Push your code and set the upstream branch
# This links your local 'main' branch to the 'main' branch on GitHub
git push --set-upstream origin main
```

**Note on Authentication:** When prompted for a password, you will need to use a **GitHub Personal Access Token (PAT)**, not your regular GitHub password.

### Subsequent Pushes

For all future updates, you can simply use:
```bash
git push
```

### Troubleshooting

If you run into issues with the remote repository or need to "restart" the connection, follow these steps:

1.  **Check your current remote URL:**
    ```bash
    git remote -v
    ```
    Ensure the URL for `origin` is correct.

2.  **If the URL is wrong, remove it and add the correct one:**
    ```bash
    git remote remove origin
    git remote add origin https://github.com/your-username/your-repository.git
    ```

3.  **Then, try the initial push command again:**
    ```bash
    git push --set-upstream origin main
    ```