class Vector3 {
	public x: number;
	public y: number;
	public z: number;

	constructor(x: number, y: number, z: number) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	public times(factor: number): Vector3 {
		return new Vector3(this.x * factor, this.y * factor, this.z * factor);
	}

	public plus(other: Vector3): Vector3 {
		return new Vector3(this.x + other.x, this.y + other.y, this.z + other.z);
	}

	public minus(other: Vector3): Vector3 {
		return new Vector3(this.x - other.x, this.y - other.y, this.z - other.z);
	}

	public dot(other: Vector3): number {
		return this.x * other.x + this.y * other.y + this.z * other.z;
	}

	public cross(other: Vector3): Vector3 {
		return new Vector3(this.y * other.z - this.z * other.y, this.z * other.x - this.x * other.z, this.x * other.y - this.y * other.x);
	}

	public elementwiseMultiply(other: Vector3) {
		return new Vector3(this.x * other.x, this.y * other.y, this.z * other.z);
	}

	public magnitude(): number {
		return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
	}

	public normalized(): Vector3 {
		return this.times(1 / this.magnitude());
	}

	public toString(): string {
		return "(" + this.x + ", " + this.y + ", " + this.z + ")";
	}

	public copy(): Vector3 {
		return new Vector3(this.x, this.y, this.z);
	}

	public equals(other: Vector3): boolean {
		return this.x == other.x && this.y == other.y && this.z == other.z;
	}

	public floor(): Vector3 {
		return new Vector3(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z));
	}

	public toNumber(): number {
		let layer3D = this.x + this.y + this.z;
		let layer2D = layer3D - this.y;
	
		return tetrahedralNumber(layer3D) + triangularNumber(layer2D) + this.x;
	}

	public static fromNumber(value: number): Vector3 {
		let layer3D = inverseTetrahedralNumber(value);
		value -= tetrahedralNumber(layer3D);
		let layer2D = inverseTriangularNumber(value);
	
		let x = value - triangularNumber(layer2D);
		let y = layer3D - layer2D;
		let z = layer3D - x - y;
	
		return new Vector3(x, y, z);
	}

	public static zero(): Vector3 {
		return new Vector3(0, 0, 0);
	}

	public static one(): Vector3 {
		return new Vector3(1, 1, 1);
	}

	public static lerp(a: Vector3, b: Vector3, progress: number): Vector3 {
		return a.plus(b.minus(a).times(progress));
	}
}

const RIGHT_FACE_VERTICES = [
	new Vector3(1, 1, 0),
	new Vector3(1, 1, 1),
	new Vector3(1, 0, 1),
	new Vector3(1, 0, 0)
];

const LEFT_FACE_VERTICES = [
	new Vector3(0, 0, 0),
	new Vector3(0, 0, 1),
	new Vector3(0, 1, 1),
	new Vector3(0, 1, 0)
];

const UP_FACE_VERTICES = [
	new Vector3(0, 1, 0),
	new Vector3(0, 1, 1),
	new Vector3(1, 1, 1),
	new Vector3(1, 1, 0)
];

const DOWN_FACE_VERTICES = [
	new Vector3(1, 0, 0),
	new Vector3(1, 0, 1),
	new Vector3(0, 0, 1),
	new Vector3(0, 0, 0)
];

const FORWARD_FACE_VERTICES = [
	new Vector3(1, 0, 1),
	new Vector3(1, 1, 1),
	new Vector3(0, 1, 1),
	new Vector3(0, 0, 1)
];

const BACK_FACE_VERTICES = [
	new Vector3(0, 0, 0),
	new Vector3(0, 1, 0),
	new Vector3(1, 1, 0),
	new Vector3(1, 0, 0)
];

const FACE_DIRECTIONS = [
	new Vector3(1, 0, 0),
	new Vector3(-1, 0, 0),
	new Vector3(0, 1, 0),
	new Vector3(0, -1, 0),
	new Vector3(0, 0, 1),
	new Vector3(0, 0, -1)
];