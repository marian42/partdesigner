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
		var canvas = document.createElement("canvas");
		canvas.style.height = "64px";
		canvas.style.width = "64px";
		this.container.appendChild(canvas);

		var camera = new Camera(canvas, 2);
		camera.clearColor = new Vector3(0.859, 0.859, 0.859);
		var partRenderer = new NormalDepthRenderer();
		partRenderer.color = new Vector3(0.67, 0.7, 0.71);
		camera.renderers.push(partRenderer);
		camera.renderers.push(new ContourPostEffect());
		
		for (var item of this.items) {
			var catalogLink: HTMLAnchorElement = document.createElement("a");
			catalogLink.className = "catalogItem";
			catalogLink.href = "?part=" + item.string;
			catalogLink.title = item.name;
			this.container.appendChild(catalogLink);
			var itemCanvas = document.createElement("canvas");
			catalogLink.appendChild(itemCanvas);
			itemCanvas.style.height = "64px";
			itemCanvas.style.width = "64px";
			partRenderer.setMesh(new PartMeshGenerator(item.part).getMesh());
			camera.size = (item.part.getSize() + 2) * 0.41;
			camera.transform = Matrix4.getTranslation(item.part.getCenter().times(-0.5))
				.times(Matrix4.getRotation(new Vector3(0, 45, -30))
				.times(Matrix4.getTranslation(new Vector3(-0.1, 0, 0))));
			camera.render();
			var context = itemCanvas.getContext("2d");
			context.canvas.width = gl.canvas.width;
			context.canvas.height = gl.canvas.height;
			context.drawImage(canvas, 0, 0);

			let itemCopy = item;
			catalogLink.addEventListener("click", (event: MouseEvent) => this.onSelectPart(itemCopy, event));
		}
		gl = oldRenderingContext;
		this.initialized = true;
		this.container.removeChild(canvas);
	}

	private createCatalogItems() {		
		this.items = [
			new CatalogItem(43093, "Axle to Pin Connector", "0z32z37z410z4"),
			new CatalogItem(3704, "Axle 2", "0z42z47z410z4"),
			new CatalogItem(4519, "Axle 3", "7z410z41ez432z40z42z4"),
			new CatalogItem(6553, "Axle 1.5 with Perpendicular Axle Connector", "1ex210z07z42z40z433x2"),
			new CatalogItem(18651, "Axle 2m with Pin", "1ez432z47z410z40z32z3"),
			new CatalogItem(40147, "Beam 1 x 2 with Axle Hole and Pin Hole", "7y10y2dy11y2"),
			new CatalogItem(43857, "Beam 2", "0y17y11y1dy1"),
			new CatalogItem(17141, "Beam 3", "0y17y11ey11y1dy12dy1"),
			new CatalogItem(6632, "Beam 3 x 0.5 with Axle Hole each end", "7y11ey20y2"),
			new CatalogItem(41677, "Beam 2 x 0.5 with Axle Holes", "0y27y2"),
			new CatalogItem(32140, "Beam 2 x 4 Bent 90 Degrees, 2 and 4 holes", "20y14fy19ey29y12fy16by1cby2fy10y11y1"),
			new CatalogItem(32449, "Beam 4 x 0.5 with Axle Hole each end", "7y11ey14dy20y2"),
			new CatalogItem(2825, "Beam 1 x 4 x 0.5 with Boss", "7y11ey14dy20y21y2"),
			new CatalogItem(33299, "Half Beam 3 with Knob and Pin", "2dy342y04y217y2ay21ey3"),
			new CatalogItem(60484, "Beam 3 x 3 T-Shaped", "17x13bx11ex17x10x12ax15bx133x111x13x1"),
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
			new CatalogItem(44809, "Cross Block Bent 90 Degrees with Three Pinholes", "17z129z17x10y11y111x1"),
			new CatalogItem(55615, "Cross Block beam Bent 90 Degrees with 4 Pins", "17y142x18dz3c1z34x126y182z1b4z1e6x1181z31e3z31ey30y32dy31y364x1cx112ex1"),
			new CatalogItem(48989, "Cross Block Beam 3 with Four Pins", "0y31ey31y32dy34x117y142x126y114y382y323y3afy3cx164x1"),
			new CatalogItem(63869, "Cross Block 3 x 2", "1ex17x10x117z229z233x111x13x1"),
			new CatalogItem(92907, "Cross Block 2 x 2 x 2 Bent 90 Split", "2az143z166x035x213x217x07x20x2"),
			new CatalogItem(32557, "Cross Block 2 x 3 with Four Pinholes", "9z112z119x13dx10z12z1cx125x1"),
			new CatalogItem(10197, "Beam 1m with 2 Axles 90°", "7x10z42z417y426y411x1"),
			new CatalogItem(22961, "Beam 1 with Axle", "0z42z47x111x1"),
			new CatalogItem(98989, "Cross Block 2 x 4", "7x10x117z1bz13bz124z17bz255z211x13x1"),
			new CatalogItem(27940, "Beam 1 Hole with 2 Axles 180", "7x11ez432z40z42z411x1"),
			new CatalogItem(11272, "Cross Block 2 x 3", "7x211x233x23x220x24fx29x235x2"),
			new CatalogItem(16615, "Beam 7", "0y11y19y1fy122y131y153y16fy1a4y1d1y111dy115fy11c6y1221y1")
		];
	}

	private onSelectPart(item: CatalogItem, event: MouseEvent) {
		editor.part = Part.fromString(item.string);
		editor.updateMesh(true);
		window.history.pushState({}, document.title, "?part=" + item.string);
		event.preventDefault();
	}
}