export type ClassDictionary = Record<string, unknown>;
export type ClassArray = ClassValue[];
export type ClassValue =
	| ClassArray
	| ClassDictionary
	| string
	| number
	| bigint
	| null
	| boolean
	| undefined;

function toVal(mix: ClassValue): string {
	let k = 0;
	let y = "";
	let str = "";

	if (
		typeof mix === "string" ||
		typeof mix === "number" ||
		typeof mix === "bigint"
	) {
		str += mix;
	} else if (typeof mix === "object" && mix !== null) {
		if (Array.isArray(mix)) {
			const len = mix.length;
			for (k = 0; k < len; k++) {
				if (mix[k]) {
					y = toVal(mix[k]);
					if (y) {
						if (str) str += " ";
						str += y;
					}
				}
			}
		} else {
			for (const key in mix) {
				if (Object.hasOwn(mix, key) && mix[key]) {
					if (str) str += " ";
					str += key;
				}
			}
		}
	}

	return str;
}

export function clsx(...inputs: ClassValue[]): string {
	let i = 0;
	let tmp: ClassValue;
	let x = "";
	let str = "";
	const len = inputs.length;

	for (; i < len; i++) {
		tmp = inputs[i];
		if (tmp) {
			x = toVal(tmp);
			if (x) {
				if (str) str += " ";
				str += x;
			}
		}
	}

	return str;
}

export default clsx;
