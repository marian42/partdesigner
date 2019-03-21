class Camera {
    public renderers: Renderer[] = [];

    public transform: Matrix4 = Matrix4.getIdentity();

    public size = 5;

    public renderTexture: WebGLTexture;

    constructor(canvas: HTMLCanvasElement) {
        gl = canvas.getContext("webgl", {"antialias": false}) as WebGLRenderingContext;

		if (gl == null) {
			throw new Error("WebGL is not supported.");
        }
        gl.getExtension('WEBGL_depth_texture');

        window.addEventListener("resize", (e: Event) => this.onResize());
        gl.canvas.width = Math.round(gl.canvas.clientWidth * window.devicePixelRatio);
        gl.canvas.height = Math.round(gl.canvas.clientHeight * window.devicePixelRatio);
        this.createTexture();
    }

    private createTexture() {
        this.renderTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.renderTexture);
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA,
            gl.canvas.width, gl.canvas.height, 0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    public getProjectionMatrix(): Matrix4 {
       return Matrix4.getOrthographicProjection(30, this.size);
    }

    public render() {
        gl.clearColor(0.5, 0.5, 1.0, 1.0);
        gl.clearDepth(1.0);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		for (var renderer of this.renderers) {
			renderer.render(this);
        }
        gl.colorMask(false, false, false, true);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);        
        gl.colorMask(true, true, true, true);
    }
    
    public onResize() {
        gl.canvas.width = Math.round(gl.canvas.clientWidth * window.devicePixelRatio);
        gl.canvas.height = Math.round(gl.canvas.clientHeight * window.devicePixelRatio);
        this.createTexture();
        this.render();
    }

    public getScreenToWorldRay(event: MouseEvent): Ray {
        var rect = gl.canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;

        x = x / gl.canvas.clientWidth * 2 - 1;
        y = y / gl.canvas.clientHeight * -2 + 1;

        let viewSpacePoint = new Vector3(x * this.size / 2 * gl.drawingBufferWidth / gl.drawingBufferHeight, y * this.size / 2, 0);
        let viewSpaceDirection = new Vector3(0, 0, -1);
        let inverseCameraTransform = this.transform.invert();

        return new Ray(inverseCameraTransform.transformPoint(viewSpacePoint), inverseCameraTransform.transformDirection(viewSpaceDirection));
    }
}