> Uplink ready. This is a visual walkthrough, not a live target.

**valky** is a multi-agent L3 *pivoting* tool: it brings up an encrypted mesh over a
TUN interface and routes native traffic (ICMP, nmap, reverse shells) into internal
segments through agents deployed on the pivot hosts.

## ▶ Interactive demo

The demo replays, step by step, the server console and the mesh topology across three
scenarios: **Tunnel mode**, **Proxy mode** and **Cloud relay**.

<iframe class="demo-frame" src="demo/valky-demo.html" title="valky pivot demo" loading="lazy"></iframe>

[▶ Open the demo full screen](demo/valky-demo.html)

> It's a lab animation: credentials and keys are masked and every address is in a
> test range.

## Scenarios

- **Tunnel mode** — agent with root: TUN and raw L3 ingress + reverse shell catch.
- **Proxy mode** — agent without root: userspace L3 egress.
- **Cloud relay** — home NAT → EC2 hub → corporate firewall.

## Install

```bash
git clone https://github.com/SP34RH3AD/valky.git
cd valky
# see the repo README for the build
```

## Usage

```bash
sudo ./valky server --config config.ini
sudo ./valky client --ip 127.0.0.1 --port 9000 --passwd ****
```

## Disclaimer

For use only on your own environments or with written authorization and a defined
scope. Any testing against a client's assets requires prior written authorization.
