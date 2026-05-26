import {
	type ClassArray,
	type ClassDictionary,
	type ClassValue,
	clsx,
} from "./clsx";
import { resolveOnCompleteHook } from "./hooks";

export type { ClassArray, ClassDictionary, ClassValue };

type OmitUndefined<T> = T extends undefined ? never : T;
type StringToBoolean<T> = T extends "true" | "false" ? boolean : T;
type UnionToIntersection<U> = (
	U extends unknown
		? (k: U) => void
		: never
) extends (k: infer I) => void
	? I
	: never;

export type VariantProps<Component extends (...args: any) => any> = Omit<
	OmitUndefined<Parameters<Component>[0]>,
	"class" | "className"
>;

export type Compose = <T extends ReturnType<CVA>[]>(
	...components: [...T]
) => (
	props?: (
		| UnionToIntersection<
				{
					[K in keyof T]: VariantProps<T[K]>;
				}[number]
		  >
		| undefined
	) &
		CVAClassProp,
) => string;

export type CX = (...inputs: ClassValue[]) => string;

export type CXOptions = Parameters<CX>;
export type CXReturn = ReturnType<CX>;

type CVAConfigBase = { base?: ClassValue };
type CVAVariantShape = Record<string, Record<string, ClassValue>>;
type CVAVariantSchema<V extends CVAVariantShape> = {
	[Variant in keyof V]?: StringToBoolean<keyof V[Variant]> | undefined;
};
type CVAClassProp =
	| {
			class?: ClassValue;
			className?: never;
	  }
	| {
			class?: never;
			className?: ClassValue;
	  };

type CVACompoundVariants<V extends CVAVariantShape> = (V extends CVAVariantShape
	? (
			| CVAVariantSchema<V>
			| {
					[Variant in keyof V]?:
						| StringToBoolean<keyof V[Variant]>
						| StringToBoolean<keyof V[Variant]>[]
						| undefined;
			  }
		) &
			CVAClassProp
	: CVAClassProp)[];

type CVAConfig<V extends CVAVariantShape> = CVAConfigBase & {
	variants?: V;
	compoundVariants?: CVACompoundVariants<V>;
	defaultVariants?: CVAVariantSchema<V>;
};

type CVAConfigWithoutBase<V extends CVAVariantShape> = Omit<
	CVAConfig<V>,
	"base"
>;

export interface CVA {
	<
		_ extends "cva's generic parameters are restricted to internal use only.",
		V extends CVAVariantShape,
	>(
		base: ClassValue,
		config: CVAConfigWithoutBase<V>,
	): (props?: CVAVariantSchema<V> & CVAClassProp) => string;
	<
		_ extends "cva's generic parameters are restricted to internal use only.",
		V,
	>(
		config: V extends CVAVariantShape
			? CVAConfig<V>
			: CVAConfigBase & {
					variants?: never;
					compoundVariants?: never;
					defaultVariants?: never;
				},
	): (
		props?: V extends CVAVariantShape
			? CVAVariantSchema<V> & CVAClassProp
			: CVAClassProp,
	) => string;
}

function resolveCvaConfig<V extends CVAVariantShape>(
	baseOrConfig: ClassValue | CVAConfig<V>,
	config?: CVAConfigWithoutBase<V>,
): CVAConfig<V> {
	if (
		config !== undefined ||
		typeof baseOrConfig === "string" ||
		typeof baseOrConfig === "number" ||
		typeof baseOrConfig === "bigint" ||
		Array.isArray(baseOrConfig)
	) {
		return { ...config, base: baseOrConfig as ClassValue } as CVAConfig<V>;
	}

	return baseOrConfig as CVAConfig<V>;
}

type OnCompleteHook = (className: string) => string;

export interface DefineConfigOptions {
	hooks?: {
		/** @deprecated please use `onComplete` */
		"cx:done"?: OnCompleteHook;
		/** Returns the completed string of concatenated classes/classNames. */
		onComplete?: OnCompleteHook;
	};
}

export type DefineConfig = (options?: DefineConfigOptions) => {
	compose: Compose;
	cx: CX;
	cva: CVA;
};

function isKeyOf<
	R extends Record<PropertyKey, unknown>,
	V extends keyof R = keyof R,
>(record: R, key: unknown): key is V {
	return (
		(typeof key === "string" ||
			typeof key === "number" ||
			typeof key === "symbol") &&
		Object.hasOwn(record, key)
	);
}

function mergeDefaultsAndProps<
	V extends CVAVariantShape,
	P extends Record<PropertyKey, unknown>,
	D extends CVAVariantSchema<V>,
>(props: P = {} as P, defaults: D = {} as D) {
	const result: Record<PropertyKey, unknown> = { ...defaults };

	for (const key in props) {
		if (!isKeyOf(props, key)) continue;
		const value = props[key];
		if (typeof value !== "undefined") result[key] = value;
	}

	return result as Record<keyof V, NonNullable<ClassValue>>;
}

function getVariantClassNames<
	V extends CVAVariantShape,
	P extends Record<PropertyKey, unknown> & CVAClassProp,
	D extends CVAVariantSchema<V>,
>(variants: V, props: P = {} as P, defaults: D = {} as D) {
	const variantClassNames: ClassArray = [];

	for (const variant in variants) {
		if (!isKeyOf(variants, variant)) continue;

		const variantProp = props[variant];
		const defaultVariantProp = defaults[variant];
		const variantKey =
			falsyToString(variantProp) || falsyToString(defaultVariantProp);

		if (isKeyOf(variants[variant], variantKey)) {
			variantClassNames.push(variants[variant][variantKey]);
		}
	}

	return variantClassNames;
}

function getCompoundVariantClassNames<V extends CVAVariantShape>(
	compoundVariants: CVACompoundVariants<V>,
	defaultsAndProps: ClassDictionary,
) {
	const compoundClassNames: ClassArray = [];

	for (const compoundConfig of compoundVariants) {
		let selectorMatches = true;

		for (const cvKey in compoundConfig) {
			if (
				!isKeyOf(compoundConfig, cvKey) ||
				cvKey === "class" ||
				cvKey === "className"
			) {
				continue;
			}

			const cvSelector = compoundConfig[cvKey];
			const selector = defaultsAndProps[cvKey];
			const matches = Array.isArray(cvSelector)
				? (cvSelector as readonly unknown[]).includes(selector)
				: selector === cvSelector;

			if (!matches) {
				selectorMatches = false;
				break;
			}
		}

		if (selectorMatches) {
			compoundClassNames.push(compoundConfig.class ?? compoundConfig.className);
		}
	}

	return compoundClassNames;
}

const falsyToString = <T>(value: T) =>
	typeof value === "boolean" ? `${value}` : value === 0 ? "0" : value;

export const defineConfig: DefineConfig = (options) => {
	const cx: CX = (...inputs) => {
		const className = clsx(...inputs);
		const onComplete = resolveOnCompleteHook(options?.hooks);
		return onComplete ? onComplete(className) : className;
	};

	const cva = ((
		baseOrConfig: ClassValue | CVAConfig<CVAVariantShape>,
		config?: CVAConfigWithoutBase<CVAVariantShape>,
	) => {
		const {
			variants,
			defaultVariants = {},
			base,
			compoundVariants = [],
		} = resolveCvaConfig(baseOrConfig, config);

		if (variants == null) {
			return (props?: CVAClassProp) => cx(base, props?.class, props?.className);
		}

		return (props?: CVAVariantSchema<CVAVariantShape> & CVAClassProp) => {
			const variantClassNames = getVariantClassNames(
				variants,
				props,
				defaultVariants,
			);

			const compoundVariantClassNames = getCompoundVariantClassNames(
				compoundVariants,
				mergeDefaultsAndProps(props, defaultVariants),
			);

			return cx(
				base,
				variantClassNames,
				compoundVariantClassNames,
				props?.class,
				props?.className,
			);
		};
	}) as CVA;

	const compose: Compose =
		(...components) =>
		(props) => {
			const { class: classProp, className, ...propsWithoutClass } = props ?? {};

			return cx(
				components.map((component) => component(propsWithoutClass)),
				classProp,
				className,
			);
		};

	return {
		compose,
		cva,
		cx,
	};
};

export const { compose, cva, cx } = defineConfig();
