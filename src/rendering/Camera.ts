class Camera {
    private canvas: HTMLCanvasElement;

    public renderers: MeshRenderer[] = [];

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
		gl = canvas.getContext("webgl") as WebGLRenderingContext;

		if (gl == null) {
			throw new Error("WebGL is not supported.");
        }

        window.addEventListener("resize", (e: Event) => this.onResize());
        this.onResize();
    }

    public getProjectionMatrix(): Matrix4 {
       return Matrix4.getProjection();
    }

    public render() {
        gl.clearColor(0.9, 0.9, 0.9, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);      
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		for (var renderer of this.renderers) {
			renderer.render(this);
		}
    }
    
    public onResize() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.render();
    }
}