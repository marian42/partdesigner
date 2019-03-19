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

	public invert(): Matrix4 {
		// based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
		// via https://github.com/mrdoob/three.js/blob/dev/src/math/Matrix4.js
		var el: NumberArray16 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],

		n11 = this.elements[ 0 ], n21 = this.elements[ 1 ], n31 = this.elements[ 2 ], n41 = this.elements[ 3 ],
		n12 = this.elements[ 4 ], n22 = this.elements[ 5 ], n32 = this.elements[ 6 ], n42 = this.elements[ 7 ],
		n13 = this.elements[ 8 ], n23 = this.elements[ 9 ], n33 = this.elements[ 10 ], n43 = this.elements[ 11 ],
		n14 = this.elements[ 12 ], n24 = this.elements[ 13 ], n34 = this.elements[ 14 ], n44 = this.elements[ 15 ],

		t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44,
		t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44,
		t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44,
		t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

		var det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

		if (det == 0) {
			throw new Error("Warning: Trying to invert matrix with determinant zero.");
		}

		var detInv = 1 / det;

		el[ 0 ] = t11 * detInv;
		el[ 1 ] = ( n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44 ) * detInv;
		el[ 2 ] = ( n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44 ) * detInv;
		el[ 3 ] = ( n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43 ) * detInv;

		el[ 4 ] = t12 * detInv;
		el[ 5 ] = ( n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44 ) * detInv;
		el[ 6 ] = ( n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44 ) * detInv;
		el[ 7 ] = ( n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43 ) * detInv;

		el[ 8 ] = t13 * detInv;
		el[ 9 ] = ( n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44 ) * detInv;
		el[ 10 ] = ( n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44 ) * detInv;
		el[ 11 ] = ( n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43 ) * detInv;

		el[ 12 ] = t14 * detInv;
		el[ 13 ] = ( n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34 ) * detInv;
		el[ 14 ] = ( n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34 ) * detInv;
		el[ 15 ] = ( n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33 ) * detInv;

		return new Matrix4(el);
	}

	public transformPoint(point: Vector3): Vector3 {
		return new Vector3(
			point.x * this.elements[0] + point.y * this.elements[4] + point.z * this.elements[8] + this.elements[12],
			point.x * this.elements[1] + point.y * this.elements[5] + point.z * this.elements[9] + this.elements[13],
			point.x * this.elements[2] + point.y * this.elements[6] + point.z * this.elements[10] + this.elements[14]);
	}

	public transformDirection(point: Vector3): Vector3 {
		return new Vector3(
			point.x * this.elements[0] + point.y * this.elements[4] + point.z * this.elements[8],
			point.x * this.elements[1] + point.y * this.elements[5] + point.z * this.elements[9],
			point.x * this.elements[2] + point.y * this.elements[6] + point.z * this.elements[10]);
	}

	public static getProjection(near = 0.1, far = 1000, fov = 25): Matrix4 {
		let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
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