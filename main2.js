// main.js
// Mengimpor kelas Kirlia dari file Kirlia.js
import { Kirlia } from "./character/Kirlia.js";
import { Gardevoir } from "./character/Gardevoir.js";
import { Gallade } from "./character/Gallade.js";
import { Ralts } from "./character/Ralts.js"; 

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

    /*========================= SHADERS (I) - Color Only (For Characters/Floor) ========================= */
    var color_shader_vertex_source = `
        attribute vec3 position;
        uniform mat4 Pmatrix, Vmatrix, Mmatrix;
        void main(void) {
            gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.0);
        }`;

    var color_shader_fragment_source = `
        precision mediump float;
        uniform vec3 uColor;
        void main(void) {
            gl_FragColor = vec4(uColor, 1.0);
        }`;

    /*========================= SHADERS (II) - Texture Based (For Skybox) ========================= */
    var skybox_shader_vertex_source = `
        attribute vec3 position;
        uniform mat4 Pmatrix, Vmatrix, Mmatrix;
        attribute vec2 uv;
        varying vec2 vUV;

        void main(void) {
            gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.);
            // KEY TRICK: Set Z to W to ensure the skybox is drawn at max depth, appearing infinite
            gl_Position.z = gl_Position.w; 
            vUV = uv;
        }`;

    var skybox_shader_fragment_source = `
        precision mediump float;
        uniform sampler2D sampler;
        varying vec2 vUV;

        void main(void) {
            gl_FragColor = texture2D(sampler, vUV);
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
    
    // --- Compile & Link Color Shader Program ---
    var color_shader_vertex = compile_shader(color_shader_vertex_source, GL.VERTEX_SHADER, "COLOR VERTEX");
    var color_shader_fragment = compile_shader(color_shader_fragment_source, GL.FRAGMENT_SHADER, "COLOR FRAGMENT");
    var COLOR_SHADER_PROGRAM = GL.createProgram();
    GL.attachShader(COLOR_SHADER_PROGRAM, color_shader_vertex);
    GL.attachShader(COLOR_SHADER_PROGRAM, color_shader_fragment);
    GL.linkProgram(COLOR_SHADER_PROGRAM);
    
    // --- Compile & Link Skybox Shader Program ---
    var skybox_shader_vertex = compile_shader(skybox_shader_vertex_source, GL.VERTEX_SHADER, "SKYBOX VERTEX");
    var skybox_shader_fragment = compile_shader(skybox_shader_fragment_source, GL.FRAGMENT_SHADER, "SKYBOX FRAGMENT");
    var SKYBOX_SHADER_PROGRAM = GL.createProgram();
    GL.attachShader(SKYBOX_SHADER_PROGRAM, skybox_shader_vertex);
    GL.attachShader(SKYBOX_SHADER_PROGRAM, skybox_shader_fragment);
    GL.linkProgram(SKYBOX_SHADER_PROGRAM);
    
    // Set up default program and get locations
    GL.useProgram(COLOR_SHADER_PROGRAM); 
    
    var _position = GL.getAttribLocation(COLOR_SHADER_PROGRAM, "position");
    GL.enableVertexAttribArray(_position);
    var _Pmatrix = GL.getUniformLocation(COLOR_SHADER_PROGRAM, "Pmatrix");
    var _Vmatrix = GL.getUniformLocation(COLOR_SHADER_PROGRAM, "Vmatrix");
    var _Mmatrix = GL.getUniformLocation(COLOR_SHADER_PROGRAM, "Mmatrix");
    var _uColor = GL.getUniformLocation(COLOR_SHADER_PROGRAM, "uColor"); 
    
    var _sky_position = GL.getAttribLocation(SKYBOX_SHADER_PROGRAM, "position");
    var _sky_Pmatrix = GL.getUniformLocation(SKYBOX_SHADER_PROGRAM, "Pmatrix");
    var _sky_Vmatrix = GL.getUniformLocation(SKYBOX_SHADER_PROGRAM, "Vmatrix");
    var _sky_Mmatrix = GL.getUniformLocation(SKYBOX_SHADER_PROGRAM, "Mmatrix");
    var _sky_uv = GL.getAttribLocation(SKYBOX_SHADER_PROGRAM, "uv");
    var _sky_sampler = GL.getUniformLocation(SKYBOX_SHADER_PROGRAM, "sampler");
    
    GL.useProgram(SKYBOX_SHADER_PROGRAM);
    GL.uniform1i(_sky_sampler, 0); 
    GL.enableVertexAttribArray(_sky_position);
    GL.enableVertexAttribArray(_sky_uv);
    
    GL.useProgram(COLOR_SHADER_PROGRAM); 

    /*========================= OBJEK SETUP - CHARACTERS ========================= */
    
    const ralts = new Ralts(GL, COLOR_SHADER_PROGRAM, _position, _Mmatrix);
    const raltsModelMatrix = LIBS.get_I4();
    LIBS.translateX(raltsModelMatrix, -3.0); 
    LIBS.translateY(raltsModelMatrix, -0.9); 
    LIBS.scale(raltsModelMatrix, 1.5, 1.5, 1.5);
    ralts.setup();
    
    const kirlia = new Kirlia(GL, COLOR_SHADER_PROGRAM, _position, _Mmatrix);
    const kirliaModelMatrix = LIBS.get_I4();
    LIBS.translateX(kirliaModelMatrix, -1.0); 
    LIBS.translateY(kirliaModelMatrix, -0.7); 
    LIBS.scale(kirliaModelMatrix, 1.2, 1.2, 1.2);
    kirlia.setup();
    
    const gardevoir = new Gardevoir(GL, COLOR_SHADER_PROGRAM, _position, _Mmatrix); 
    const gardevoirModelMatrix = LIBS.get_I4();
    LIBS.translateX(gardevoirModelMatrix, 1.0); 
    LIBS.translateY(gardevoirModelMatrix, -1.0); 
    gardevoir.setup();

    const gallade = new Gallade(GL, COLOR_SHADER_PROGRAM, _position, _Mmatrix);
    const galladeModelMatrix = LIBS.get_I4();
    LIBS.translateX(galladeModelMatrix, 3.0); 
    LIBS.translateY(galladeModelMatrix, -1.1); 
    gallade.setup();

// ----------------------------------------------------------------------

    /*========================= ENVIRONMENT SETUP - FLOOR ========================= */
    const floorVertices = [
        -100.0, 0.0, -100.0, 
         100.0, 0.0, -100.0, 
         100.0, 0.0,  100.0, 
        -100.0, 0.0,  100.0, 
    ];

    const floorIndices = [
        0, 1, 2, 
        2, 3, 0, 
    ];

    const floorVertexBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, floorVertexBuffer);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(floorVertices), GL.STATIC_DRAW);

    const floorIndexBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, floorIndexBuffer);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(floorIndices), GL.STATIC_DRAW);
    
    const floorModelMatrix = LIBS.get_I4();
    LIBS.translateY(floorModelMatrix, -1.4); 

// ----------------------------------------------------------------------

    /*======================== ENVIRONMENT SETUP - SKYBOX GEOMETRY & BUFFERS ======================== */
    var cube_vertex = [
        // Format: x,y,z, u,v (5 components per vertex)
        // belakang
        -1,-1,-1,    1,1/3,
        1,-1,-1,    3/4,1/3,
        1, 1,-1,    3/4,2/3,
        -1, 1,-1,    1,2/3,
        // depan
        -1,-1, 1,    1/4,1/3,
        1,-1, 1,    2/4,1/3,
        1, 1, 1,    2/4,2/3,
        -1, 1, 1,    1/4,2/3,
        // kiri
        -1,-1,-1,    0,1/3,
        -1, 1,-1,    0,2/3,
        -1, 1, 1,    1/4,2/3,
        -1,-1, 1,    1/4,1/3,
        // kanan
        1,-1,-1,    3/4,1/3,
        1, 1,-1,    3/4,2/3,
        1, 1, 1,    2/4,2/3,
        1,-1, 1,    2/4,1/3,
        // bawah
        -1,-1,-1,    1/4,0,
        -1,-1, 1,    1/4,1/3,
        1,-1, 1,    2/4,1/3,
        1,-1,-1,    2/4,0,
        // atas
        -1, 1,-1,    1/4,1,
        -1, 1, 1,    1/4,2/3,
        1, 1, 1,    2/4,2/3,
        1, 1,-1,    2/4,1
    ];

    let scale = 100;
    for (let i = 0; i < cube_vertex.length; i+=5) {
        cube_vertex[i] *= scale;
        cube_vertex[i+1] *= scale;
        cube_vertex[i+2] *= scale;
    }

    var cube_faces = [
        0, 1, 2,  0, 2, 3,
        4, 5, 6,  4, 6, 7,
        8, 9,10,  8,10,11,
        12,13,14, 12,14,15,
        16,17,18, 16,18,19,
        20,21,22, 20,22,23
    ];

    var CUBE_VERTEX = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, CUBE_VERTEX);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(cube_vertex), GL.STATIC_DRAW);

    var CUBE_FACES = GL.createBuffer();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(cube_faces), GL.STATIC_DRAW);
    
    var skyboxModelMatrix = LIBS.get_I4(); 
    LIBS.translateY(skyboxModelMatrix, -3.0); 

// ----------------------------------------------------------------------

    /*========================= TEXTURES =========================*/
    var load_texture = function (image_URL) {
        var texture = GL.createTexture();
        var image = new Image();

        image.src = image_URL;
        image.onload = function () {
            GL.bindTexture(GL.TEXTURE_2D, texture);
            GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
            GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
            GL.bindTexture(GL.TEXTURE_2D, null);
        };
        return texture;
    };

    var cube_texture = load_texture("skybox.png");

// ----------------------------------------------------------------------

    /*========================= MATRICES & CONTROLS ========================= */
    var PROJMATRIX = LIBS.get_projection(40, CANVAS.width / CANVAS.height, 1, 100);
    var VIEWMATRIX = LIBS.get_I4();
    LIBS.translateZ(VIEWMATRIX, -10); 

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

    // --- Keyboard listener to trigger the bowing animation ---
    window.addEventListener("keydown", function(e) {
        if (e.key === 'b' || e.key === 'B') {
            kirlia.bowing();
        }
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

        /*========================= 1. SKYBOX DRAW (DRAW FIRST) ========================= */
        
        GL.useProgram(SKYBOX_SHADER_PROGRAM); 
        
        GL.uniformMatrix4fv(_sky_Pmatrix, false, PROJMATRIX);
        GL.uniformMatrix4fv(_sky_Vmatrix, false, VIEWMATRIX);
        
        var skyboxRenderMatrix = LIBS.multiply(rotation, skyboxModelMatrix);
        GL.uniformMatrix4fv(_sky_Mmatrix, false, skyboxRenderMatrix);

        // Bind Buffers
        GL.bindBuffer(GL.ARRAY_BUFFER, CUBE_VERTEX);
        GL.vertexAttribPointer(_sky_position, 3, GL.FLOAT, false, 4 * 5, 0); 
        GL.vertexAttribPointer(_sky_uv, 2, GL.FLOAT, false, 4 * 5, 4 * 3);
        
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
        
        // Bind Texture and Draw
        GL.activeTexture(GL.TEXTURE0);
        GL.bindTexture(GL.TEXTURE_2D, cube_texture);
        GL.drawElements(GL.TRIANGLES, cube_faces.length, GL.UNSIGNED_SHORT, 0);

        /*========================= 2. SCENE OBJECTS DRAW (CHARACTERS & FLOOR) ========================= */
        
        GL.useProgram(COLOR_SHADER_PROGRAM); 

        // Set the projection and view matrices for all objects
        GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
        GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
        
        /*--- FLOOR DRAW ---*/
        var floorRenderMatrix = LIBS.multiply(rotation, floorModelMatrix);
        GL.uniformMatrix4fv(_Mmatrix, false, floorRenderMatrix);
        GL.uniform3fv(_uColor, [0.4, 0.5, 0.4]); 

        GL.bindBuffer(GL.ARRAY_BUFFER, floorVertexBuffer);
        GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 0, 0); 
        
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, floorIndexBuffer);
        GL.drawElements(GL.TRIANGLES, floorIndices.length, GL.UNSIGNED_SHORT, 0);

        /*--- CHARACTER DRAW ---*/
        
        // Ralts
        var raltsRenderMatrix = LIBS.multiply(rotation, raltsModelMatrix);
        ralts.render(raltsRenderMatrix);
        
        // Kirlia 
        var kirliaRenderMatrix = LIBS.multiply(rotation, kirliaModelMatrix);
        kirlia.render(kirliaRenderMatrix, time);

        // Gardevoir 
        var gardevoirRenderMatrix = LIBS.multiply(rotation, gardevoirModelMatrix);
        gardevoir.render(gardevoirRenderMatrix); 

        // Gallade
        var galladeRenderMatrix = LIBS.multiply(rotation, galladeModelMatrix);
        gallade.render(galladeRenderMatrix);

        GL.flush();
        window.requestAnimationFrame(animate);
    }
    window.requestAnimationFrame(animate);
}
window.addEventListener("load", main);