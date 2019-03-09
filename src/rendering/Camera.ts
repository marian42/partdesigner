class Camera {
    public renderers: MeshRenderer[] = [];

    public position: Vector3;

    constructor(canvas: HTMLCanvasElement) {
        gl = canvas.getContext("webgl") as WebGLRenderingContext;

		if (gl == null) {
			throw new Error("WebGL is not supported.");
        }

        window.addEventListener("resize", (e: Event) => this.onResize());
        this.position = new Vector3(0, 0, -5);
        this.onResize();
    }

    public getProjectionMatrix(): Matrix4 {
       return Matrix4.getProjection();
    }

    public render() {
        gl.clearColor(0.9, 0.9, 0.9, 1.0);
        gl.clearDepth(1.0);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		for (var renderer of this.renderers) {
			renderer.render(this);
		}
    }
    
    public onResize() {
        gl.canvas.width = gl.canvas.clientWidth;
        gl.canvas.height = gl.canvas.clientHeight;
        this.render();
    }
}