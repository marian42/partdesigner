class Camera {
    public renderers: Renderer[] = [];

    public transform: Matrix4 = Matrix4.getIdentity();

    public frameBuffer: WebGLFramebuffer;
    public renderTexture: WebGLTexture;
    public depthTexture: WebGLTexture;

    constructor(canvas: HTMLCanvasElement) {
        gl = canvas.getContext("webgl", { "alpha": false }) as WebGLRenderingContext;

		if (gl == null) {
			throw new Error("WebGL is not supported.");
        }
        gl.getExtension('WEBGL_depth_texture');

        window.addEventListener("resize", (e: Event) => this.onResize());
        gl.canvas.width = Math.round(gl.canvas.clientWidth * window.devicePixelRatio);
        gl.canvas.height = Math.round(gl.canvas.clientHeight * window.devicePixelRatio);
        this.createBuffers();
    }

    private createBuffers() {
        this.renderTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.renderTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
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
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.renderTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthTexture, 0);
    }

    public getProjectionMatrix(): Matrix4 {
       return Matrix4.getProjection();
    }

    public render() {
        gl.clearColor(0.5, 0.5, 1.0, 1.0);
        gl.clearDepth(1.0);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		for (var renderer of this.renderers) {
			renderer.render(this);
        }
    }
    
    public onResize() {
        gl.canvas.width = Math.round(gl.canvas.clientWidth * window.devicePixelRatio);
        gl.canvas.height = Math.round(gl.canvas.clientHeight * window.devicePixelRatio);
        this.createBuffers();
        this.render();
    }

    public getScreenToWorldRay(event: MouseEvent): Ray {
        var rect = gl.canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;

        x = x / gl.canvas.clientWidth * 2 - 1;
        y = y / gl.canvas.clientHeight * -2 + 1;

        let projection = this.getProjectionMatrix();
        let viewSpacePoint = Vector3.zero();
        let viewSpaceDirection = new Vector3(x / projection.get(0, 0), y / projection.get(1, 1), -1).normalized();

        let inverseCameraTransform = this.transform.invert();

        return new Ray(inverseCameraTransform.transformPoint(viewSpacePoint), inverseCameraTransform.transformDirection(viewSpaceDirection));
    } 
}