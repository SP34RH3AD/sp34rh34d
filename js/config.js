// Site configuration. Edit these values.
window.SITE_CONFIG = {
  githubUser: "sp34rh34d",        // your GitHub username
  hideRepos: [],                  // repos to hide, e.g. ["sp34rh34d.github.io"]
  postsIndex: "posts/index.json", // posts index
  terminal: [                     // lines "typed" into the home terminal
    { cmd: "whoami", out: "sp34rh34d" },
    { cmd: "cat /etc/motd", out: "Offensive security tooling & research.\nAuthorized targets only. Stay frosty." },
    { cmd: "ls ~/tools", out: "__REPOS__" } // __REPOS__ is replaced with your latest repos
  ]
};
