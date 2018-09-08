const QUAD_VERT = '\
#version 300 es\n\
\n\
precision mediump float;\n\
\n\
layout(location=0) in vec2 a_pos;\n\
\n\
out vec2 v_pos;\n\
\n\
void main() {\n\
    v_pos = (a_pos + vec2(1.0, 1.0)) * 0.5;\n\
    gl_Position = vec4(a_pos, 0.0, 1.0);\n\
}\n\
';

const QUAD_FRAG = '\
#version 300 es\n\
\n\
precision mediump float;\n\
\n\
uniform mat2x3 u_w0;\n\
uniform vec3 u_b0;\n\
\n\
uniform mat3x3 u_w1;\n\
uniform vec3 u_b1;\n\
\n\
vec3 sigmoid(vec3 v) {\n\
    return vec3(1.0) / (vec3(1.0) + exp(-v));\n\
}\n\
\n\
vec3 feedForward(vec2 features) {\n\
    vec3 l1 = sigmoid(u_w0 * features + u_b0);\n\
    vec3 l2 = sigmoid(u_w1 * l1 + u_b1);\n\
    return l2;\n\
}\n\
\n\
vec3 classColor(vec3 labelVector) {\n\
    REPLACE WITH IMPLEMENTATION\
}\n\
\n\
in vec2 v_pos;\n\
\n\
out vec4 color;\n\
\n\
void main() {\n\
    color = vec4(classColor(feedForward(v_pos)), 1.0);\n\
}\n\
';

const QUAD_FRAG_SMOOTH_CLASSCOLORIMPL = '\
return vec3(1.0) - labelVector.zxy;\n\
';

const QUAD_FRAG_SHARP_CLASSCOLORIMPL = '\
return ((labelVector.x > labelVector.y) && (labelVector.x > labelVector.z)) ?\n\
        vec3(1.0, 0.0, 1.0) :\n\
        ((labelVector.y > labelVector.z) ? vec3(1.0, 1.0, 0.0) : vec3(0.0, 1.0, 1.0));\n\
';

const EXAMPLES_VERT = '\
#version 300 es\n\
\n\
precision mediump float;\n\
\n\
vec3 classColors[3] = vec3[](\n\
    vec3(1.0, 0.0, 1.0),\n\
    vec3(1.0, 1.0, 0.0),\n\
    vec3(0.0, 1.0, 1.0)\n\
);\n\
\n\
layout(location=0) in vec2 a_pos;\n\
layout(location=1) in float a_class;\n\
\n\
out vec3 v_color;\n\
\n\
void main() {\n\
    v_color = classColors[int(a_class)];\n\
    gl_Position = vec4(a_pos * 2.0 - vec2(1.0, 1.0), 0.0, 1.0);\n\
    gl_PointSize = 10.0;\n\
}\n\
';

const EXAMPLES_FRAG = '\
#version 300 es\n\
\n\
precision mediump float;\n\
\n\
in vec3 v_color;\n\
\n\
out vec4 color;\n\
\n\
void main() {\n\
    color = vec4(v_color, 1.0);\n\
}\n\
';

const EXAMPLES_OUTLINE_VERT = '\
#version 300 es\n\
\n\
precision mediump float;\n\
\n\
layout(location=0) in vec2 a_pos;\n\
layout(location=1) in float a_class;\n\
\n\
void main() {\n\
    float dummy = a_class;\n\
    gl_Position = vec4(a_pos * 2.0 - vec2(1.0, 1.0), 0.0, 1.0);\n\
    gl_PointSize = 12.0;\n\
}\n\
';

const EXAMPLES_OUTLINE_FRAG = '\
#version 300 es\n\
\n\
precision mediump float;\n\
\n\
out vec4 color;\n\
\n\
void main() {\n\
    color = vec4(0.0, 0.0, 0.0, 1.0);\n\
}\n\
';

var canvas = document.getElementById("canvas");

const gl = canvas.getContext("webgl2");

var quadPosBuffer;
var quadVAO;
var quadSmoothShaderProgram;
var quadSharpShaderProgram;

var numExamples;
var examplesPosBuffer;
var examplesClassBuffer;
var examplesVAO;
var examplesShaderProgram;
var examplesOutlineShaderProgram;

var showUncertainty = true;

var w0 = new Float32Array(6);
var b0 = new Float32Array(3);
var w1 = new Float32Array(9);
var b1 = new Float32Array(3);

if (gl) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    quadSmoothShaderProgram = createProgram(gl, QUAD_VERT, QUAD_FRAG.replace(
            'REPLACE WITH IMPLEMENTATION',
            QUAD_FRAG_SMOOTH_CLASSCOLORIMPL));
    quadSharpShaderProgram = createProgram(gl, QUAD_VERT, QUAD_FRAG.replace(
            'REPLACE WITH IMPLEMENTATION',
            QUAD_FRAG_SHARP_CLASSCOLORIMPL));
    examplesShaderProgram = createProgram(gl, EXAMPLES_VERT, EXAMPLES_FRAG);
    examplesOutlineShaderProgram = createProgram(gl, EXAMPLES_OUTLINE_VERT, EXAMPLES_OUTLINE_FRAG);
    
    quadPosBuffer = createBuffer(gl, new Float32Array(
            [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]));
    quadVAO = gl.createVertexArray();
    gl.bindVertexArray(quadVAO);
    bindAttribute(gl, quadPosBuffer, 0, 2);
    gl.bindVertexArray(null);
} else {
    document.body.innerHTML = "Your browser doesn't support WebGL 2.";
}

function setShowUncertainty(aFlag) {
    showUncertainty = aFlag;
}

function setExamples(trainingData) {
    numExamples = trainingData.length;
    
    const posComponents = 2;
    var posArray = new Float32Array(numExamples * posComponents);
    var posArrayIndex = 0;
    const classComponents = 1;
    var classArray = new Float32Array(numExamples * classComponents);
    var classArrayIndex = 0;
    for (example of trainingData) {
        posArray[posArrayIndex++] = example.features[0][0];
        posArray[posArrayIndex++] = example.features[1][0];
        classArray[classArrayIndex++] = maxComponent(example.label); // maxComponent is defined in network.js
    }
    examplesPosBuffer = createBuffer(gl, posArray);
    examplesClassBuffer = createBuffer(gl, classArray);
    
    examplesVAO = gl.createVertexArray();
    gl.bindVertexArray(examplesVAO);
    bindAttribute(gl, examplesPosBuffer, 0, posComponents);
    bindAttribute(gl, examplesClassBuffer, 1, classComponents);
    gl.bindVertexArray(null);
}

function convertToGlMatrix(a, m) {
    for (var i = 0; i < m.length; i++) {
        for (var j = 0; j < m[0].length; j++) {
            a[j * m.length + i] = m[i][j];
        }
    }
}

function convertToGlVector(a, m) {
    for (var i = 0; i < m.length; i++) {
        a[i] = m[i][0];
    }
}

function setWeights(net) {
    convertToGlMatrix(w0, net.weights[0]);
    convertToGlVector(b0, net.biases[0]);
    convertToGlMatrix(w1, net.weights[1]);
    convertToGlVector(b1, net.biases[1]);
}

function render() {
    var quadShaderProgram = showUncertainty ? quadSmoothShaderProgram : quadSharpShaderProgram;
    gl.useProgram(quadShaderProgram.programID);
    gl.bindVertexArray(quadVAO);
    gl.uniformMatrix2x3fv(quadShaderProgram.u_w0, false, w0);
    gl.uniform3fv(quadShaderProgram.u_b0, b0);
    gl.uniformMatrix3fv(quadShaderProgram.u_w1, false, w1);
    gl.uniform3fv(quadShaderProgram.u_b1, b1);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    gl.bindVertexArray(examplesVAO);
    gl.useProgram(examplesOutlineShaderProgram.programID);
    gl.drawArrays(gl.POINTS, 0, numExamples);
    gl.useProgram(examplesShaderProgram.programID);
    gl.drawArrays(gl.POINTS, 0, numExamples);
}

// https://github.com/mapbox/webgl-wind

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
    }
    
    return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
    var program = gl.createProgram();
    
    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program));
    }
    
    var wrapper = {programID: program};
    
    var numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (var i = 0; i < numAttributes; i++) {
        var attribute = gl.getActiveAttrib(program, i);
        wrapper[attribute.name] = gl.getAttribLocation(program, attribute.name);
    }
    var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i$1 = 0; i$1 < numUniforms; i$1++) {
        var uniform = gl.getActiveUniform(program, i$1);
        wrapper[uniform.name] = gl.getUniformLocation(program, uniform.name);
    }
    
    return wrapper;
}

function bindTexture(gl, texture, unit) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
}

// modified
function createBuffer(gl, data) {
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buffer;
}

function bindAttribute(gl, buffer, attribute, numComponents) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, numComponents, gl.FLOAT, false, 0, 0);
}
