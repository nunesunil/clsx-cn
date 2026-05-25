import { twMerge } from "tailwind-merge";
import { type ClassValue, clsx } from "./clsx";
import {
	type DefineConfigOptions,
	defineConfig,
	resolveOnCompleteHook,
} from "./cva";

/** Merge class inputs with clsx, then dedupe conflicting Tailwind classes. */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(...inputs));
}

/** Build a `cn`-style helper with a custom merge function (e.g. from `tailwind-merge`). */
export function createCn(merge: (className: string) => string = twMerge) {
	return (...inputs: ClassValue[]): string => merge(clsx(...inputs));
}

function chainOnComplete(
	merge: (className: string) => string,
	next?: (className: string) => string,
) {
	return next ? (className: string) => next(merge(className)) : merge;
}

/** `defineConfig` with `twMerge` applied after clsx (shadcn-style `cx` pipeline). */
export function defineConfigWithTwMerge(options?: DefineConfigOptions) {
	const onComplete = resolveOnCompleteHook(options?.hooks);

	return defineConfig({
		...options,
		hooks: {
			onComplete: chainOnComplete(twMerge, onComplete),
		},
	});
}

/** `cva` / `cx` / `compose` with Tailwind merge enabled in the `cx` pipeline. */
export const { compose, cva, cx } = defineConfigWithTwMerge();
