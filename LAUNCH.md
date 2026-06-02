# Opening PM Assistant from your desktop

You have two ways to launch it. Both keep **all your data on this PC** and load it automatically — your data lives in the browser's storage for `localhost:5173` plus (optionally) a real file you connect in **Settings → Connect file**.

---

## Option A — Double-click launcher (simplest, no setup)

1. In the project folder, find **`Launch PM Assistant.cmd`**.
2. Right-click it → **Show more options → Send to → Desktop (create shortcut)**.
3. Rename the desktop shortcut to **PM Assistant** (optionally right-click → Properties → Change Icon → pick `public/icon.svg`-style icon).
4. **Double-click it** any time. It starts the local server (minimized window) and opens the app in your browser at `http://localhost:5173`, already up to date.

> Leave the small minimized **"PM Assistant server"** window open while you use the app. Closing it stops the server.

---

## Option B — Install as a real desktop app (nicest, opens in its own window)

1. Launch the app once (Option A, or `npm run dev`).
2. In **Chrome**, click the **install icon** in the address bar (a monitor with a ↓), or **⋮ menu → Cast, save, and share → Install page as app…**.
3. Now **PM Assistant** appears in your Start menu / desktop with its own icon and opens in a standalone window — no browser tabs.
4. Because it's a PWA with a service worker, it loads instantly and works offline once cached.

---

## Keeping data safe across machines / backups

- **Settings → Connect file** saves a real `PM-Assistant.json` (suggest `D:\PM-Assistant\`). Every change autosaves to it, so even if browser storage is cleared, your data survives — reconnect the file to restore.
- **Settings → Export data** makes a timestamped backup any time; Home reminds you weekly.
- To move to another PC: copy the `.json`, then **Settings → Import / restore** there.

---

## After a code update
The launcher serves a built copy in `dist/`. If the app's *code* changes and you want the latest, delete the **`dist`** folder and relaunch (it rebuilds once), or run `npm run build`. Your *data* is never in `dist/`, so this never touches it.
