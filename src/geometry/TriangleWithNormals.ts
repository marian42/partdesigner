class TriangleWithNormals extends Triangle {
	n1: Vector3;
	n2: Vector3;
	n3: Vector3;

	constructor(v1: Vector3, v2: Vector3, v3: Vector3, n1: Vector3, n2: Vector3, n3: Vector3) {
		super(v1, v2, v3);
		this.n1 = n1;
		this.n2 = n2;
		this.n3 = n3;
	}
}