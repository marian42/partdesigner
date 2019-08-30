class Camera {
    public renderers: Renderer[] = [];

    public transform: Matrix4 = Matrix4.getIdentity();

    public size = 5;

    public frameBuffer: WebGLFramebuffer;
    public normalTexture: WebGLTexture;
    public depthTexture: WebGLTexture;

    public clearColor: Vector3 = new Vector3(0.95, 0.95, 0.95);

    public supersample: number = 1;

    constructor(canvas: HTMLCanvasElement, supersample = 1) {
        gl = canvas.getContext("webgl") as WebGLRenderingContext;

		if (gl == null) {
			throw new Error("WebGL is not supported.");
        }
        gl.getExtension('WEBGL_depth_texture');

        this.supersample = supersample;        
        canvas.width = Math.round(canvas.clientWidth * window.devicePixelRatio) * this.supersample;
        canvas.height = Math.round(canvas.clientHeight * window.devicePixelRatio) * this.supersample;
        this.createBuffers();
    }

    private createBuffers() {
        this.normalTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.normalTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        this.depthTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, gl.canvas.width, gl.canvas.height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        this.frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.normalTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthTexture, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    public getProjectionMatrix(): Matrix4 {
       return Matrix4.getOrthographicProjection(30, this.size);
    }

    public render() {
        gl.clearColor(this.clearColor.x, this.clearColor.y, this.clearColor.z, 1.0);
        gl.colorMask(true, true, true, true);
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
    }
    
    public onResize() {
        gl.canvas.width = Math.round((gl.canvas as HTMLCanvasElement).clientWidth * window.devicePixelRatio) * this.supersample;
        gl.canvas.height = Math.round((gl.canvas as HTMLCanvasElement).clientHeight * window.devicePixelRatio) * this.supersample;
        this.createBuffers();
        this.render();
    }

    public getScreenToWorldRay(event: MouseEvent): Ray {
        var rect = (gl.canvas as HTMLCanvasElement).getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;

        x = x / (gl.canvas as HTMLCanvasElement).clientWidth * 2 - 1;
        y = y / (gl.canvas as HTMLCanvasElement).clientHeight * -2 + 1;

        let viewSpacePoint = new Vector3(x * this.size / 2 * gl.drawingBufferWidth / gl.drawingBufferHeight, y * this.size / 2, 0);
        let viewSpaceDirection = new Vector3(0, 0, -1);
        let inverseCameraTransform = this.transform.invert();

        return new Ray(inverseCameraTransform.transformPoint(viewSpacePoint), inverseCameraTransform.transformDirection(viewSpaceDirection));
    }
}