type OnCompleteHook = (className: string) => string;

type DefineConfigHooks = {
	/** @deprecated please use `onComplete` */
	"cx:done"?: OnCompleteHook;
	onComplete?: OnCompleteHook;
};

/** Prefer `onComplete`; falls back to legacy `cx:done`. */
export function resolveOnCompleteHook(
	hooks?: DefineConfigHooks,
): OnCompleteHook | undefined {
	const legacy = hooks as
		| { onComplete?: OnCompleteHook; "cx:done"?: OnCompleteHook }
		| undefined;
	return legacy?.onComplete ?? legacy?.["cx:done"];
}
