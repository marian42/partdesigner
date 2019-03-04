class Camera {
    private canvas: HTMLCanvasElement;
    public gl: WebGLRenderingContext;

    public renderers: MeshRenderer[] = [];
    
    private aspectRatio: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
		this.gl = canvas.getContext("webgl") as WebGLRenderingContext;

		if (this.gl == null) {
			throw new Error("WebGL is not supported.");
        }

        window.addEventListener("resize", (e: Event) => this.onResize());
        this.onResize();
    }

    public getProjectionMatrix(near = 0.1, far = 1000, fov = 45): number[] {
        return [
            1 / (Math.tan(fov * DEG_TO_RAD / 2) * this.aspectRatio), 0, 0, 0,
            0, 1 / Math.tan(fov * DEG_TO_RAD / 2), 0, 0,
            0, 0, -(far + near)/(far - near), -1,
            0, 0, -0.2, 0
        ];
    }

    public render() {
        let gl = this.gl;
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
        this.aspectRatio = 1;
        this.render();
    }
}