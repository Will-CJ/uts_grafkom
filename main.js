// main.js
// Mengimpor kelas Kirlia dari file Kirlia.js
import { Kirlia } from "./character/Kirlia.js";
import { Gardevoir } from "./character/Gardevoir.js"; // <-- Import Gardevoir
import { Gallade } from "./character/Gallade.js"; // <-- Import Gardevoir

function main() {
    /** @type {HTMLCanvasElement} */
    var CANVAS = document.getElementById("mycanvas");
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;

    var GL = CANVAS.getContext("webgl", { antialias: true });
    if (!GL) {
        alert("WebGL context cannot be initialized");
        return;
    }

    /*========================= SHADERS ========================= */
    // NOTE: Shader Anda tidak menggunakan 'normal', jadi GardevoirObject akan menggunakan
    // vertex position saja. Untuk shading yang benar, Anda perlu menambahkan 'normal'
    // attribute dan uniform pencahayaan (lighting) ke shader ini.
    var shader_vertex_source = `
        attribute vec3 position;
        uniform mat4 Pmatrix, Vmatrix, Mmatrix;
        void main(void) {
            gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.0);
        }`;

    var shader_fragment_source = `
        precision mediump float;
        uniform vec3 uColor;
        void main(void) {
            gl_FragColor = vec4(uColor, 1.0);
        }`;

    function compile_shader(source, type, typeString) {
        var shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
            alert("ERROR IN " + typeString + " SHADER: " + GL.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }

    var shader_vertex = compile_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
    var shader_fragment = compile_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

    var SHADER_PROGRAM = GL.createProgram();
    GL.attachShader(SHADER_PROGRAM, shader_vertex);
    GL.attachShader(SHADER_PROGRAM, shader_fragment);
    GL.linkProgram(SHADER_PROGRAM);
    GL.useProgram(SHADER_PROGRAM);

    var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");
    GL.enableVertexAttribArray(_position);

    var _Pmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
    var _Vmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix");
    var _Mmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix");
    var _uColor = GL.getUniformLocation(SHADER_PROGRAM, "uColor"); // <-- Ambil lokasi uniform warna
    
    /*========================= OBJEK ========================= */
    
    // --- Kirlia Setup ---
    const kirlia = new Kirlia(GL, SHADER_PROGRAM, _position, _Mmatrix);
    const kirliaModelMatrix = LIBS.get_I4();
    LIBS.translateX(kirliaModelMatrix, -1.5); // Geser Kirlia ke kiri
    kirlia.setup();
    
    // --- Gardevoir Setup ---
    // Instansiasi Gardevoir dengan GL context dan lokasi Uniform/Attribute
    // Catatan: Karena shader tidak memiliki 'normal', kita lewati null.
    const gardevoir = new Gardevoir(GL, SHADER_PROGRAM, _position, _Mmatrix); 
    
    // Atur posisi global untuk Gardevoir (geser ke kanan)
    const gardevoirModelMatrix = LIBS.get_I4();
    // LIBS.translateX(gardevoirModelMatrix, 1.0); // Geser Gardevoir ke kanan
    
    // Setup objek Gardevoir (membuat mesh dan buffer)
    gardevoir.setup();

    const gallade = new Gallade(GL, SHADER_PROGRAM, _position, _Mmatrix);
    const galladeModelMatrix = LIBS.get_I4();
    LIBS.translateX(galladeModelMatrix, 1.5); // Geser Kirlia ke kiri
    gallade.setup();

    /*========================= MATRICES ========================= */
    var PROJMATRIX = LIBS.get_projection(40, CANVAS.width / CANVAS.height, 1, 100);
    var VIEWMATRIX = LIBS.get_I4();
    LIBS.translateZ(VIEWMATRIX, -7); // Tarik kamera lebih jauh agar kedua objek muat

    /*========================= MOUSE DRAG ========================= */
    var drag = false;
    var x_prev, y_prev;
    var dX = 0, dY = 0, THETA = 0, PHI = 0;
    var FRICTION = 0.05;

    CANVAS.addEventListener("mousedown", function(e) {
        drag = true;
        x_prev = e.pageX;
        y_prev = e.pageY;
        e.preventDefault();
    });
    CANVAS.addEventListener("mouseup", () => drag = false);
    CANVAS.addEventListener("mouseout", () => drag = false);
    CANVAS.addEventListener("mousemove", function(e) {
        if (!drag) return;
        dX = (e.pageX - x_prev) * 2 * Math.PI / CANVAS.width;
        dY = (e.pageY - y_prev) * 2 * Math.PI / CANVAS.height;
        THETA += dX;
        PHI += dY;
        x_prev = e.pageX;
        y_prev = e.pageY;
        e.preventDefault();
    });

    /*========================= DRAWING ========================= */
    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);
    GL.clearColor(0.0, 0.0, 0.0, 1.0);
    GL.clearDepth(1.0);

    function animate(time) {
        GL.viewport(0, 0, CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

        if (!drag) {
            dX *= (1 - FRICTION);
            dY *= (1 - FRICTION);
            THETA += dX;
            PHI += dY;
        }

        var rotation = LIBS.get_I4();
        LIBS.rotateY(rotation, THETA);
        LIBS.rotateX(rotation, PHI);

        GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
        GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);

        // 1. Kirlia (Matriks Render = Rotasi Mouse * Posisi Kirlia)
        var kirliaRenderMatrix = LIBS.multiply(rotation, kirliaModelMatrix);
        kirlia.render(kirliaRenderMatrix);

        // 2. Gardevoir (Matriks Render = Rotasi Mouse * Posisi Gardevoir)
        var gardevoirRenderMatrix = LIBS.multiply(rotation, gardevoirModelMatrix);
        // Meneruskan matriks ini sebagai 'rootMatrix' ke Gardevoir.draw
        gardevoir.render(gardevoirRenderMatrix); 

        var galladeRenderMatrix = LIBS.multiply(rotation, galladeModelMatrix);
        gallade.render(galladeRenderMatrix);

        GL.flush();
        window.requestAnimationFrame(animate);
    }
    animate(0);
}
window.addEventListener("load", main);