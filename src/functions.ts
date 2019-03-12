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

function tinyIndexToWorld(p: number): number {
	let i = Math.floor((p + 1) / 3);
	let j = p - i * 3;

	var f = 0.5 * i;
	if (j == 0) {
		f += EDGE_MARGIN;
	} else if (j == 1) {
		f += 0.5 - EDGE_MARGIN;
	}

	return f;
}

function tinyBlockToWorld(position: Vector3): Vector3 {
	return new Vector3(tinyIndexToWorld(position.x), tinyIndexToWorld(position.y), tinyIndexToWorld(position.z));
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

function sign(a: number): number {
	if (a == 0) {
		return 0;
	} else if (a < 0) {
		return -1;
	} else {
		return 1;
	}
}