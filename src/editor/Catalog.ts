class Catalog {
	private container: HTMLElement;

	private initialized: boolean = false;
	private items: CatalogItem[];

	constructor() {
		this.container = document.getElementById("catalog");
		this.createCatalogItems();
		document.getElementById("catalog").addEventListener("toggle", (event: MouseEvent) => this.onToggleCatalog(event));
	}

	private onToggleCatalog(event: MouseEvent) {
		if ((event.srcElement as HTMLDetailsElement).open && !this.initialized) {
			this.createCatalogUI();
		}
	}

	private createCatalogUI() {
		var oldRenderingContext = gl;
		for (var item of this.items) {
			var catalogLink: HTMLAnchorElement = document.createElement("a");
			catalogLink.className = "catalogItem";
			catalogLink.href = "/?part=" + item.string;
			catalogLink.title = item.name;
			this.container.appendChild(catalogLink);
			var canvas = document.createElement("canvas");
			catalogLink.appendChild(canvas);
			canvas.style.height = "64px";
			canvas.style.width = "64px";
			var camera = new Camera(canvas, 2);
			camera.size = (item.part.getSize() + 2) * 0.41;
			camera.clearColor = new Vector3(0.859, 0.859, 0.859);
			var partRenderer = new NormalDepthRenderer();
			partRenderer.color = new Vector3(0.67, 0.7, 0.71);
			camera.renderers.push(partRenderer);
			camera.renderers.push(new ContourPostEffect());
			let mesh = new PartMeshGenerator(item.part).getMesh();
			partRenderer.setMesh(mesh);
			camera.transform = Matrix4.getTranslation(item.part.getCenter().times(-0.5))
				.times(Matrix4.getRotation(new Vector3(0, 45, -30))
				.times(Matrix4.getTranslation(new Vector3(-0.1, 0, 0))));
			camera.render();
			let itemCopy = item;
			catalogLink.addEventListener("click", (event: MouseEvent) => this.onSelectPart(itemCopy, event));
		}
		gl = oldRenderingContext;
		this.initialized = true;
	}

	private createCatalogItems() {		
		this.items = [
			new CatalogItem(6538, "Angle Connector", "7z210z20y11y1"),
			new CatalogItem(59443, "Axle Connector", "0z22z27z210z2"),
			new CatalogItem(15555, "Pin Joiner", "0z12z17z110z1"),
			new CatalogItem(36536, "Cross Block ", "9y2fy20z12z1"),
			new CatalogItem(32034, "Angle Connector #2", "0z22z27y11ez232z2dy1"),
			new CatalogItem(32039, "Through Axle Connector with Bushing", "0y21y29x213x2"),
			new CatalogItem(42003, "Cross Block 1 x 3", "0z22z29y1fy122y131y1"),
			new CatalogItem(32184, "Cross Block 1 x 3 with Two Axle holes", "0z22z29y1fy122z236z2"),
			new CatalogItem(41678, "Cross Block 2 x 2 Split", "4z1bz10x219z12bz113x2"),
			new CatalogItem(32014, "Angle Connector #6", "9y120z234z2fy10x23x2"),
			new CatalogItem(32126, "Toggle Joint Connector", "7z210z20x1"),
			new CatalogItem(32291, "Cross Block With Two Pinholes", "0z12z1cx29z112z119x2"),
			new CatalogItem(16615, "Beam 7", "0y11y19y1fy122y131y153y16fy1a4y1d1y111dy115fy11c6y1221y1")
		];
	}

	private onSelectPart(item: CatalogItem, event: MouseEvent) {
		editor.part = Part.fromString(item.string);
		editor.updateMesh(true);
		window.history.pushState({}, document.title, "/?part=" + item.string);
		event.preventDefault();
	}
}