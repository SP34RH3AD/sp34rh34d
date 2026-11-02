> Connection established. Welcome, choom.

This site is 100% static: HTML, CSS and JavaScript, hosted on **GitHub Pages**.
Repositories are loaded live from the public GitHub API, and every post can point
to one of my repos through the `repo` field in `posts/index.json`.

## Publishing a new post

1. Create `posts/<slug>.md` with the content in Markdown.
2. Add an entry to `posts/index.json`:

```json
{
  "slug": "my-tool",
  "title": "my-tool: automated recon",
  "date": "2026-11-01",
  "repo": "my-tool",
  "tags": ["recon", "python"],
  "summary": "Short summary shown in the post list."
}
```

3. `git commit && git push`. Done.

The repo card (stars, language, last update) is rendered above the post automatically,
and in the **REPOS** tab the repo links back to this post.
