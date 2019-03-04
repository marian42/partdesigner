let gl: WebGLRenderingContext;

window.onload = () => {
	var part = new Part();
	part.randomize();
	console.log(part.toString());
	let mesh = new PartMeshGenerator(part).getMesh();

    var canvas = document.getElementById('canvas') as HTMLCanvasElement;
	var camera = new Camera(canvas);
	
	var meshRenderer = new MeshRenderer();
	meshRenderer.setMesh(mesh);

	camera.renderers.push(meshRenderer);
    camera.render();
};