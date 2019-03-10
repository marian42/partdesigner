const ARROW_RADIUS_INNER = 0.05;
const ARROW_RADIUS_OUTER = 0.15;
const ARROW_LENGTH = 0.35;
const ARROW_TIP = 0.15;

const ARROW_DISTANCE = 0.5;

class Arrows implements Renderer {
	xNegative: MeshRenderer;
	xPositive: MeshRenderer;
	yNegative: MeshRenderer;
	yPositive: MeshRenderer;
	zNegative: MeshRenderer;
	zPositive: MeshRenderer;
	meshRenderers: MeshRenderer[] = [];

	position: Vector3;
	camera: Camera;

	private createRenderer(mesh: Mesh, color: Vector3): MeshRenderer {
		let renderer = new MeshRenderer();
		renderer.setMesh(mesh);
		renderer.color = color;
		this.meshRenderers.push(renderer);
		return renderer;
	}

	constructor(camera: Camera) {
		let mesh = Arrows.getMesh(20);

		this.xNegative = this.createRenderer(mesh, new Vector3(1, 0, 0));
		this.xPositive = this.createRenderer(mesh, new Vector3(1, 0, 0));
		this.yNegative = this.createRenderer(mesh, new Vector3(0, 1, 0));
		this.yPositive = this.createRenderer(mesh, new Vector3(0, 1, 0));
		this.zNegative = this.createRenderer(mesh, new Vector3(0, 0, 1));
		this.zPositive = this.createRenderer(mesh, new Vector3(0, 0, 1));

		this.position = Vector3.zero();
		this.updateTransforms();
		this.camera = camera;
	}

	public render(camera: Camera) {
		gl.depthFunc(gl.ALWAYS);
		for (let renderer of this.meshRenderers) {
			renderer.render(camera);
		}
		gl.depthFunc(gl.LESS);
		for (let renderer of this.meshRenderers) {
			renderer.render(camera);
		}
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

	test(event: MouseEvent) {
		var ray = this.camera.getScreenToWorldRay(event.x, event.y);
		var xRay = new Ray(this.position, new Vector3(1, 0, 0));

		this.xPositive.transform = Quaternion.euler(new Vector3(0, -90, 0)).toMatrix()
			.times(Matrix4.getTranslation(xRay.get(xRay.getClosestToRay(ray))));

		console.log(ray.getDistanceToRay(xRay));
		this.camera.render();
	}
}