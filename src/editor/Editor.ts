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
	zoom: number = 5;
	zoomStep = 0.93;

	mouseMode = MouseMode.None;
	lastMousePosition: [number, number];

	handles: Handles;

	constructor() {
		this.part = new Part();
		this.part.randomize();
		console.log(this.part.toString());

		this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
		this.camera = new Camera(this.canvas);
		
		this.meshRenderer = new MeshRenderer();
		this.meshRenderer.color = new Vector3(0.6, 0.6, 0.6);
		this.camera.renderers.push(this.meshRenderer);

		this.handles = new Handles(this.camera);
		this.camera.renderers.push(this.handles);

		this.updateMesh();
		this.camera.render();

		this.canvas.addEventListener("mousedown", (event: MouseEvent) => this.onMouseDown(event));
		this.canvas.addEventListener("mouseup", (event: MouseEvent) => this.onMouseUp(event));
		this.canvas.addEventListener("mousemove", (event: MouseEvent) => this.onMouseMove(event));
		this.canvas.addEventListener("contextmenu", (event: Event) => event.preventDefault());
		this.canvas.addEventListener("wheel", (event: MouseWheelEvent) => this.onScroll(event));
	}

	updateMesh() {
		let mesh = new PartMeshGenerator(this.part).getMesh();
		this.meshRenderer.setMesh(mesh);
		this.center = this.part.getCenter().times(-0.5);
		this.handles.position = this.center.times(-1);
		this.handles.updateTransforms();
		this.updateTransform();
	}

	updateTransform() {
		this.camera.transform = 
			Matrix4.getTranslation(this.center)
			.times(this.rotation.toMatrix())
			.times(Matrix4.getTranslation(this.translation.plus(new Vector3(0, 0, -this.zoom))));
	}

	onMouseDown(event: MouseEvent) {
		switch(event.button) {
			case 0: 
				if (this.handles.onMouseDown(event)) {
					this.mouseMode = MouseMode.Left;
				}
				break;
			case 1: this.mouseMode = MouseMode.Middle; break;
			case 2: this.mouseMode = MouseMode.Right; break;
		}
		event.preventDefault();
	}

	onMouseUp(event: MouseEvent) {
		this.mouseMode = MouseMode.None;
		this.handles.onMouseUp();
		event.preventDefault();
	}

	onMouseMove(event: MouseEvent) {
		switch (this.mouseMode) {
			case MouseMode.Left:
				this.handles.onMouseMove(event);
				break;
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

	onScroll(event: MouseWheelEvent) {
		this.zoom *= event.deltaY < 0 ? this.zoomStep : 1 / this.zoomStep;
		this.updateTransform();
		this.camera.render();
	}
}