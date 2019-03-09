const ARROW_RADIUS_INNER = 0.05;
const ARROW_RADIUS_OUTER = 0.15;
const ARROW_LENGTH = 0.35;
const ARROW_TIP = 0.15;

const ARROW_DISTANCE = 0.5;

class Arrows {
	xNegative: MeshRenderer;
	xPositive: MeshRenderer;
	yNegative: MeshRenderer;
	yPositive: MeshRenderer;
	zNegative: MeshRenderer;
	zPositive: MeshRenderer;

	position: Vector3;


	constructor(camera: Camera) {
		let mesh = Arrows.getMesh(20);

		this.xNegative = new MeshRenderer();
		this.xNegative.setMesh(mesh);
		this.xNegative.color = new Vector3(1, 0, 0);
		camera.renderers.push(this.xNegative);
		this.xPositive = new MeshRenderer();
		this.xPositive.setMesh(mesh);
		this.xPositive.color = this.xNegative.color;
		camera.renderers.push(this.xPositive);
		
		this.yNegative = new MeshRenderer();
		this.yNegative.setMesh(mesh);
		this.yNegative.color = new Vector3(0, 1, 0);
		camera.renderers.push(this.yNegative);
		this.yPositive = new MeshRenderer();
		this.yPositive.setMesh(mesh);
		this.yPositive.color = this.yNegative.color;
		camera.renderers.push(this.yPositive);
		
		this.zNegative = new MeshRenderer();
		this.zNegative.setMesh(mesh);
		this.zNegative.color = new Vector3(0, 0, 1);
		camera.renderers.push(this.zNegative);
		this.zPositive = new MeshRenderer();
		this.zPositive.setMesh(mesh);
		this.zPositive.color = this.zNegative.color;
		camera.renderers.push(this.zPositive);

		this.position = Vector3.zero();
		this.updateTransforms();
	}

	public updateTransforms() {
		this.xPositive.transform = Quaternion.euler(new Vector3(0, -90, 0)).toMatrix()
			.times(Matrix4.getTranslation(this.position.plus(new Vector3(ARROW_DISTANCE, 0, 0))));
		this.xNegative.transform = Quaternion.euler(new Vector3(0, 90, 0)).toMatrix()
			.times(Matrix4.getTranslation(this.position.plus(new Vector3(-ARROW_DISTANCE, 0, 0))));
		this.yPositive.transform = Quaternion.euler(new Vector3(90, 0, 0)).toMatrix()
			.times(Matrix4.getTranslation(this.position.plus(new Vector3(0, ARROW_DISTANCE, 0))));
		this.yNegative.transform = Quaternion.euler(new Vector3(-90, 0, 0)).toMatrix()
			.times(Matrix4.getTranslation(this.position.plus(new Vector3(0, -ARROW_DISTANCE, 0))));
		this.zPositive.transform = Matrix4.getTranslation(this.position.plus(new Vector3(0, 0, ARROW_DISTANCE)));
		this.zNegative.transform = Quaternion.euler(new Vector3(180, 0, 0)).toMatrix()
			.times(Matrix4.getTranslation(this.position.plus(new Vector3(0, 0, -ARROW_DISTANCE))));		
	}

	private static getVector(angle: number, radius: number, z: number): Vector3 {
		return new Vector3(radius * Math.cos(angle), radius * Math.sin(angle), z);
	}
	
	public static getMesh(subdivisions: number): Mesh {
		let triangles: Triangle[] = [];

		for (let i = 0; i < subdivisions; i++) {
			let angle1 = i / subdivisions * 2 * Math.PI;
			let angle2 = (i + 1) / subdivisions * 2 * Math.PI;

			// Base
			triangles.push(new Triangle(Arrows.getVector(angle1, ARROW_RADIUS_INNER, 0), Vector3.zero(), Arrows.getVector(angle2, ARROW_RADIUS_INNER, 0)));
			// Side
			triangles.push(new Triangle(
				Arrows.getVector(angle1, ARROW_RADIUS_INNER, 0),
				Arrows.getVector(angle2, ARROW_RADIUS_INNER, 0),
				Arrows.getVector(angle2, ARROW_RADIUS_INNER, ARROW_LENGTH)));
			triangles.push(new Triangle(
				Arrows.getVector(angle1, ARROW_RADIUS_INNER, ARROW_LENGTH),
				Arrows.getVector(angle1, ARROW_RADIUS_INNER, 0),
				Arrows.getVector(angle2, ARROW_RADIUS_INNER, ARROW_LENGTH)));
			// Tip base
			triangles.push(new Triangle(
				Arrows.getVector(angle1, ARROW_RADIUS_INNER, ARROW_LENGTH),
				Arrows.getVector(angle2, ARROW_RADIUS_INNER, ARROW_LENGTH),
				Arrows.getVector(angle2, ARROW_RADIUS_OUTER, ARROW_LENGTH)));
			triangles.push(new Triangle(
				Arrows.getVector(angle1, ARROW_RADIUS_OUTER, ARROW_LENGTH),
				Arrows.getVector(angle1, ARROW_RADIUS_INNER, ARROW_LENGTH),
				Arrows.getVector(angle2, ARROW_RADIUS_OUTER, ARROW_LENGTH)));
			// Tip
			triangles.push(new Triangle(
				new Vector3(0, 0, ARROW_LENGTH + ARROW_TIP),
				Arrows.getVector(angle1, ARROW_RADIUS_OUTER, ARROW_LENGTH),
				Arrows.getVector(angle2, ARROW_RADIUS_OUTER, ARROW_LENGTH)));
		}

		return new Mesh(triangles);
	}
}