const ARROW_RADIUS_INNER = 0.05;
const ARROW_RADIUS_OUTER = 0.15;
const ARROW_LENGTH = 0.35;
const ARROW_TIP = 0.15;

const HANDLE_DISTANCE = 0.5;

const GRAB_RADIUS = 0.1;
const GRAB_START = 0.4;
const GRAB_END = 1.1;

const UNSELECTED_ALPHA = 0.5;

enum Axis {
	None,
	X,
	Y,
	Z
}

class Handles implements Renderer {
	private xNegative: MeshRenderer;
	private xPositive: MeshRenderer;
	private yNegative: MeshRenderer;
	private yPositive: MeshRenderer;
	private zNegative: MeshRenderer;
	private zPositive: MeshRenderer;
	private meshRenderers: MeshRenderer[] = [];

	private position: Vector3;
	private block: Vector3;
	private camera: Camera;

	private handleAlpha: Vector3 = Vector3.one().times(UNSELECTED_ALPHA);

	private grabbedAxis: Axis = Axis.None;
	private grabbedPosition: number;

	visible: boolean = true;
	
	private box: WireframeBox;

	private fullSize: boolean = true;
	private orientation: Orientation = Orientation.X;
	private size: Vector3;

	private createRenderer(mesh: Mesh, color: Vector3): MeshRenderer {
		let renderer = new MeshRenderer();
		renderer.setMesh(mesh);
		renderer.color = color;
		this.meshRenderers.push(renderer);
		return renderer;
	}

	private getBlockCenter(block: Vector3): Vector3 {
		if (this.fullSize) {
			return this.block.plus(Vector3.one()).times(0.5);
		} else {
			return this.block.plus(Vector3.one()).times(0.5).minus(FORWARD[this.orientation].times(0.25));
		}
	}

	private getBlock(worldPosition: Vector3): Vector3 {
		if (this.fullSize) {
			return worldPosition.times(2).minus(Vector3.one().times(0.5)).floor();
		} else {
			return worldPosition.times(2).minus(Vector3.one().minus(FORWARD[this.orientation]).times(0.5)).floor();
		}
	}

	constructor(camera: Camera) {
		this.box = new WireframeBox();
		let mesh = Handles.getArrowMesh(20);

		this.xNegative = this.createRenderer(mesh, new Vector3(1, 0, 0));
		this.xPositive = this.createRenderer(mesh, new Vector3(1, 0, 0));
		this.yNegative = this.createRenderer(mesh, new Vector3(0, 1, 0));
		this.yPositive = this.createRenderer(mesh, new Vector3(0, 1, 0));
		this.zNegative = this.createRenderer(mesh, new Vector3(0, 0, 1));
		this.zPositive = this.createRenderer(mesh, new Vector3(0, 0, 1));
		
		this.block = Vector3.zero();
		this.setMode(true, Orientation.X, false);
		this.camera = camera;
	}

	public render(camera: Camera) {
		if (!this.visible) {
			return;
		}

		this.box.render(camera);

		this.xPositive.alpha = this.handleAlpha.x;
		this.xNegative.alpha = this.handleAlpha.x;
		this.yPositive.alpha = this.handleAlpha.y;
		this.yNegative.alpha = this.handleAlpha.y;
		this.zPositive.alpha = this.handleAlpha.z;
		this.zNegative.alpha = this.handleAlpha.z;

		gl.colorMask(false, false, false, false);
		gl.depthFunc(gl.ALWAYS);
		for (let renderer of this.meshRenderers) {
			renderer.render(camera);
		}
		gl.depthFunc(gl.LEQUAL);
		for (let renderer of this.meshRenderers) {
			renderer.render(camera);
		}
		gl.colorMask(true, true, true, true);
		for (let renderer of this.meshRenderers) {
			renderer.render(camera);
		}
	}

	public updateTransforms() {
		this.xPositive.transform = Quaternion.euler(new Vector3(0, -90, 0)).toMatrix()
			.times(Matrix4.getTranslation(this.position.plus(new Vector3(this.size.x * HANDLE_DISTANCE, 0, 0))));
		this.xNegative.transform = Quaternion.euler(new Vector3(0, 90, 0)).toMatrix()
			.times(Matrix4.getTranslation(this.position.plus(new Vector3(this.size.x * -HANDLE_DISTANCE, 0, 0))));
		this.yPositive.transform = Quaternion.euler(new Vector3(90, 0, 0)).toMatrix()
			.times(Matrix4.getTranslation(this.position.plus(new Vector3(0, this.size.y * HANDLE_DISTANCE, 0))));
		this.yNegative.transform = Quaternion.euler(new Vector3(-90, 0, 0)).toMatrix()
			.times(Matrix4.getTranslation(this.position.plus(new Vector3(0, this.size.y * -HANDLE_DISTANCE, 0))));
		this.zPositive.transform = Matrix4.getTranslation(this.position.plus(new Vector3(0, 0, this.size.z * HANDLE_DISTANCE)));
		this.zNegative.transform = Quaternion.euler(new Vector3(180, 0, 0)).toMatrix()
			.times(Matrix4.getTranslation(this.position.plus(new Vector3(0, 0, this.size.z * -HANDLE_DISTANCE))));
			
		this.box.transform = Matrix4.getTranslation(this.getBlockCenter(this.block));
		this.box.scale = this.size.times(0.5);
	}

	private static getVector(angle: number, radius: number, z: number): Vector3 {
		return new Vector3(radius * Math.cos(angle), radius * Math.sin(angle), z);
	}
	
	public static getArrowMesh(subdivisions: number): Mesh {
		let triangles: Triangle[] = [];

		for (let i = 0; i < subdivisions; i++) {
			let angle1 = i / subdivisions * 2 * Math.PI;
			let angle2 = (i + 1) / subdivisions * 2 * Math.PI;

			// Base
			triangles.push(new Triangle(Handles.getVector(angle1, ARROW_RADIUS_INNER, 0), Vector3.zero(), Handles.getVector(angle2, ARROW_RADIUS_INNER, 0)));
			// Side
			triangles.push(new TriangleWithNormals(
				Handles.getVector(angle1, ARROW_RADIUS_INNER, 0),
				Handles.getVector(angle2, ARROW_RADIUS_INNER, 0),
				Handles.getVector(angle2, ARROW_RADIUS_INNER, ARROW_LENGTH),
				Handles.getVector(angle1, 1, 0).times(-1),
				Handles.getVector(angle2, 1, 0).times(-1),
				Handles.getVector(angle2, 1, 0).times(-1)));
			triangles.push(new TriangleWithNormals(
				Handles.getVector(angle1, ARROW_RADIUS_INNER, ARROW_LENGTH),
				Handles.getVector(angle1, ARROW_RADIUS_INNER, 0),
				Handles.getVector(angle2, ARROW_RADIUS_INNER, ARROW_LENGTH),
				Handles.getVector(angle1, 1, 0).times(-1),
				Handles.getVector(angle1, 1, 0).times(-1),
				Handles.getVector(angle2, 1, 0).times(-1)));
			// Tip base
			triangles.push(new Triangle(
				Handles.getVector(angle1, ARROW_RADIUS_INNER, ARROW_LENGTH),
				Handles.getVector(angle2, ARROW_RADIUS_INNER, ARROW_LENGTH),
				Handles.getVector(angle2, ARROW_RADIUS_OUTER, ARROW_LENGTH)));
			triangles.push(new Triangle(
				Handles.getVector(angle1, ARROW_RADIUS_OUTER, ARROW_LENGTH),
				Handles.getVector(angle1, ARROW_RADIUS_INNER, ARROW_LENGTH),
				Handles.getVector(angle2, ARROW_RADIUS_OUTER, ARROW_LENGTH)));
			// Tip
			let alpha = Math.tan(ARROW_TIP / ARROW_RADIUS_OUTER);

			triangles.push(new TriangleWithNormals(
				new Vector3(0, 0, ARROW_LENGTH + ARROW_TIP),
				Handles.getVector(angle1, ARROW_RADIUS_OUTER, ARROW_LENGTH),
				Handles.getVector(angle2, ARROW_RADIUS_OUTER, ARROW_LENGTH),
				Handles.getVector(angle1, -Math.sin(alpha), -Math.cos(alpha)),
				Handles.getVector(angle1, -Math.sin(alpha), -Math.cos(alpha)),
				Handles.getVector(angle2, -Math.sin(alpha), -Math.cos(alpha))));
		}

		return new Mesh(triangles);
	}

	private getRay(axis: Axis): Ray {
		switch (axis) {
			case Axis.X:
				return new Ray(this.position, new Vector3(1, 0, 0));
			case Axis.Y:
				return new Ray(this.position, new Vector3(0, 1, 0));
			case Axis.Z:
				return new Ray(this.position, new Vector3(0, 0, 1));
		}
		throw new Error("Unknown axis: " + axis);
	}

	private getMouseHandle(event: MouseEvent): [Axis, number] {
		var mouseRay = this.camera.getScreenToWorldRay(event);
		for (let axis of [Axis.X, Axis.Y, Axis.Z]) {
			var axisRay = this.getRay(axis);
			if (mouseRay.getDistanceToRay(axisRay) < GRAB_RADIUS) {
				var position = axisRay.getClosestToRay(mouseRay);
				if (Math.abs(position) > GRAB_START && Math.abs(position) < GRAB_END) {
					return [axis, position];
				}
			}
		}
		return [Axis.None, 0];
	}

	public onMouseDown(event: MouseEvent): boolean {
		var handleData = this.getMouseHandle(event);
		this.grabbedAxis = handleData[0];
		this.grabbedPosition = handleData[1];		
		return this.grabbedAxis != Axis.None;
	}

	public onMouseMove(event: MouseEvent) {
		if (this.grabbedAxis != Axis.None) {
			var mouseRay = this.camera.getScreenToWorldRay(event);
			var axisRay = this.getRay(this.grabbedAxis);
			var mousePosition = axisRay.getClosestToRay(mouseRay);

			this.position = this.position.plus(axisRay.direction.times(mousePosition - this.grabbedPosition));			
			this.block = this.getBlock(this.position);
			this.updateTransforms();
			this.camera.render();
		} else {
			var axis = this.getMouseHandle(event)[0];
			var newAlpha = new Vector3(axis == Axis.X ? 1 : UNSELECTED_ALPHA, axis == Axis.Y ? 1 : UNSELECTED_ALPHA, axis == Axis.Z ? 1 : UNSELECTED_ALPHA);
			if (!newAlpha.equals(this.handleAlpha)) {
				this.handleAlpha = newAlpha;
				this.camera.render();
			}
		}
	}

	public onMouseUp() {
		if (this.grabbedAxis != Axis.None) {
			this.grabbedAxis = Axis.None;
			this.animatePositionAndSize(this.getBlockCenter(this.block), this.size, false, 100);
		}
	}

	public getSelectedBlock(): Vector3 {
		return this.block;
	}

	public setMode(fullSize: boolean, orientation: Orientation, animate: boolean = true) {
		if (this.fullSize == fullSize && this.orientation == orientation && animate) {
			return;
		}

		switch (orientation) {
			case Orientation.X:
				this.box.color = new Vector3(1.0, 0.0, 0.0);
				break;
			case Orientation.Y:
				this.box.color = new Vector3(0.0, 0.8, 0.0);
				break;
			case Orientation.Z:
				this.box.color = new Vector3(0.0, 0.0, 1.0);
				break;
		}
		
		this.fullSize = fullSize;
		this.orientation = orientation;

		var targetPosition = this.getBlockCenter(this.block);
		var targetSize = Vector3.one();
		if (!this.fullSize) {
			targetSize = targetSize.minus(FORWARD[this.orientation].times(0.5));
		}
		
		if (!animate) {
			this.position = targetPosition;
			this.size = Vector3.one();
			this.updateTransforms();
			return;
		}

		this.animatePositionAndSize(targetPosition, targetSize);
	}

	private animatePositionAndSize(targetPosition: Vector3, targetSize: Vector3, animateBox: boolean = true, time = 300) {
		var startPosition = this.position;
		var startSize = this.size;

		var start = new Date().getTime();
		var end = start + time;
		var handles = this;

		function callback() {
			var progress = ease(Math.min(1.0, (new Date().getTime() - start) / (end - start)));
			handles.position = Vector3.lerp(startPosition, targetPosition, progress);
			handles.size = Vector3.lerp(startSize, targetSize, progress);
			handles.updateTransforms();
			if (animateBox) {
				handles.box.transform = Matrix4.getTranslation(handles.position);
			}
			handles.camera.render();
			if (progress < 1.0) {
				window.requestAnimationFrame(callback);
			}
		}
		window.requestAnimationFrame(callback)
	}
}