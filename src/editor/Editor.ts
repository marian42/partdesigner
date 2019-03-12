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
	zoom: number = 20;
	zoomStep = 0.93;

	mouseMode = MouseMode.None;
	lastMousePosition: [number, number];

	handles: Handles;

	editorState: Block;
	createFullSizedBlocks: boolean;

	constructor() {
		this.part = new Part();
		this.part.randomize();

		this.editorState = new Block(Orientation.X, BlockType.PinHole, true);
		this.createFullSizedBlocks = true;

		this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
		this.camera = new Camera(this.canvas);
		
		this.meshRenderer = new MeshRenderer();
		this.meshRenderer.color = new Vector3(0.6, 0.6, 0.6);
		this.camera.renderers.push(this.meshRenderer);

		this.handles = new Handles(this.camera);
		this.camera.renderers.push(this.handles);
		this.center = this.part.getCenter().times(-0.5);

		this.updateMesh();
		this.updateTransform();
		this.camera.render();

		this.canvas.addEventListener("mousedown", (event: MouseEvent) => this.onMouseDown(event));
		this.canvas.addEventListener("mouseup", (event: MouseEvent) => this.onMouseUp(event));
		this.canvas.addEventListener("mousemove", (event: MouseEvent) => this.onMouseMove(event));
		this.canvas.addEventListener("contextmenu", (event: Event) => event.preventDefault());
		this.canvas.addEventListener("wheel", (event: MouseWheelEvent) => this.onScroll(event));
		document.getElementById("clear").addEventListener("click", (event: MouseEvent) => this.clear());
		document.getElementById("randomize").addEventListener("click", (event: MouseEvent) => this.randomize());
		document.getElementById("save").addEventListener("click", (event: MouseEvent) => new PartMeshGenerator(this.part).getMesh().saveSTLFile());
		document.getElementById("remove").addEventListener("click", (event: MouseEvent) => this.remove());

		this.initializeEditor("type", (typeName: string) => this.setType(typeName));
		this.initializeEditor("orientation", (orientationName: string) => this.setOrientation(orientationName));
		this.initializeEditor("size", (sizeName: string) => this.setSize(sizeName));
		this.initializeEditor("rounded", (roundedName: string) => this.setRounded(roundedName));
	}

	private initializeEditor(elementId: string, onchange: (value: string) => void) {
		var element = document.getElementById(elementId);
		for (var i = 0; i < element.children.length; i++) {
			var child = element.children[i];
			if (child.tagName.toLowerCase() == "label") {				
				child.addEventListener("click", (event: Event) => onchange(((event.target as HTMLElement).previousElementSibling as HTMLInputElement).value));
			}
		}
	}

	private clear() {
		this.part.blocks.clear();
		this.updateMesh();
	}

	private randomize() {
		this.part.randomize();
		this.updateMesh();
	}

	private remove() {
		this.part.clearBlock(this.handles.block, Orientation.X);
		this.updateMesh();
	}

	private setType(typeName: string) {
		this.editorState.type = BLOCK_TYPE[typeName];
		this.updateBlock();
	}

	private setOrientation(orientatioName: string) {
		this.editorState.orientation = ORIENTATION[orientatioName];
		this.updateBlock();
	}

	private setSize(sizeName: string) {
		this.createFullSizedBlocks = sizeName == "full";
		this.updateBlock();
	}

	private setRounded(roundedName: string) {
		this.editorState.rounded = roundedName == "true";
		this.updateBlock();
	}

	private updateBlock() {
		this.part.placeBlockForced(this.handles.block, new Block(this.editorState.orientation, this.editorState.type, this.editorState.rounded));
		if (this.createFullSizedBlocks) {
			this.part.placeBlockForced(this.handles.block.plus(forward(this.editorState.orientation)),
				new Block(this.editorState.orientation, this.editorState.type, this.editorState.rounded));
		}
		this.updateMesh();
	}

	private updateMesh() {
		let mesh = new PartMeshGenerator(this.part).getMesh();
		this.meshRenderer.setMesh(mesh);
		this.handles.updateTransforms();
		this.camera.render();
		console.log(this.part.toString());
	}

	private updateTransform() {
		this.camera.transform = 
			Matrix4.getTranslation(this.center)
			.times(this.rotation.toMatrix())
			.times(Matrix4.getTranslation(this.translation.plus(new Vector3(0, 0, -this.zoom))));
	}

	private onMouseDown(event: MouseEvent) {
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

	private onMouseUp(event: MouseEvent) {
		this.mouseMode = MouseMode.None;
		this.handles.onMouseUp();
		event.preventDefault();
	}

	private onMouseMove(event: MouseEvent) {
		switch (this.mouseMode) {
			case MouseMode.None:
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

	private onScroll(event: MouseWheelEvent) {
		this.zoom *= event.deltaY < 0 ? this.zoomStep : 1 / this.zoomStep;
		this.updateTransform();
		this.camera.render();
	}
}