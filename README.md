# 🎅 Secret Santa

A simple Secret Santa page for the family Christmas.

## How to use

1. Open the site.
2. Add every cousin's name (you need at least 3).
3. Click **Draw!**. Everyone gets exactly one person, and nobody gets themselves.
4. Click **Copy link** next to each name and send that link to that person (WhatsApp, text, etc.).
5. Each cousin opens their link, taps **Unwrap**, and sees who they're buying for.

The organiser only sees the links, not who got whom, so they can take part too.

**Important:** don't refresh the page or click **Redraw** after you've sent links. A redraw makes a brand new set of matches, and the old links won't line up with it.

## How it works

There's no server or database. The draw happens in your browser, and each person's match is packed into their own link. A link always shows the same result, so opening it twice doesn't redraw.

The names in a link are scrambled (base64), not encrypted. A tech-savvy cousin could decode their own link, but they'd only learn their own match.

## Files

- `index.html`: the page
- `style.css`: the festive styling
- `app.js`: the draw and the links
