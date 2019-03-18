class Shader {
	public program: WebGLShader;
	public attributes: {[id: string]: number } = {};

	private loadShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
        let shader = gl.createShader(type);      
        gl.shaderSource(shader, source);      
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            var lines = source.split("\n");
            for (var index = 0; index < lines.length; index++) {
                console.log((index + 1) + ": " + lines[index]);
            }
            throw new Error('An error occurred compiling the shaders: ' +  gl.getShaderInfoLog(shader));
        }

        return shader;
    }

    constructor(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
        const vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
      
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
      
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw new Error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(this.program));
		}
	}

	public setAttribute(gl: WebGLRenderingContext, name: string) {
		this.attributes[name] = gl.getAttribLocation(this.program, name);
	}

	public setUniform(gl: WebGLRenderingContext, name: string) {		
		this.attributes[name] = gl.getUniformLocation(this.program, name) as number;
	}
}