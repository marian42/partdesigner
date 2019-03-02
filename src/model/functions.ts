function localX(quadrant: Quadrant): number {
	return (quadrant == Quadrant.TopRight || quadrant == Quadrant.BottomRight) ? 1 : 0;
}

function localY(quadrant: Quadrant): number {
	return (quadrant == Quadrant.TopRight || quadrant == Quadrant.TopLeft) ? 1 : 0;
}

function getAngle(quadrant: Quadrant): number {
	switch (quadrant) {
		case Quadrant.TopRight:
			return 0;
		case Quadrant.BottomRight:
			return 90;
		case Quadrant.BottomLeft:
			return 180;
		case Quadrant.TopLeft:
			return 279;
	}
	throw new Error("Unknown quadrant: " + quadrant);
}

function forward(orientation: Orientation): Vector3 {
	switch (orientation) {
		case Orientation.X: {
			return new Vector3(1, 0, 0);
		}
		case Orientation.Y: {
			return new Vector3(0, 1, 0);
		}
		case Orientation.Z: {
			return new Vector3(0, 0, 1);
		}
	}
	throw new Error("Unknown orientation: " + orientation);
}

function right(orientation: Orientation): Vector3 {
	switch (orientation) {
		case Orientation.X: {
			return new Vector3(0, 1, 0);
		}
		case Orientation.Y: {
			return new Vector3(0, 0, 1);
		}
		case Orientation.Z: {
			return new Vector3(1, 0, 0);
		}
	}
	throw new Error("Unknown orientation: " + orientation);
}

function up(orientation: Orientation): Vector3 {
	switch (orientation) {
		case Orientation.X: {
			return new Vector3(0, 0, 1);
		}
		case Orientation.Y: {
			return new Vector3(1, 0, 0);
		}
		case Orientation.Z: {
			return new Vector3(0, 1, 0);
		}
	}
	throw new Error("Unknown orientation: " + orientation);
}

function IsAttachment(blockType: BlockType): boolean {
	return blockType != BlockType.AxleHole
		&& blockType != BlockType.PinHole
		&& blockType != BlockType.Solid;
}

function getRandomBlockType(): BlockType {
	let types = [BlockType.AxleHole, BlockType.PinHole, BlockType.Solid, BlockType.Pin, BlockType.Axle];
	let index = Math.floor(types.length * Math.random());
	return types[index];
}

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

let CUBE = [
	new Vector3(0, 0, 0),
	new Vector3(0, 0, 1),
	new Vector3(0, 1, 0),
	new Vector3(0, 1, 1),
	new Vector3(1, 0, 0),
	new Vector3(1, 0, 1),
	new Vector3(1, 1, 0),
	new Vector3(1, 1, 1)
];

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