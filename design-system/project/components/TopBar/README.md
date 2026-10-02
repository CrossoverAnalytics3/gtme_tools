# TopBar

The sticky bar on every page: the five-bar brand mark and wordmark on the left (home link), the tool menu on the right.

- The brand mark is five 4 by 10px bars in five tools' signal colors. It is the toolkit's only logo; there is no image file.
- The menu is a `details` element with real links, one row per tool with its signal dot. The current tool is marked `aria-current="page"`.
- Under 480px the wordmark hides and the mark stays.
- Sticks at `top: env(safe-area-inset-top)`.

Consumer provides `tools` (`id`, `n`, `title`, `href`), `current` and `homeHref`.
