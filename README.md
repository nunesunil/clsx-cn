# clsx-cn

**`clsx`**, **`cva`**, and **`cn`** for Tailwind CSS and shadcn/ui-style components — bundled in one package.

[`tailwind-merge`](https://github.com/dcastil/tailwind-merge) is **not** included. It is a **peer dependency**: install it in your app. `cn` and merge-enabled exports call into your installed copy at runtime.

## What’s included

| In `clsx-cn` | Role |
|--------------|------|
| `clsx` | Join conditional class names |
| `cva`, `cx`, `compose` | Variant-driven classes (CVA-compatible API) |
| `cn` | `clsx` + your app’s `tailwind-merge` |
| `createCn` | Custom `cn` with your own merge function |
| `cvaWithTwMerge`, `cxWithTwMerge`, `composeWithTwMerge` | Variants with merge in the internal pipeline |
| `defineConfig`, `defineConfigWithTwMerge` | Custom `cva` / `cx` / `compose` instances |

Default export is `clsx`.

## Install

```bash
pnpm add clsx-cn tailwind-merge
# npm install clsx-cn tailwind-merge
# yarn add clsx-cn tailwind-merge
```

**Peer dependency:** `tailwind-merge@^3` (required for `cn`, `createCn`, and `*WithTwMerge` exports).

Works in browsers, Node, Bun, and bundlers (ESM, `sideEffects: false`).

## Quick start

Typical shadcn `lib/utils.ts`:

```ts
import { cn, type ClassValue } from 'clsx-cn'

export { cn, type ClassValue }
```

Button with variants:

```ts
import { cn, cva, type VariantProps } from 'clsx-cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        outline: 'border border-input bg-background',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type ButtonProps = VariantProps<typeof buttonVariants>

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonProps & React.ComponentProps<'button'>) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
```

## Choosing an API

| Goal | Use |
|------|-----|
| shadcn-style class merging | `cn(...)` |
| Variants only (merge at call site with `cn`) | `cva` + `cn(buttonVariants({ ... }), className)` |
| Variants with merge built into the pipeline | `cvaWithTwMerge` (or `defineConfigWithTwMerge`) |
| Join classes without Tailwind deduping | `clsx` |
| Custom Tailwind merge config | `createCn` + `extendTailwindMerge` from **`tailwind-merge`** |

## API

### `cn`

Uses **your** `tailwind-merge` install (peer) after `clsx`:

```ts
import { cn } from 'clsx-cn'

cn('px-2 py-1', 'p-3') // → 'p-3'
cn('text-sm', false && 'hidden') // → 'text-sm'
```

### `clsx`

Conditional classes only — no conflict resolution:

```ts
import { clsx } from 'clsx-cn'

clsx('foo', { bar: true, baz: false }) // → 'foo bar'
```

### `cva`

[CVA](https://cva.style/docs)-compatible variants. Both call styles:

```ts
import { cva } from 'clsx-cn'

const badge = cva('rounded-full px-2', {
  variants: { tone: { info: 'bg-blue-100', warn: 'bg-yellow-100' } },
})

const badgeAlt = cva({
  base: 'rounded-full px-2',
  variants: { tone: { info: 'bg-blue-100', warn: 'bg-yellow-100' } },
})
```

- **Compound variants:** each matching rule contributes `class` or `className` (one per rule, `class` preferred).
- **Boolean / `0` keys:** `false` → `"false"`, `0` → `"0"` (same as upstream CVA).

### `cvaWithTwMerge` / `cxWithTwMerge` / `composeWithTwMerge`

Same as `cva` / `cx` / `compose`, but the internal `cx` step runs `tailwind-merge` (peer):

```ts
import { cvaWithTwMerge as cva } from 'clsx-cn'

const box = cva('p-4', {
  variants: { size: { sm: 'p-2', lg: 'p-8' } },
})

box({ size: 'sm' }) // → 'p-2' (not 'p-4 p-2')
```

### `createCn` + `tailwind-merge`

Customize merge behavior via the peer package:

```ts
import { createCn } from 'clsx-cn'
import { extendTailwindMerge } from 'tailwind-merge'

const twMerge = extendTailwindMerge({
  classGroups: {
    shadow: [{ shadow: ['100', '200', '300'] }],
  },
})

export const cn = createCn(twMerge)
```

### `defineConfig` / `defineConfigWithTwMerge`

```ts
import { defineConfig, defineConfigWithTwMerge } from 'clsx-cn'

const { cva, cx } = defineConfig({
  hooks: {
    onComplete: (className) => className, // after clsx
  },
})

const { cva: cvaMerged } = defineConfigWithTwMerge()
```

Deprecated hook `cx:done` is still supported; `onComplete` takes precedence.

### `compose`

```ts
import { cva, compose } from 'clsx-cn'

const layout = compose(
  cva('flex', { variants: { direction: { row: 'flex-row', col: 'flex-col' } } }),
  cva('', { variants: { gap: { sm: 'gap-2', lg: 'gap-4' } } }),
)

layout({ direction: 'row', gap: 'sm' })
```

## Compared to installing separately

| Before | After |
|--------|--------|
| `clsx` + `class-variance-authority` (+ often a local `cn` helper) | `clsx-cn` |
| `tailwind-merge` | Still **`tailwind-merge`** (peer — same package, your version) |

You drop duplicate `clsx` / CVA wiring; you keep control of `tailwind-merge` versions in your app.

## Development

```bash
pnpm install
pnpm run build
pnpm run typecheck
pnpm run dev   # watch
```

## License

MIT © [nunesunil](https://github.com/nunesunil)
