const VERTEX_SHADER = `
    attribute vec4 vertexPosition;
    attribute vec4 normal;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;

    varying vec3 v2fNormal;

    void main() {
        v2fNormal = (modelViewMatrix * vec4(normal.xyz, 0.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;
    }
`;


const FRAGMENT_SHADER = `
    precision mediump float;

    const vec3 lightDirection = vec3(-0.7, 0.7, 0.14);
    const float ambient = 0.2;
    const float diffuse = 0.8;
    const float specular = 0.3;
    const vec3 viewDirection = vec3(0.0, 0.0, 1.0);

    varying vec3 v2fNormal;

    uniform vec3 albedo;
    uniform float alpha;

    void main() {
        vec3 color = albedo * (ambient
             + diffuse * (0.5 + 0.5 * dot(lightDirection, v2fNormal))
             + specular * pow(max(0.0, dot(reflect(-lightDirection, v2fNormal), viewDirection)), 2.0)); 

        gl_FragColor = vec4(color.r, color.g, color.b, alpha);
    }
`;

const APPLY_BUFFER_VERTEX = `
    attribute vec2 vertexPosition;

    varying vec2 v2fScreenUV;

    void main() {
        v2fScreenUV = vertexPosition / 2.0 + vec2(0.5);
        gl_Position = vec4(vertexPosition, 0.0, 1.0);
    }
`;

const APPLY_BUFFER_FRAGMENT = `
    precision mediump float;

    uniform sampler2D buffer;

    varying vec2 v2fScreenUV;

    void main() {
        vec4 color = texture2D(buffer, v2fScreenUV);
        gl_FragColor = vec4(color.rgb, 1.0);
    }
`

const COUNTOUR_VERTEX = `
    attribute vec2 vertexPosition;

    varying vec2 uv;

    void main() {
        uv = vertexPosition / 2.0 + vec2(0.5);
        gl_Position = vec4(vertexPosition, 0.0, 1.0);
    }
`;

const CONTOUR_FRAGMENT = `
    precision mediump float;

    uniform sampler2D depthBuffer;
    uniform vec2 resolution;

    varying vec2 uv;

    float getDepth(vec2 uv) {
        return texture2D(depthBuffer, uv).r;
    }

    const float DEPTH_THRESHOLD = 0.0005;
    
    void main() {
        vec2 pixelSize = vec2(1.0 / resolution.x, 1.0 / resolution.y);

        float d1 = getDepth(uv);
        float d2 = getDepth(uv + vec2(pixelSize.x, 0.0));
        float d3 = getDepth(uv + vec2(0, pixelSize.y));
        float d4 = getDepth(uv + vec2(pixelSize.x, pixelSize.y));
        float contour = abs(d1 - d2) > DEPTH_THRESHOLD ? 1.0 : 0.0;
        contour = max(contour, abs(d1 - d3) > DEPTH_THRESHOLD ? 1.0 : 0.0);
        contour = max(contour, abs(d1 - d4) > DEPTH_THRESHOLD ? 1.0 : 0.0);
        gl_FragColor = vec4(vec3(0.0), contour);
    }
`