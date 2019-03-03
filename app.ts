window.onload = () => {
	var part = new Part();
	part.randomize();
	console.log(part.toString());
	let mesh = new PartMeshGenerator(part).getMesh();
	console.log(mesh.triangles.length);

    var el = document.getElementById('canvas') as HTMLCanvasElement;
	var renderer = new MeshRenderer(el);
	renderer.setMesh(mesh);
    renderer.drawScene();
};