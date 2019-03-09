enum MouseMode {
	None,
	Left,
	Middle,
	Right
}

class Editor {
	camera: Camera;
	meshRenderer: MeshRenderer;
	part: Part;
	canvas: HTMLCanvasElement;

	translation: Vector3 = new Vector3(0, 0, 0);
	center: Vector3;
	rotation: Quaternion = Quaternion.identity();

	mouseMode = MouseMode.None;
	lastMousePosition: [number, number];

	constructor() {
		this.part = new Part();
		this.part.randomize();
		console.log(this.part.toString());

		this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
		this.camera = new Camera(this.canvas);
		
		this.meshRenderer = new MeshRenderer();
		this.camera.renderers.push(this.meshRenderer);
		this.updateMesh();
		this.camera.render();

		this.canvas.addEventListener("mousedown", (event: MouseEvent) => this.onMouseDown(event));
		this.canvas.addEventListener("mouseup", (event: MouseEvent) => this.onMouseUp(event));
		this.canvas.addEventListener("mousemove", (event: MouseEvent) => this.onMouseMove(event));
		this.canvas.addEventListener("contextmenu", (event: Event) => event.preventDefault());
	}

	updateMesh() {
		let mesh = new PartMeshGenerator(this.part).getMesh();
		this.meshRenderer.setMesh(mesh);
		this.center = this.part.getCenter().times(-0.5);
		this.updateTransform();
	}

	updateTransform() {
		this.meshRenderer.transform = 
			Matrix4.getTranslation(this.center)
			.times(this.rotation.toMatrix())
			.times(Matrix4.getTranslation(this.translation));
	}

	onMouseDown(event: MouseEvent) {
		switch(event.button) {
			case 0: this.mouseMode = MouseMode.Left; break;
			case 1: this.mouseMode = MouseMode.Middle; break;
			case 2: this.mouseMode = MouseMode.Right; break;
		}
		event.preventDefault();
	}

	onMouseUp(event: MouseEvent) {
		this.mouseMode = MouseMode.None;
		event.preventDefault();
	}

	onMouseMove(event: MouseEvent) {
		switch (this.mouseMode) {
			case MouseMode.Middle:
				this.translation = this.translation.plus(new Vector3(event.movementX, -event.movementY, 0).times(0.01));
				this.updateTransform();
				this.camera.render();
				break;
			case MouseMode.Right:
				this.rotation = this.rotation.times(Quaternion.euler(new Vector3(-event.movementY * 0.5, -event.movementX * 0.5, 0)));
				this.updateTransform();
				this.camera.render();
				break;
		}
	}
}