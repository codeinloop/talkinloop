# Security

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Report it privately through GitHub: on the repository page, open **Security** → **Report a
vulnerability**. If that option is not available, send a private message to the maintainer,
Danilo Dorgam, through [LinkedIn](https://www.linkedin.com/in/danilodorgam/).

Include what you found, how to reproduce it and what an attacker could do with it. You should get
a first answer within a week. Fixes are released on the `main` branch; there are no long-term
support branches.

## What matters most here

The project runs on a presenter's laptop and is exposed to an audience through a public tunnel,
so these are the boundaries worth attacking:

- **The presenter token.** Everything under `/apresentador` (deck, remote, stage WebSocket,
  metrics) must be unreachable without it. A way to control the slides, open a poll, read the
  metrics or inject links without the token is a vulnerability.
- **The audience socket.** A client on `/ws` must only be able to react, vote and count a click.
  Anything beyond that is a vulnerability.
- **The audience page.** Links and titles come from the deck and are shown on other people's
  phones. A way to make it render HTML or run script is a vulnerability.
- **`deck.config.json`.** Its values end up in pages served to the audience. A value that escapes
  the validation in `backstage/config.ts` is a vulnerability.

## Out of scope

- Flooding reactions or connections from many devices: the server rate-limits each connection,
  but a public address can always be flooded.
- Anything that requires the presenter token or access to the presenter's machine.
- The 200 in-flight request limit and the lack of uptime guarantee of Cloudflare Quick Tunnels.
