class WireframeBox implements Renderer {
	private shader: Shader;
	private positions: WebGLBuffer;

	public transform: Matrix4;
	
	public visible: boolean = true;

	public color: Vector3 = new Vector3(0.0, 0.0, 1.0);
	public alpha: number = 0.8;	
	public colorOccluded: Vector3 = new Vector3(0.0, 0.0, 0.0);
	public alphaOccluded: number = 0.15;
	
	public scale: Vector3 = Vector3.one();

	constructor() {
		this.shader = new Shader(SIMPLE_VERTEX_SHADER, COLOR_FRAGMENT_SHADER);

		this.shader.setAttribute("vertexPosition");
        this.shader.setUniform("projectionMatrix");
        this.shader.setUniform("modelViewMatrix");
        this.shader.setUniform("color");
        this.shader.setUniform("scale");
		
		this.positions = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positions);
		var positions: number[] = [
			-1, -1, -1,  -1, -1, +1,
			+1, -1, -1,  +1, -1, +1,
			-1, +1, -1,  -1, +1, +1,
			+1, +1, -1,  +1, +1, +1,

			-1, -1, -1,  -1, +1, -1,
			-1, -1, +1,  -1, +1, +1,
			+1, -1, -1,  +1, +1, -1,
			+1, -1, +1,  +1, +1, +1,

			-1, -1, -1,  +1, -1, -1,
			-1, +1, -1,  +1, +1, -1,
			-1, -1, +1,  +1, -1, +1,
			-1, +1, +1,  +1, +1, +1
		];
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	}

	public render(camera: Camera) {
		if (!this.visible) {
			return;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, this.positions);
		gl.vertexAttribPointer(this.shader.attributes["vertexPosition"], 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.shader.attributes["vertexPosition"]);
		
		gl.useProgram(this.shader.program);

		gl.uniformMatrix4fv(this.shader.attributes["projectionMatrix"], false, camera.getProjectionMatrix().elements);
		gl.uniformMatrix4fv(this.shader.attributes["modelViewMatrix"], false, this.transform.times(camera.transform).elements);
		gl.uniform3f(this.shader.attributes["scale"], this.scale.x, this.scale.y, this.scale.z);
		
		gl.depthFunc(gl.GREATER);
		gl.depthMask(false);
        gl.uniform4f(this.shader.attributes["color"], this.colorOccluded.x, this.colorOccluded.y, this.colorOccluded.z, this.alphaOccluded);
		gl.drawArrays(gl.LINES, 0, 24);
		
		gl.depthFunc(gl.LEQUAL);
		gl.depthMask(true);
        gl.uniform4f(this.shader.attributes["color"], this.color.x, this.color.y, this.color.z, this.alpha);		
		gl.drawArrays(gl.LINES, 0, 24);
	}
}