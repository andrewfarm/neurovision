var canvas = document.getElementById("canvas");

const gl = canvas.getContext("webgl");

if (gl) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
} else {
    document.body.innerHTML = "Your browser doesn't support WebGL.";
}
