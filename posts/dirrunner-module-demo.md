> Uplink ready. This is a visual walkthrough on lab targets, not a live engagement.

**DirRunner** is a Go web scanner (pure stdlib, worker pools, streaming output, JSON/export
and an optional HTTP/SOCKS5 proxy). It bundles DNS and directory enumeration, virtual-host
discovery, HTTP fingerprinting, web crawling, site cloning, path traversal, 401/403 bypass, SQLi indicators and CSRF-aware fuzzing.

## ▶ Interactive demo

<iframe class="demo-frame" src="demo/dirrunner-demo.html" title="dirrunner module demo" loading="lazy"></iframe>

[▶ Open the demo full screen](demo/dirrunner-demo.html)


## Modules by tab

- **Enumeration** — `dns` (subdomain resolution), `dir` (directory/file discovery), `vhost`
  (Host-header sweep) and `fingerprint` (stack detection). 
- **Crawler** — `crawl` (links, JS/image assets, e-mails and `--regex` matches in one pass)
  and `clone` (breadth-first offline mirror).
- **FUZZ** — `fuzz`, including the **anti-CSRF token bypass** below.
- **Web scanner** — `traversal` (local file disclosure), `bypass` (401/403 access-control
  tricks) and `sqli` (error- and boolean-based indicators).

## Scenario: bypassing the anti-CSRF token

The highlight tab. A Laravel login form ships a per-request anti-CSRF token plus a matching
session cookie, so a blind password spray is rejected every time:

```bash
# naive — every POST returns 200 "CSRF token mismatch", 0 hits
./dirrunner fuzz \
  -u https://admin.example.com/login \
  -X POST \
  -p 'username=admin&password=FUZZ' \
  -w wordlist/passwords.txt \
  -c 302
```

`--csrf-field` turns each attempt into a two-phase exchange: DirRunner first **GETs a fresh
token and session cookie**, then **replays them in the POST** alongside the fuzzed field. The
placeholder `csrf=x` in `--data` is overwritten automatically on every request:

```bash
# bypass — fresh token + session cookie fetched before each request
./dirrunner fuzz \
  -u https://admin.example.com/login \
  -p 'username=admin&password=FUZZ&csrf=x' \
  --csrf-field csrf \
  -w wordlist/passwords.txt \
  -c 302
```

When the token is minted on a different page, point phase 1 at it with `--csrf-url`:

```bash
./dirrunner fuzz \
  -u https://admin.example.com/login \
  -p 'username=admin&password=FUZZ&csrf=x' \
  --csrf-field csrf \
  --csrf-url https://admin.example.com/login-form \
  -w wordlist/passwords.txt
```

The same works with a JSON body (`-b '{"username":"admin","password":"FUZZ","csrf":"x"}'`).
Point `--csrf-field` at the real hidden field name (`csrf`, `_token`, `authenticity_token`, …)
and keep the fuzzed field separate.

## Build

```bash
git clone https://github.com/SP34RH3AD/DirRunner.git
cd DirRunner
go build -o dirrunner ./cmd/dirrunner && chmod +x dirrunner
```

Cross-compiles cleanly (pure Go, standard library only):

```bash
GOOS=windows GOARCH=amd64 go build -o dirrunner.exe ./cmd/dirrunner
GOOS=linux   GOARCH=amd64 go build -o dirrunner      ./cmd/dirrunner
```

## Usage

```bash
./dirrunner <module> [flags]
# every module can read its target from stdin with '-':
echo https://example.com | ./dirrunner dir -
```

## Disclaimer

For use only on your own environments or with written authorization and a defined scope. The
`traversal`, `bypass`, `sqli` and CSRF-fuzzing scenarios are intrusive — any testing against a
client's assets requires prior written authorization.
