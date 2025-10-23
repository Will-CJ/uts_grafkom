// main.js

// Mengimpor kelas karakter
import { Kirlia } from "./character/Kirlia.js";
import { Gardevoir } from "./character/Gardevoir.js";
import { Gallade } from "./character/Gallade.js";
import { Ralts } from "./character/Ralts.js"; 
// Mengimpor kelas Environment yang terpisah
import { FloatingIsland } from "./environment/FloatingIsland.js"; 
import { SkyBox } from "./environment/SkyBox.js"; 
import { Tree } from "./environment/Tree.js";
import { Grass } from "./environment/Grass.js";

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

    // Pastikan ekstensi untuk indeks 32-bit tersedia (penting untuk beberapa objek)
    var EXT = GL.getExtension("OES_element_index_uint");


    /*========================= SHADERS (I) - LIGHTING SHADER (Menggantikan Color Only) ========================= */
    var lighting_shader_vertex_source = `
        attribute vec3 position;
        attribute vec3 normal; // BARU: Input normal
        uniform mat4 Pmatrix, Vmatrix, Mmatrix;
        varying vec3 vNormal;
        varying vec3 vView; // Untuk Specular
        
        void main(void) {
            gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.0);
            // Transformasi normal hanya dengan Mmatrix, tanpa translasi (vec4(normal, 0.))
            vNormal = vec3(Mmatrix * vec4(normal, 0.)); 
            // Posisi di Eye-Space/View-Space (Mmatrix * vec4(position, 1.))
            vView = vec3(Vmatrix * Mmatrix * vec4(position, 1.0)); 
        }`;

    var lighting_shader_fragment_source = `
        precision mediump float;
        uniform vec3 uColor; // Mengambil warna objek dari JS
        varying vec3 vNormal;
        varying vec3 vView;

        // Sumber Cahaya (Bisa diubah ke uniform jika ingin digerakkan)
        const vec3 source_ambient_color  = vec3(0.2, 0.2, 0.2); // Cahaya Ambient
        const vec3 source_diffuse_color  = vec3(0.8, 0.8, 0.8); // Cahaya Diffuse (Putih)
        const vec3 source_specular_color = vec3(1.0, 1.0, 1.0);
        const vec3 source_direction      = vec3(10.0, 10.0, 10.0); // Cahaya datang dari atas (Y positif)

        // Material (Umum)
        const float mat_shininess = 10.0;
        
        void main(void) {
             vec3 N = normalize(vNormal);
             vec3 L = normalize(source_direction);
             
             // Ambient
             vec3 I_ambient = source_ambient_color * uColor;

             // Diffuse
             float diffuse_factor = max(0.0, dot(N, L));
             vec3 I_diffuse = source_diffuse_color * uColor * diffuse_factor;

             // Specular (Blinn-Phong)
             vec3 V = normalize(-vView); // Vektor ke View/Kamera
             vec3 H = normalize(L + V);  // Halfway vector
             float specular_factor = pow(max(dot(N, H), 0.0), mat_shininess);
             vec3 I_specular = source_specular_color * uColor * specular_factor;
             
             // Gabungkan dan terapkan warna
             vec3 I = I_ambient + I_diffuse + I_specular;
             gl_FragColor = vec4(I, 1.0);
        }`;

    /*========================= SHADERS (II) - Texture Based (For Skybox) ========================= */
    var skybox_shader_vertex_source = `
        attribute vec3 position;
        uniform mat4 Pmatrix, Vmatrix, Mmatrix;
        attribute vec2 uv;
        varying vec2 vUV;

        void main(void) {
            gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.);
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
    
    // --- Compile & Link LIGHTING Shader Program ---
    var lighting_shader_vertex = compile_shader(lighting_shader_vertex_source, GL.VERTEX_SHADER, "LIGHTING VERTEX");
    var lighting_shader_fragment = compile_shader(lighting_shader_fragment_source, GL.FRAGMENT_SHADER, "LIGHTING FRAGMENT");
    
    if (lighting_shader_vertex === null || lighting_shader_fragment === null) return;

    var LIGHTING_SHADER_PROGRAM = GL.createProgram();
    GL.attachShader(LIGHTING_SHADER_PROGRAM, lighting_shader_vertex);
    GL.attachShader(LIGHTING_SHADER_PROGRAM, lighting_shader_fragment);
    GL.linkProgram(LIGHTING_SHADER_PROGRAM);
    
    // --- Compile & Link Skybox Shader Program ---
    var skybox_shader_vertex = compile_shader(skybox_shader_vertex_source, GL.VERTEX_SHADER, "SKYBOX VERTEX");
    var skybox_shader_fragment = compile_shader(skybox_shader_fragment_source, GL.FRAGMENT_SHADER, "SKYBOX FRAGMENT");
    
    if (skybox_shader_vertex === null || skybox_shader_fragment === null) return;

    var SKYBOX_SHADER_PROGRAM = GL.createProgram();
    GL.attachShader(SKYBOX_SHADER_PROGRAM, skybox_shader_vertex);
    GL.attachShader(SKYBOX_SHADER_PROGRAM, skybox_shader_fragment);
    GL.linkProgram(SKYBOX_SHADER_PROGRAM);
    
    // Set up default program and get locations
    GL.useProgram(LIGHTING_SHADER_PROGRAM);
    
    // --- LOKASI UNIFORM/ATTRIBUTE LIGHTING SHADER ---
    var _position = GL.getAttribLocation(LIGHTING_SHADER_PROGRAM, "position");
    var _normal = GL.getAttribLocation(LIGHTING_SHADER_PROGRAM, "normal"); // LOKASI NORMAL BARU
    
    GL.enableVertexAttribArray(_position);
    GL.enableVertexAttribArray(_normal); // AKTIFKAN NORMAL

    var _Pmatrix = GL.getUniformLocation(LIGHTING_SHADER_PROGRAM, "Pmatrix");
    var _Vmatrix = GL.getUniformLocation(LIGHTING_SHADER_PROGRAM, "Vmatrix");
    var _Mmatrix = GL.getUniformLocation(LIGHTING_SHADER_PROGRAM, "Mmatrix");
    var _uColor = GL.getUniformLocation(LIGHTING_SHADER_PROGRAM, "uColor"); 
    
    // Dapatkan LOKASI ATRIBUT/UNIFORM Skybox
    var _sky_position = GL.getAttribLocation(SKYBOX_SHADER_PROGRAM, "position");
    var _sky_uv = GL.getAttribLocation(SKYBOX_SHADER_PROGRAM, "uv");
    var _sky_sampler = GL.getUniformLocation(SKYBOX_SHADER_PROGRAM, "sampler");
    
    GL.useProgram(SKYBOX_SHADER_PROGRAM);
    GL.uniform1i(_sky_sampler, 0);
    GL.enableVertexAttribArray(_sky_position);
    GL.enableVertexAttribArray(_sky_uv);
    
    GL.useProgram(LIGHTING_SHADER_PROGRAM);

    /*========================= OBJEK SETUP - CHARACTERS ========================= */
    const GRASS_OFFSET = 0.01;

    // SEMUA OBJEK MENGGUNAKAN LIGHTING_SHADER_PROGRAM
    const ralts = new Ralts(GL, LIGHTING_SHADER_PROGRAM, _position, _Mmatrix, _normal); // Tambah _normal
    const raltsModelMatrix = LIBS.get_I4();
    LIBS.translateX(raltsModelMatrix, -3.0);
    LIBS.translateY(raltsModelMatrix, 0.43);
    LIBS.scale(raltsModelMatrix, 1.5, 1.5, 1.5);
    ralts.setup();
    
    const kirlia = new Kirlia(GL, LIGHTING_SHADER_PROGRAM, _position, _Mmatrix, _normal); // Tambah _normal
    const kirliaModelMatrix = LIBS.get_I4();
    LIBS.translateX(kirliaModelMatrix, -1.0);
    LIBS.translateY(kirliaModelMatrix, 0.6);
    LIBS.scale(kirliaModelMatrix, 1.2, 1.2, 1.2);
    kirlia.setup();
    
    const gardevoir = new Gardevoir(GL, LIGHTING_SHADER_PROGRAM, _position, _Mmatrix, _normal); // Tambah _normal
    const gardevoirModelMatrix = LIBS.get_I4();
    LIBS.translateX(gardevoirModelMatrix, 1.0);
    LIBS.translateY(gardevoirModelMatrix, -1.0);
    gardevoir.setGlobalRotation(
        [1, 1, 0], 
        [0, 3, 4] 
    );
    gardevoir.setup();

    const gallade = new Gallade(GL, LIGHTING_SHADER_PROGRAM, _position, _Mmatrix, _normal); // Tambah _normal
    const galladeModelMatrix = LIBS.get_I4();
    LIBS.translateX(galladeModelMatrix, 3.0);
    LIBS.translateY(galladeModelMatrix, 0.2 + GRASS_OFFSET);
    gallade.setup();

// ----------------------------------------------------------------------

    /*========================= ENVIRONMENT SETUP ========================= */

    // INISIALISASI PULAU
    const floatingIsland = new FloatingIsland(GL, LIGHTING_SHADER_PROGRAM, _position, _Mmatrix, _normal); // Tambah _normal
    const islandModelMatrix = floatingIsland.MODEL_MATRIX;
    LIBS.translateY(islandModelMatrix, -0.1); 

    // INISIALISASI SKYBOX
    const skybox = new SkyBox(
        GL, 
        SKYBOX_SHADER_PROGRAM, 
        _sky_position, 
        _sky_uv, 
        _sky_sampler
    ); 
    
    // --- INISIALISASI POHON ---
    const tree = new Tree(GL, LIGHTING_SHADER_PROGRAM, _position, _Mmatrix, _normal); // Tambah _normal
    const treeModelMatrix = LIBS.get_I4();

    // Geser pohon agar muncul di belakang Kirlia, di Y=0
    LIBS.rotateY(treeModelMatrix, Math.PI); 
    LIBS.translateZ(treeModelMatrix, -2.0);
    LIBS.translateY(treeModelMatrix, -0.5); 
    LIBS.translateX(treeModelMatrix, -2.5); 
    tree.setup();

    // --- INISIALISASI RUMPUT 3D BARU ---
    const grass = new Grass(GL, LIGHTING_SHADER_PROGRAM, _position, _Mmatrix, _normal, floatingIsland); // Tambah _normal dan floatingIsland
    grass.setup(); 

// ----------------------------------------------------------------------

    /*========================= MATRICES & CONTROLS ========================= */
    var PROJMATRIX = LIBS.get_projection(40, CANVAS.width / CANVAS.height, 1, 100);
    var VIEWMATRIX = LIBS.get_I4();
    LIBS.translateZ(VIEWMATRIX, -8);

    // MOUSE LOOK CONTROLS (tidak berubah)
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

    // KEYBOARD CONTROLS STATE (WASD, Spasi/Ctrl)
    let keys = {};
    let isWalking = false;

    // Kirlia animation sequence start (every 15 seconds)
    setInterval(() => { kirlia.runAnimation(); }, 15000);
    setInterval(() => { ralts.runAnimation(); }, 5000);

    let globalTime = 0.0;
    let lastTime = 0;
    const cameraSpeed = 5.0;

    document.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        keys[key] = true;

        if (key === 'p') { isWalking = true; }
    });

    document.addEventListener('keyup', (event) => {
        const key = event.key.toLowerCase();
        keys[key] = false;

        if (key === 'p') { isWalking = false; }
    });
    
    /*========================= DRAWING ========================= */
    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);
    GL.clearColor(0.0, 0.0, 0.0, 1.0);
    GL.clearDepth(1.0);

    function animate(time) {
        const elapsed = (time - lastTime) / 1000;
        lastTime = time;
        
        globalTime += elapsed;

        GL.viewport(0, 0, CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

        // MOUSE LOOK ROTATION
        if (!drag) {
            dX *= (1 - FRICTION);
            dY *= (1 - FRICTION);
            THETA += dX;
            PHI += dY;
        }

        var mouseRotationMatrix = LIBS.get_I4();
        LIBS.rotateY(mouseRotationMatrix, THETA);
        LIBS.rotateX(mouseRotationMatrix, PHI);

        // --- WASD & Vertical Movement ---
        let camTranslation = LIBS.get_I4();

        const dist = cameraSpeed * elapsed;
        
        if (keys['w']) { LIBS.translateZ(camTranslation, dist); }
        if (keys['s']) { LIBS.translateZ(camTranslation, -dist); }
        if (keys['a']) { LIBS.translateX(camTranslation, dist); }
        if (keys['d']) { LIBS.translateX(camTranslation, -dist); }
        if (keys[' ']) { LIBS.translateY(camTranslation, -dist); }
        if (keys['control']) { LIBS.translateY(camTranslation, dist); }
        
        VIEWMATRIX = LIBS.multiply(camTranslation, VIEWMATRIX);

        var finalViewMatrix = LIBS.multiply(mouseRotationMatrix, VIEWMATRIX);

        /*========================= 1. SKYBOX DRAW ========================= */
        
        // Atur program ke Skybox
        GL.useProgram(SKYBOX_SHADER_PROGRAM);
        
        // Buat Matriks View hanya dengan Rotasi (untuk Skybox agar tidak bergerak)
        var V_TEMP = LIBS.get_I4(); 
        V_TEMP = LIBS.multiply(mouseRotationMatrix, V_TEMP);
        
        // Panggil render Skybox
        skybox.render(PROJMATRIX, V_TEMP);

        /*========================= 2. SCENE OBJECTS DRAW ========================= */
        
        // Atur program ke Lighting
        GL.useProgram(LIGHTING_SHADER_PROGRAM);
        GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
        GL.uniformMatrix4fv(_Vmatrix, false, finalViewMatrix);
        
        /*--- FLOATING ISLAND DRAW ---*/
        floatingIsland.render();

        /*--- POHON DRAW ---*/
        tree.render(treeModelMatrix);

        /*--- CHARACTER DRAW ---*/
       
        ralts.render(raltsModelMatrix, time);
        kirlia.render(kirliaModelMatrix, time);

        // Gardevoir
        gardevoir.render(gardevoirModelMatrix, time);
        gardevoir.updateGlobalMovement(elapsed, gardevoirModelMatrix);

        // Gallade
        gallade.render(galladeModelMatrix);

        /*--- RUMPUT 3D DRAW (Menggunakan Matriks Pulau sebagai Parent) ---*/
        grass.render(islandModelMatrix);

        GL.flush();
        window.requestAnimationFrame(animate);
    }
    window.requestAnimationFrame(animate);
}
window.addEventListener("load", main);