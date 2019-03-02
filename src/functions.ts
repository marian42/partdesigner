function triangularNumber(n: number): number {
	return n * (n + 1) / 2;
}

function inverseTriangularNumber(s: number): number {
	return (Math.floor(Math.sqrt(8 * s + 1)) - 1) / 2;
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

function min<T>(array: T[], selector: (item: T) => number): number {
	var initialized = false;
	var minValue: number;

	for (let item of array) {
		let currentValue = selector(item);
		if (!initialized || currentValue < minValue) {
			initialized = true;
			minValue = currentValue;
		}
	}
	return minValue;
}