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

	public toString(): string {
		return "(" + this.x + ", " + this.y + ", " + this.z + ")";
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
}