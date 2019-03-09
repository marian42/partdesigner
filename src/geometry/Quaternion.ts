class Quaternion {
	x: number;
	y: number;
	z: number;
	w: number;

	constructor(x: number, y: number, z: number, w: number) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
	}

	times(other: Quaternion): Quaternion {
		return new Quaternion(this.x * other.x - this.y * other.y - this.z * other.z - this.w * other.w,
			this.x * other.y + other.x * this.y + this.z * other.w - other.z * this.w,
			this.x * other.z + other.x * this.z + this.w * other.y - other.w * this.y,
			this.x * other.w + other.x * this.w + this.y * other.z - other.y * this.z);
	}

	toMatrix(): Matrix4 {
		return new Matrix4([
			1 - 2 * Math.pow(this.z, 2) - 2 * Math.pow(this.w, 2), 2 * this.y * this.z - 2 * this.w * this.x, 2 * this.y * this.w + 2 * this.z * this.x, 0,
			2 * this.y * this.z + 2 * this.w * this.x, 1 - 2 * Math.pow(this.y, 2) - 2 * Math.pow(this.w, 2), 2 * this.z * this.w - 2 * this.y * this.x, 0,
			2 * this.y * this.w - 2 * this.z * this.x, 2 * this.z * this.w + 2 * this.y * this.x, 1 - 2 * Math.pow(this.y, 2) - 2 * Math.pow(this.z, 2), 0,
			0, 0, 0, 1
		]);
	}

	static euler(angles: Vector3): Quaternion {
		return Quaternion.angleAxis(angles.z, new Vector3(0, 0, 1))
			.times(Quaternion.angleAxis(angles.y, new Vector3(0, 1, 0)))
			.times(Quaternion.angleAxis(angles.x, new Vector3(1, 0, 0)));
	}

	static angleAxis(angle: number, axis: Vector3): Quaternion {
		let theta_half = angle * DEG_TO_RAD * 0.5;
		return new Quaternion(Math.cos(theta_half), axis.x * Math.sin(theta_half), axis.y * Math.sin(theta_half), axis.z * Math.sin(theta_half));
	}

	static identity(): Quaternion {
		return new Quaternion(1, 0, 0, 0);
	}
}