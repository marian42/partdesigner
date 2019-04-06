class WireframeRenderer implements Renderer {
	private shader: Shader;
	private vertices: WebGLBuffer;
	private vertexCount: number;

	public transform: Matrix4;
	
	public visible: boolean = true;

	public color: Vector3 = new Vector3(0.0, 0.0, 0.0);
	public alpha: number = 0.6;

    constructor() {
		this.shader = new Shader(SIMPLE_VERTEX_SHADER, COLOR_FRAGMENT_SHADER);

		this.shader.setAttribute("vertexPosition");
        this.shader.setUniform("projectionMatrix");
        this.shader.setUniform("modelViewMatrix");
        this.shader.setUniform("color");
        this.shader.setUniform("scale");		

        this.transform = Matrix4.getIdentity();
    }

    public setMesh(mesh: Mesh) {
        this.vertexCount = mesh.getVertexCount() * 2;
        this.vertices = mesh.createWireframeVertexBuffer();
    }

    public render(camera: Camera) {
		if (!this.visible) {
			return;
		}
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
		gl.vertexAttribPointer(this.shader.attributes["vertexPosition"], 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.shader.attributes["vertexPosition"]);
		
		gl.useProgram(this.shader.program);

		gl.uniformMatrix4fv(this.shader.attributes["projectionMatrix"], false, camera.getProjectionMatrix().elements);
		gl.uniformMatrix4fv(this.shader.attributes["modelViewMatrix"], false, this.transform.times(camera.transform).elements);
		gl.uniform3f(this.shader.attributes["scale"], 1, 1, 1);
		gl.uniform4f(this.shader.attributes["color"], this.color.x, this.color.y, this.color.z, this.alpha);
		
      
        gl.drawArrays(gl.LINES, 0, this.vertexCount);
    }
}