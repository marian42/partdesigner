class MeshRenderer {
    canvas: HTMLCanvasElement;
	gl: WebGLRenderingContext;


    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
		this.gl = canvas.getContext("webgl") as WebGLRenderingContext;

		if (this.gl == null) {
			throw new Error("WebGL is not supported.");
		}
    }

	update() {
		this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
	}
}

window.onload = () => {
	var part = new Part();
	part.randomize();
	console.log(part.toString());

    var el = document.getElementById('canvas') as HTMLCanvasElement;
    var renderer = new MeshRenderer(el);
    renderer.update();
};