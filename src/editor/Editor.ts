enum MouseMode {
	None,
	Left,
	Middle,
	Right
}

class Editor {
	camera: Camera;
	partRenderer: MeshRenderer;
	partNormalDepthRenderer: NormalDepthRenderer;
	contourEffect: ContourPostEffect;
	wireframeRenderer: WireframeRenderer;
	part: Part;
	canvas: HTMLCanvasElement;

	translation: Vector3 = new Vector3(0, 0, 0);
	center: Vector3;
	rotationX: number = 45;
	rotationY: number = -20;
	zoom: number = 5;
	zoomStep = 0.9;

	mouseMode = MouseMode.None;
	lastMousePosition: [number, number];

	handles: Handles;

	editorState: Block;
	createFullSizedBlocks: boolean;

	style: RenderStyle = RenderStyle.Contour;

	measurements: Measurements = new Measurements();

	constructor() {
		var url = new URL(document.URL);
		if (url.searchParams.has("part")) {
			this.part = Part.fromString(url.searchParams.get("part"));
		} else {
			this.part = Part.fromString(catalog.items[Math.floor(Math.random() * catalog.items.length)].string);
		}

		this.editorState = new Block(Orientation.X, BlockType.PinHole, true);
		this.createFullSizedBlocks = true;

		this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
		this.camera = new Camera(this.canvas);
		
		this.partRenderer = new MeshRenderer();
		this.partRenderer.color = new Vector3(0.67, 0.7, 0.71);
		this.camera.renderers.push(this.partRenderer);

		this.wireframeRenderer = new WireframeRenderer();
		this.wireframeRenderer.enabled = false;
		this.camera.renderers.push(this.wireframeRenderer);

		this.partNormalDepthRenderer = new NormalDepthRenderer();
		this.camera.renderers.push(this.partNormalDepthRenderer);

		this.contourEffect = new ContourPostEffect();
		this.camera.renderers.push(this.contourEffect);

		this.handles = new Handles(this.camera);
		this.camera.renderers.push(this.handles);

		this.center = Vector3.zero();
		this.updateMesh(true);
		this.camera.size = this.zoom;
		this.camera.render();

		this.canvas.addEventListener("mousedown", (event: MouseEvent) => this.onMouseDown(event));
		this.canvas.addEventListener("mouseup", (event: MouseEvent) => this.onMouseUp(event));
		this.canvas.addEventListener("mousemove", (event: MouseEvent) => this.onMouseMove(event));
		this.canvas.addEventListener("contextmenu", (event: Event) => event.preventDefault());
		this.canvas.addEventListener("wheel", (event: MouseWheelEvent) => this.onScroll(event));
		document.getElementById("clear").addEventListener("click", (event: MouseEvent) => this.clear());
		document.getElementById("randomize").addEventListener("click", (event: MouseEvent) => this.randomize());
		document.getElementById("share").addEventListener("click", (event: MouseEvent) => this.share());
		document.getElementById("save").addEventListener("click", (event: MouseEvent) => this.saveSTL());
		document.getElementById("remove").addEventListener("click", (event: MouseEvent) => this.remove());
		document.getElementById("style").addEventListener("change", (event: MouseEvent) => this.setRenderStyle(parseInt((event.srcElement as HTMLSelectElement).value)));
        window.addEventListener("resize", (e: Event) => this.camera.onResize());

		this.initializeEditor("type", (typeName: string) => this.setType(typeName));
		this.initializeEditor("orientation", (orientationName: string) => this.setOrientation(orientationName));
		this.initializeEditor("size", (sizeName: string) => this.setSize(sizeName));
		this.initializeEditor("rounded", (roundedName: string) => this.setRounded(roundedName));

		document.getElementById("blockeditor").addEventListener("toggle", (event: MouseEvent) => this.onNodeEditorClick(event));
	}

	private onNodeEditorClick(event: MouseEvent) {
		this.handles.visible = (event.srcElement as HTMLDetailsElement).open;
		this.camera.render();
	}

	private saveSTL() {
		new PartMeshGenerator(this.part, this.measurements).getMesh().saveSTLFile(this.measurements.technicUnit);
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

	private share() {
		window.history.pushState({}, document.title, "?part=" + this.part.toString());
	}

	private remove() {
		this.part.clearBlock(this.handles.getSelectedBlock(), this.editorState.orientation);
		if (this.createFullSizedBlocks) {
			this.part.clearBlock(this.handles.getSelectedBlock().plus(forward(this.editorState.orientation)), this.editorState.orientation);
		}
		this.updateMesh();
	}

	private setType(typeName: string) {
		this.editorState.type = BLOCK_TYPE[typeName];
		this.updateBlock();
	}

	private setOrientation(orientatioName: string) {
		this.editorState.orientation = ORIENTATION[orientatioName];
		this.handles.setMode(this.createFullSizedBlocks, this.editorState.orientation);
		this.updateBlock();
	}

	private setSize(sizeName: string) {
		this.createFullSizedBlocks = sizeName == "full";
		this.handles.setMode(this.createFullSizedBlocks, this.editorState.orientation);
		this.camera.render();
	}

	private setRounded(roundedName: string) {
		this.editorState.rounded = roundedName == "true";
		this.updateBlock();
	}

	private setRenderStyle(style: RenderStyle) {
		this.style = style;
		this.partNormalDepthRenderer.enabled = style == RenderStyle.Contour;
		this.contourEffect.enabled = style == RenderStyle.Contour;
		this.partRenderer.enabled = style != RenderStyle.Wireframe;
		this.wireframeRenderer.enabled = style == RenderStyle.SolidWireframe || style == RenderStyle.Wireframe;
		this.updateMesh();
	}

	private updateBlock() {
		this.part.placeBlockForced(this.handles.getSelectedBlock(), new Block(this.editorState.orientation, this.editorState.type, this.editorState.rounded));
		if (this.createFullSizedBlocks) {
			this.part.placeBlockForced(this.handles.getSelectedBlock().plus(forward(this.editorState.orientation)),
				new Block(this.editorState.orientation, this.editorState.type, this.editorState.rounded));
		}
		this.updateMesh();
	}

	public updateMesh(center = false) {
		let mesh = new PartMeshGenerator(this.part, this.measurements).getMesh();
		if (this.partRenderer.enabled) {
			this.partRenderer.setMesh(mesh);
		}
		if (this.partNormalDepthRenderer.enabled) {
			this.partNormalDepthRenderer.setMesh(mesh);
		}
		if (this.wireframeRenderer.enabled) {
			this.wireframeRenderer.setMesh(mesh);
		}

		var newCenter = this.part.getCenter().times(-0.5);
		if (center) {
			this.translation = Vector3.zero();
		} else {
			this.translation = this.translation.plus(this.getRotation().transformDirection(this.center.minus(newCenter)));
		}
		this.center = newCenter;
		this.updateTransform();
		this.handles.updateTransforms();
		this.camera.render();
	}

	private getRotation(): Matrix4 {
		return Matrix4.getRotation(new Vector3(0, this.rotationX, this.rotationY));
	}

	private updateTransform() {
		this.camera.transform = 
			Matrix4.getTranslation(this.center)
			.times(this.getRotation())
			.times(Matrix4.getTranslation(this.translation.plus(new Vector3(0, 0, -15))));
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
				this.translation = this.translation.plus(new Vector3(event.movementX, -event.movementY, 0).times(this.camera.size / gl.drawingBufferHeight));
				this.updateTransform();
				this.camera.render();
				break;
			case MouseMode.Right:
				this.rotationX -= event.movementX * 0.6;
				this.rotationY = clamp(-90, 90, this.rotationY - event.movementY * 0.6);
				
				this.updateTransform();
				this.camera.render();
				break;
		}
	}

	private onScroll(event: MouseWheelEvent) {
		this.zoom *= event.deltaY < 0 ? this.zoomStep : 1 / this.zoomStep;
		this.camera.size = this.zoom;
		this.camera.render();
	}
}