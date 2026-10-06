# Submit a fintech project

Contributions use a fork and pull request. Keep each individual application in `student-projects/<project-slug>-<random-id>/`. Use a descriptive project name and random suffix rather than personal identifiers. Keep the instructor reference apps unchanged in your submission.

## 1. Fork, clone, and synchronize

Click **Fork** on [fintech-samples](https://github.com/adnanmasood/fintech-samples), then clone your fork. Replace `YOUR-GITHUB-USERNAME` with your account name:

```sh
git clone https://github.com/YOUR-GITHUB-USERNAME/fintech-samples.git
cd fintech-samples
git remote add upstream https://github.com/adnanmasood/fintech-samples.git
git fetch upstream
git switch main
git merge --ff-only upstream/main
git switch -c submit/digital-wallet-7f3c2a
```

On later submissions, the upstream remote already exists, so skip `git remote add`. Synchronize before creating the next branch. If your `main` cannot fast-forward, ask Claude Code to inspect the branch history and explain a safe resolution.

## 2. Prepare the project

Create your folder, for example `student-projects/digital-wallet-7f3c2a/`. Use [the README template](docs/PROJECT_README_TEMPLATE.md) and include:

- Source and pinned runtime dependencies, with exact setup/run commands.
- Fictional example data and tests for normal, failure, and relevant boundary cases.
- Two screenshots showing your running application's normal and failure behavior.
- Actual test results, one explained rule, one small tested modification, and limitations.
- `AI_USAGE.md` summarizing prompts, assisted files, your changes, and how you verified the result.

Use the requirements from your own project brief. Runtime AI extensions are optional where your brief allows them. Coding assistance alone is not a runtime AI feature.

## 3. Review privacy and verify

Remove personal names, contact details, student IDs, grades, real financial records, credentials, private paths, and identifying notebook outputs. Inspect screenshots and documents as well as code. Keep dependencies, virtual environments, build output, logs, archives, and editor state out of the submission. Use fictional examples and empty configuration placeholders.

Run your project's documented tests. Then run the repository publication check from the root:

```sh
python3 scripts/check-publication.py
```

The automated check catches selected patterns and prohibited artifacts. You must also review your files and screenshots. GitHub identities and commit metadata remain public; use your account's GitHub-provided noreply commit email if you want to keep your personal email private.

Ask Claude Code:

```text
Review only student-projects/digital-wallet-7f3c2a/. Run its documented
tests, report actual failures, and fix them. Inspect the proposed
submission for personal data and secrets, including screenshots,
notebook outputs, and Git metadata. Show the final diff and any remaining
limitations. Do not stage unrelated files or modify the reference apps.
```

## 4. Commit only your project and open a PR

```sh
git add student-projects/digital-wallet-7f3c2a/
git diff --cached --stat
git diff --cached
git commit -m "Add digital wallet project"
git push -u origin submit/digital-wallet-7f3c2a
```

On GitHub, choose **Contribute → Open pull request**. Set the base repository to `adnanmasood/fintech-samples` and base branch to `main`. Use the PR template and describe the project, verification, change, limitations, and AI assistance. Submit the PR URL through the instructor's assigned submission channel.

Alternatively, after GitHub CLI authentication, ask Claude Code:

```text
Create a pull request from this branch in my fork to
adnanmasood/fintech-samples, base main. Use .github/pull_request_template.md.
Include only checks actually run and describe my project's use case,
tested modification, limitations, and AI-use record. Keep personal
details out of the title and description. Show me the resulting PR URL.
```

Address review feedback on the same branch, rerun relevant checks, and push again. Maintain one project folder per individual submission. Do not add classmates' work or personal details.
