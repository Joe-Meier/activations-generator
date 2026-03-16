export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  if (!repo || !token) {
    return res.status(500).json({ error: "Missing GITHUB_REPO or GITHUB_TOKEN env vars" });
  }

  try {
    const { path, content, message, meta } = req.body;

    if (!path || !content) {
      return res.status(400).json({ error: "Missing path or content" });
    }

    // Helper: get SHA if file exists
    async function getSha(filePath) {
      const r = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
      });
      if (r.ok) { const j = await r.json(); return j.sha; }
      return null;
    }

    // Helper: put file to GitHub
    async function putFile(filePath, fileContent, commitMsg, sha) {
      return fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: commitMsg,
          content: fileContent,
          ...(sha ? { sha } : {}),
        }),
      });
    }

    // 1. Push the case study HTML
    const caseSha = await getSha(path);
    const caseRes = await putFile(path, content, message || `Add case study: ${path}`, caseSha);
    if (!caseRes.ok) {
      const err = await caseRes.json();
      return res.status(caseRes.status).json(err);
    }

    // 2. Update index.json manifest
    if (meta) {
      let entries = [];
      const indexSha = await getSha("index.json");
      if (indexSha) {
        const indexRes = await fetch(`https://api.github.com/repos/${repo}/contents/index.json`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
        });
        if (indexRes.ok) {
          const indexData = await indexRes.json();
          try {
            entries = JSON.parse(atob(indexData.content.replace(/\n/g, "")));
          } catch(e) { entries = []; }
        }
      }

      // Remove existing entry for this slug if re-publishing
      entries = entries.filter(e => e.slug !== meta.slug);
      // Add new entry at the front
      entries.unshift({ ...meta, publishedAt: new Date().toISOString() });

      const indexContent = btoa(unescape(encodeURIComponent(JSON.stringify(entries, null, 2))));
      await putFile("index.json", indexContent, `Update index: ${meta.slug}`, indexSha);
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
