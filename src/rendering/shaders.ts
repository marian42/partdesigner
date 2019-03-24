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

    const vec3 lightDirection = vec3(-0.7, -0.7, 0.14);
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

const NORMAL_FRAGMENT_SHADER = `
    precision mediump float;

    varying vec3 v2fNormal;

    void main() {
        vec3 normal = vec3(0.5) + 0.5 * normalize(v2fNormal);
        gl_FragColor = vec4(normal, 1.0);
    }
`;

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

    uniform sampler2D normalTexture;
    uniform sampler2D depthTexture;
    uniform vec2 resolution;

    varying vec2 uv;
    
    const float NORMAL_THRESHOLD = 0.5;

    vec3 getNormal(vec2 uv) {
        vec4 sample = texture2D(normalTexture, uv);
        return 2.0 * sample.xyz - vec3(1.0);
    }

    float getDepth(vec2 uv) {
        return texture2D(depthTexture, uv).r;
    }

    bool isContour(vec2 uv, float referenceDepth, vec3 referenceNormal) {
        float depth = getDepth(uv);
        vec3 normal = getNormal(uv);
        float angle = abs(referenceNormal.z);
        
        float threshold = mix(0.005, 0.0001, pow(-referenceNormal.z, 0.5));

        if (abs(depth - referenceDepth) > threshold) {
            return true;
        }

        if (abs(dot(normal, referenceNormal)) < NORMAL_THRESHOLD) {
            return true;
        }

        return false;
    }

    void main() {
        vec2 pixelSize = vec2(1.0 / resolution.x, 1.0 / resolution.y);

        float depth = getDepth(uv);
        vec3 normal = getNormal(uv);

        float contour = 0.0;
        float count = 0.0;

        for (float x = -1.0; x <= 1.0; x++) {
            for (float y = -1.0; y <= 1.0; y++) {
                if ((x != 0.0 || y != 0.0) && isContour(uv + pixelSize * vec2(x, y), depth, normal)) {
                    count++;
                }
            }
        }
        contour = count == 1.0 ? 0.0 : clamp(0.0, 1.0, (count - 0.2) / 5.0);

        gl_FragColor = vec4(vec3(0.0), contour);
    }
`

const BOX_VERTEX_SHADER = `
    attribute vec4 vertexPosition;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;

    const vec3 scale = vec3(0.5);

    void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4((vertexPosition.xyz * scale), vertexPosition.a);
    }
`;

const BOX_FRAGMENT_SHADER = `
    precision mediump float;

    uniform vec4 color;

    void main() {
        gl_FragColor = color;
    }
`;