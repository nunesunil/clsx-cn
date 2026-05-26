import { twMerge } from "tailwind-merge";
import { type ClassValue, type MaybeClassValue, clsx } from "./clsx";
import { defineConfig, type DefineConfigOptions } from "./cva";
import { resolveOnCompleteHook } from "./hooks";

function mergeCn<TState>(
	merge: (className: string) => string,
	...args:
		| ClassValue[]
		| [MaybeClassValue<TState>]
		| [ClassValue, MaybeClassValue<TState>?]
): string | ((state: TState) => string) {
	if (args.length === 1 && typeof args[0] === "function") {
		const className = args[0];
		return (state) => merge(clsx(className(state)));
	}

	if (args.length === 2 && typeof args[1] === "function") {
		const base = args[0];
		const className = args[1];
		return (state) => merge(clsx(base, className(state)));
	}

	return merge(clsx(...(args as ClassValue[])));
}

/** Merge class inputs with clsx, then dedupe conflicting Tailwind classes. */
export function cn(...inputs: ClassValue[]): string;
export function cn<TState>(
	className: MaybeClassValue<TState>,
): string | ((state: TState) => string);
export function cn<TState>(
	base: ClassValue,
	className?: MaybeClassValue<TState>,
): string | ((state: TState) => string);
export function cn<TState>(
	...args:
		| ClassValue[]
		| [MaybeClassValue<TState>]
		| [ClassValue, MaybeClassValue<TState>?]
): string | ((state: TState) => string) {
	return mergeCn(twMerge, ...args) as string | ((state: TState) => string);
}

/** Build a `cn`-style helper with a custom merge function (e.g. from `tailwind-merge`). */
export function createCn(merge: (className: string) => string = twMerge) {
	function cn(...inputs: ClassValue[]): string;
	function cn<TState>(
		className: MaybeClassValue<TState>,
	): string | ((state: TState) => string);
	function cn<TState>(
		base: ClassValue,
		className?: MaybeClassValue<TState>,
	): string | ((state: TState) => string);
	function cn<TState>(
		...args:
			| ClassValue[]
			| [MaybeClassValue<TState>]
			| [ClassValue, MaybeClassValue<TState>?]
	): string | ((state: TState) => string) {
		return mergeCn(merge, ...args) as string | ((state: TState) => string);
	}

	return cn;
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
			...options?.hooks,
			onComplete: chainOnComplete(twMerge, onComplete),
		},
	});
}

/** `cva` / `cx` / `compose` with Tailwind merge enabled in the `cx` pipeline. */
export const {
	compose: composeWithTwMerge,
	cva: cvaWithTwMerge,
	cx: cxWithTwMerge,
} = defineConfigWithTwMerge();
