// Site configuration. Edit these values.
window.SITE_CONFIG = {
  githubUser: "sp34rh3ad",        // your GitHub username
  hideRepos: ["sp34rh34d"],                  // repos to hide, e.g. ["sp34rh34d.github.io"]
  postsIndex: "posts/index.json", // posts index
  reposSnapshot: "assets/data/repos.json", // fallback when the GitHub API fails/rate-limits
  userSnapshot: "assets/data/user.json",
  terminal: [                     // lines "typed" into the home terminal
    { cmd: "whoami", out: "sp34rh34d" },
    { cmd: "cat /etc/motd", out: "Offensive security tooling & research.\nAuthorized targets only. Stay frosty." },
    { cmd: "ls ~/tools", out: "__REPOS__" } // __REPOS__ is replaced with your latest repos
  ],
  // ABOUT tab. Edit freely — this is your profile text (GitHub has no bio of its own).
  about: {
    handle: "sp34rh34d",
    role: "Offensive Security Engineer / Penetration Tester",
    tagline: "Offensive security tooling, research & automation.",
    bio: [
      "I work in offensive security — penetration testing, red teaming and digital forensics — assessing networks, web apps and infrastructure under authorized engagements.",
      "I build and publish the tooling I use: network pivoting, recon, fuzzing and web-assessment automation, with a write-up of how each one works.",
      "Everything here is for authorized testing and education only."
    ],
    certifications: [
      "CPENTv2", "CEH", "Master CEH", "CHFI", "CEI"
    ],
    knowledge: ["Kaspersky", "Fortinet"],   // vendor/tech knowledge (not certifications)
    skills: ["pentesting", "red team", "forensics", "malware analysis", "pivoting", "recon", "fuzzing", "go", "python"],
    links: [
      { label: "twitter", url: "https://x.com/spearh34d" }
    ]
  }
};
