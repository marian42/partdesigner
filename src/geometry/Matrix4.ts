type NumberArray16 = [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number];

class Matrix4 {
	elements: NumberArray16;

	constructor(elements: NumberArray16) {
		this.elements = elements;
	}

	get(i: number, j: number): number {
		return this.elements[4 * i + j];
	}

	public times(other: Matrix4): Matrix4 {
		let result: number[] = [];

		for (var i = 0; i < 4; i++) {
			for (var j = 0; j < 4; j++) {
				let element = 0;
				for (var k = 0; k < 4; k++) {
					element += this.get(i, k) * other.get(k, j);
				}
				result.push(element);
			}
		}

		return new Matrix4(result as NumberArray16);
	}

	public transpose() {
		return new Matrix4([
			this.elements[0], this.elements[4], this.elements[8], this.elements[12],
			this.elements[1], this.elements[5], this.elements[9], this.elements[13],
			this.elements[2], this.elements[6], this.elements[10], this.elements[14],
			this.elements[3], this.elements[7], this.elements[10], this.elements[15]
		]);
	}

	public static getProjection(near = 0.1, far = 1000, fov = 45): Matrix4 {
		let aspectRatio = gl.canvas.width / gl.canvas.height;
        return new Matrix4([
            1 / (Math.tan(fov * DEG_TO_RAD / 2) * aspectRatio), 0, 0, 0,
            0, 1 / Math.tan(fov * DEG_TO_RAD / 2), 0, 0,
            0, 0, -(far + near)/(far - near), -1,
            0, 0, -0.2, 0
        ]);
	}

	public static getIdentity(): Matrix4 {
		return new Matrix4([
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		]);
	}
	
	public static getTranslation(vector: Vector3): Matrix4 {
		return new Matrix4([
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			vector.x, vector.y, vector.z, 1
		]);
	}

	public static getRotation(euler: Vector3): Matrix4 {
		let phi = euler.x * DEG_TO_RAD;
		let theta = euler.y * DEG_TO_RAD;
		let psi = euler.z * DEG_TO_RAD;
		let sin = Math.sin;
		let cos = Math.cos;
		return new Matrix4([
			cos(theta) * cos(phi), -cos(psi) * sin(phi) + sin(psi) * sin(theta) * cos(phi), sin(psi) * sin(phi) + cos(psi) * sin(theta) * cos(phi), 0,
			cos(theta) * sin(phi), cos(psi)*cos(phi) + sin(psi) * sin(theta) * sin(phi), -sin(psi) * cos(phi) + cos(psi) * sin(theta) * sin(phi), 0,
			-sin(theta), sin(psi) * cos(theta), cos(psi) * cos(theta), 0,
			0, 0, 0, 1
		]);
	}
}