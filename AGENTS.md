<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Game rules (XP per intensity, rank ladder) live as pure functions in `src/lib/game.ts` — keeps them testable and UI-independent.
- All task/XP persistence goes through `src/lib/quest-store.ts` (currently localStorage) — the user will replace load/save with their own backend, so components must not touch storage directly.
- Sounds are synthesized with Web Audio in `src/lib/sound.ts` — no audio asset files to ship.
