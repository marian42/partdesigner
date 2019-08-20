function triangularNumber(n: number): number {
	return n * (n + 1) / 2;
}

function inverseTriangularNumber(s: number): number {
	return Math.floor((Math.floor(Math.sqrt(8 * s + 1)) - 1) / 2);
}

function tetrahedralNumber(n: number): number {
	return n * (n + 1) * (n + 2) / 6;
}

function inverseTetrahedralNumber(s: number): number {
	if (s == 0) {
		return 0;
	}
	let f = Math.pow(1.73205080757 * Math.sqrt(243 * Math.pow(s, 2) - 1) + 27 * s, 1 / 3);
	return Math.floor(f / 2.08008382305 + 0.69336127435 / f - 1);
}

let DEG_TO_RAD = Math.PI / 180;

function min<T>(iterable: Iterable<T>, selector: (item: T) => number): number {
	var initialized = false;
	var minValue: number;

	for (let item of iterable) {
		let currentValue = selector(item);
		if (!initialized || currentValue < minValue) {
			initialized = true;
			minValue = currentValue;
		}
	}
	return minValue;
}

function sign(a: number): number {
	if (a == 0) {
		return 0;
	} else if (a < 0) {
		return -1;
	} else {
		return 1;
	}
}

function lerp(a: number, b: number, t: number): number {
	return a + t * (b - a);
}

function clamp(lower: number, upper: number, value: number) {
	if (value > upper) {
		return upper;
	} else if (value < lower) {
		return lower;
	} else {
		return value;
	}
}

function countInArray<T>(items: T[], selector: (item: T) => boolean): number {
	var result = 0;
	for (var item of items) {
		if (selector(item)) {
			result++;
		}
	}
	return result;
}

function ease(value: number): number {
	return value < 0.5 ? 2 * value * value : -1 + (4 - 2 * value) * value;
}

function mod(a: number, b: number): number {
	return ((a % b) + b) % b;
}