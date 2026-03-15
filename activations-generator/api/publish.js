export default async function handler(req, res) {
if (req.method !== "POST" && req.method !== "PUT") return res.status(405).end();

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const { path, content, message } = req.body;
  const repo = process.env.GITHUB_REPO; // e.g. "Joe-Meier/activations-work"
  const token = process.env.GITHUB_TOKEN;

  try {
    // Check if file exists (need sha for updates)
    let sha;
    const check = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    });
    if (check.ok) {
      const existing = await check.json();
      sha = existing.sha;
    }

    const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, content, ...(sha ? { sha } : {}) }),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
