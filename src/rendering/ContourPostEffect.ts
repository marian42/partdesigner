class ContourPostEffect implements Renderer {

	private shader: Shader;
	private vertices: WebGLBuffer;
	
	public enabled: boolean = true;
    
    constructor() {
        this.shader = new Shader(COUNTOUR_VERTEX, CONTOUR_FRAGMENT);

		this.shader.setAttribute("vertexPosition");
		this.shader.setUniform("normalTexture");
		this.shader.setUniform("depthTexture");
		this.shader.setUniform("resolution");
		
		this.vertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
		var positions: number[] = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    }

    public render(camera: Camera) {
		if (!this.enabled) {
			return;
		}

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
        gl.vertexAttribPointer(this.shader.attributes["vertexPosition"], 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.shader.attributes["vertexPosition"]);
      
        gl.useProgram(this.shader.program);
		
		gl.depthFunc(gl.ALWAYS);
		gl.depthMask(false);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, camera.normalTexture);
		gl.uniform1i(this.shader.attributes["normalTexture"], 0);		
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, camera.depthTexture);
		gl.uniform1i(this.shader.attributes["depthTexture"], 1);
		gl.uniform2f(this.shader.attributes["resolution"], gl.drawingBufferWidth, gl.drawingBufferHeight);
		
        gl.drawArrays(gl.TRIANGLES, 0, 6);
		gl.depthFunc(gl.LEQUAL);
		gl.depthMask(true);
    }
}