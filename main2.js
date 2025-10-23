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

    /*========================= SHADERS (I) - Color Only (For Characters/Island) ========================= */
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
    
    if (color_shader_vertex === null || color_shader_fragment === null) return; 

    var COLOR_SHADER_PROGRAM = GL.createProgram();
    GL.attachShader(COLOR_SHADER_PROGRAM, color_shader_vertex);
    GL.attachShader(COLOR_SHADER_PROGRAM, color_shader_fragment);
    GL.linkProgram(COLOR_SHADER_PROGRAM);
    
    // --- Compile & Link Skybox Shader Program ---
    var skybox_shader_vertex = compile_shader(skybox_shader_vertex_source, GL.VERTEX_SHADER, "SKYBOX VERTEX");
    var skybox_shader_fragment = compile_shader(skybox_shader_fragment_source, GL.FRAGMENT_SHADER, "SKYBOX FRAGMENT");
    
    if (skybox_shader_vertex === null || skybox_shader_fragment === null) return;

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
    // Ketinggian karakter disesuaikan agar berdiri di atas permukaan datar pulau (Y=0.0)
    const GRASS_OFFSET = 0.01;

    const ralts = new Ralts(GL, COLOR_SHADER_PROGRAM, _position, _Mmatrix);
    const raltsModelMatrix = LIBS.get_I4();
    LIBS.translateX(raltsModelMatrix, -3.0); 
    LIBS.translateY(raltsModelMatrix, 0.4); 
    LIBS.scale(raltsModelMatrix, 1.5, 1.5, 1.5);
    ralts.setup();
    
    const kirlia = new Kirlia(GL, COLOR_SHADER_PROGRAM, _position, _Mmatrix);
    const kirliaModelMatrix = LIBS.get_I4();
    LIBS.translateX(kirliaModelMatrix, -1.0); 
    LIBS.translateY(kirliaModelMatrix, 0.6); 
    LIBS.scale(kirliaModelMatrix, 1.2, 1.2, 1.2);
    kirlia.setup();
    
    const gardevoir = new Gardevoir(GL, COLOR_SHADER_PROGRAM, _position, _Mmatrix); 
    const gardevoirModelMatrix = LIBS.get_I4();
    LIBS.translateX(gardevoirModelMatrix, 1.0); 
    LIBS.translateY(gardevoirModelMatrix, -1.0); 
    gardevoir.setGlobalRotation(
        [1, 1, 0],       // Sumbu rotasi (miring)
        [0, 3, 4]        // Pusat rotasi
    );
    gardevoir.setup();

    const gallade = new Gallade(GL, COLOR_SHADER_PROGRAM, _position, _Mmatrix);
    const galladeModelMatrix = LIBS.get_I4();
    LIBS.translateX(galladeModelMatrix, 3.0); 
    LIBS.translateY(galladeModelMatrix, 0.2 + GRASS_OFFSET); 
    gallade.setup();

// ----------------------------------------------------------------------

    /*========================= ENVIRONMENT SETUP - FLOATING ISLAND MESH (DATAR & MELINGKAR KASAR) ========================= */

        const islandSize = 10.0; // Diameter maksimum pulau (dasar batu)
        const islandResolution = 40; // Resolusi (jumlah segmen di lingkaran)
        const bottomDepth = 6.0; // Lebih panjang ke bawah

        // Kontrol ukuran permukaan rumput
        // const GRASS_RADIUS_FACTOR = 0.8; // Hapus atau jadikan 1.0 jika tidak ingin membatasi rumput
        const GRASS_HEIGHT = 0.01;

        // Kumpulkan faktor acak untuk lapisan teratas batu agar bisa digunakan juga untuk rumput
        const randomFactors = []; 

        // Hitung radius dasar yang digunakan lapisan batu teratas (sebelum variasi acak)
        const maxBottomRadius = islandSize / 2; // Radius penuh (5.0)
    
        // Permukaan Datar Atas (Bentuk melingkar kasar) - KINI MENGIKUTI TEPI LAPISAN BATU TERATAS
        const islandTopVertices = [];
        const islandTopIndices = [];
    
        // Vertex tengah (Pusat lingkaran)
        islandTopVertices.push(0.0, GRASS_HEIGHT, 0.0); 
        const centerIndex = 0;

        // Vertex di lingkaran luar (Tepi kasar)
        const numSegments = islandResolution;

        // Gunakan maxBottomRadius sebagai basis radius rumput
        const baseRadiusForGrass = maxBottomRadius; 

        for (let i = 0; i < numSegments; i++) {
            const angle = i * 2 * Math.PI / numSegments;

            // Variasi acak yang SAMA digunakan untuk Rumput dan Lapisan Batu Teratas
            // Range: 0.8 sampai 1.1 dari radius BARU
            const randomFactor = Math.random() * 0.3 + 0.8; 
            randomFactors.push(randomFactor); // Simpan faktor acak

            const currentRadius = baseRadiusForGrass * randomFactor; 

            const x = Math.cos(angle) * currentRadius;
            const z = Math.sin(angle) * currentRadius;

            islandTopVertices.push(x, GRASS_HEIGHT, z); // Y tetap di GRASS_HEIGHT
        }

        // Index untuk menghubungkan ke tengah (membuat Triangle Fan)
        for (let i = 0; i < numSegments; i++) {
            const p1 = centerIndex + 1 + i;
            const p2 = centerIndex + 1 + ((i + 1) % numSegments);
        islandTopIndices.push(centerIndex, p1, p2); 
        }

        const islandTopVertexBuffer = GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, islandTopVertexBuffer);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(islandTopVertices), GL.STATIC_DRAW);
    
        const islandTopIndexBuffer = GL.createBuffer();
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, islandTopIndexBuffer);
        GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(islandTopIndices), GL.STATIC_DRAW);
    
    
        // Bagian Bawah Kasar/Organik (Bentuk kerucut dengan variasi)
        const islandBottomVertices = [];
        const islandBottomIndices = [];

        const numRadialSegments = islandResolution; // Segmen horizontal
        const numVerticalSegments = 5; // Segmen vertikal (lapisan)
    
        for (let i = 0; i <= numVerticalSegments; i++) {
            const v = i / numVerticalSegments; // Nilai vertikal dari 0 (atas) ke 1 (bawah)

            // Kontrol radius: Mulai dari maxBottomRadius (di y=0) dan mengecil ke bawah (efek kerucut)
            // const maxBottomRadius = islandSize / 2; // Sudah didefinisikan di atas!
            const minRadiusFactor = 0.3; // Radius di paling bawah adalah 30% dari radius atas
            const currentRadius = maxBottomRadius * (1 - v * (1 - minRadiusFactor));

            let base_y = -bottomDepth * v;

            for (let j = 0; j < numRadialSegments; j++) {
                const angle = j * 2 * Math.PI / numRadialSegments;

                let randomFactor;
                if (i === 0) {
                    // Gunakan faktor acak yang SAMA dengan Rumput
                    randomFactor = randomFactors[j]; 
                } else {
                    // Variasi acak yang unik untuk lapisan bawah (Range: 0.8 - 1.1)
                    randomFactor = Math.random() * 0.3 + 0.8; 
                }

                const x = Math.cos(angle) * currentRadius * randomFactor;
                const z = Math.sin(angle) * currentRadius * randomFactor;
    
                // Variasi Y (semakin ke bawah semakin besar variasi)
                const y_variation = (Math.random() - 0.5) * 0.5 * (v * v) * bottomDepth/8;
                let y = base_y + y_variation; 

                // Lapisan teratas batu harus berada di Y=0.0, tepat di bawah rumput 0.01
                if (i === 0) y = 0.0 + y_variation * 0.1; // Gunakan sedikit variasi Y
                islandBottomVertices.push(x, y, z); 
            }
        }
    
    const numBottomVerticesPerLayer = numRadialSegments; 

    // Tambahkan vertex pusat di bagian bawah (ujung kerucut/dasar)
    islandBottomVertices.push(0.0, -bottomDepth * 1.05, 0.0);
    const bottomCenterIndex = islandBottomVertices.length / 3 - 1; 

    // === Menghubungkan lapisan-lapisan (Dinding Bawah) ===
    for (let i = 0; i < numVerticalSegments; i++) {
        for (let j = 0; j < numRadialSegments; j++) {
            const p0 = i * numBottomVerticesPerLayer + j; 
            const p1 = i * numBottomVerticesPerLayer + ((j + 1) % numRadialSegments); 
            const p2 = (i + 1) * numBottomVerticesPerLayer + j; 
            const p3 = (i + 1) * numBottomVerticesPerLayer + ((j + 1) % numRadialSegments); 
            
            // Segitiga 1 
            islandBottomIndices.push(p0, p2, p1);
            // Segitiga 2 
            islandBottomIndices.push(p1, p2, p3);
        }
    }
    
    // === Menghubungkan lapisan terbawah ke pusat bawah ===
    const lastLayerStartIndex = numVerticalSegments * numBottomVerticesPerLayer;
    for (let j = 0; j < numRadialSegments; j++) {
        const p0 = lastLayerStartIndex + j;
        const p1 = lastLayerStartIndex + ((j + 1) % numRadialSegments);
        
        // Hubungkan (p1, p0, bottomCenterIndex)
        islandBottomIndices.push(p1, p0, bottomCenterIndex); 
    }
    
    // --- BUFFERS GABUNGAN ---

    const numTopVertices = numSegments + 1;
    const allVertices = islandTopVertices.concat(islandBottomVertices);
    
    // 1. Buat index untuk Dinding Samping (Side Walls) - Menghubungkan Top Edge ke Bottom Layer 0
    const sideWallIndices = [];
    const firstTopVertexIndex = 1; 
    const firstBottomLayerVertexIndex = numTopVertices; 

    for (let j = 0; j < numSegments; j++) {
        const top_p0 = firstTopVertexIndex + j;
        const top_p1 = firstTopVertexIndex + ((j + 1) % numSegments);
        
        const bottom_p0 = firstBottomLayerVertexIndex + j;
        const bottom_p1 = firstBottomLayerVertexIndex + ((j + 1) % numSegments);
        
        // Segitiga 1: [Top-p1, Bottom-p1, Top-p0] (Dinding)
        sideWallIndices.push(top_p1, bottom_p1, top_p0); 
        // Segitiga 2: [Top-p0, Bottom-p1, Bottom-p0] (Dinding)
        sideWallIndices.push(top_p0, bottom_p1, bottom_p0); 
    }

    // 2. Buat index untuk Bagian Bawah Organik & Dasar (Offsetting)
    const actualBottomIndices = [];
    for (const index of islandBottomIndices) {
         if (index === bottomCenterIndex) {
             actualBottomIndices.push(bottomCenterIndex + numTopVertices);
         } else {
             actualBottomIndices.push(index + numTopVertices);
         }
    }

    const finalBottomIndices = sideWallIndices.concat(actualBottomIndices);
    
    const islandBottomVertexBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, islandBottomVertexBuffer);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(allVertices), GL.STATIC_DRAW);

    const islandBottomIndexBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, islandBottomIndexBuffer);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(finalBottomIndices), GL.STATIC_DRAW);

    // Matriks Model untuk seluruh pulau (Top dan Bottom)
    const islandModelMatrix = LIBS.get_I4();
    const initialIslandY = -4.0; // Pindahkan ke bawah

// ----------------------------------------------------------------------

    /*======================== ENVIRONMENT SETUP - SKYBOX GEOMETRY & BUFFERS ======================== */
    var cube_vertex = [
        // Format: x,y,z, u,v (5 components per vertex)
        // belakang
        -1,-1,-1,    1,1/3, 1,-1,-1,    3/4,1/3, 1, 1,-1,    3/4,2/3, -1, 1,-1,    1,2/3,
        // depan
        -1,-1, 1,    1/4,1/3, 1,-1, 1,    2/4,1/3, 1, 1, 1,    2/4,2/3, -1, 1, 1,    1/4,2/3,
        // kiri
        -1,-1,-1,    0,1/3, -1, 1,-1,    0,2/3, -1, 1, 1,    1/4,2/3, -1,-1, 1,    1/4,1/3,
        // kanan
        1,-1,-1,    3/4,1/3, 1, 1,-1,    3/4,2/3, 1, 1, 1,    2/4,2/3, 1,-1, 1,    2/4,1/3,
        // bawah
        -1,-1,-1,    1/4,0, -1,-1, 1,    1/4,1/3, 1,-1, 1,    2/4,1/3, 1,-1,-1,    2/4,0,
        // atas
        -1, 1,-1,    1/4,1, -1, 1, 1,    1/4,2/3, 1, 1, 1,    2/4,2/3, 1, 1,-1,    2/4,1
    ];

    let scale = 100;
    for (let i = 0; i < cube_vertex.length; i+=5) {
        cube_vertex[i] *= scale;
        cube_vertex[i+1] *= scale;
        cube_vertex[i+2] *= scale;
    }

    var cube_faces = [
        0, 1, 2,  0, 2, 3, 4, 5, 6,  4, 6, 7, 8, 9,10,  8,10,11,
        12,13,14, 12,14,15, 16,17,18, 16,18,19, 20,21,22, 20,22,23
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
    LIBS.translateZ(VIEWMATRIX, -8); 

    // MOUSE LOOK CONTROLS
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

    setInterval(() => { kirlia.runAnimation(); }, 15000);

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

    const floatSpeed = 0.5;
    const floatMagnitude = 0.1;

    function animate(time) {
        const elapsed = (time - lastTime) / 1000; 
        lastTime = time;
        
        globalTime += elapsed; 

        GL.viewport(0, 0, CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

        // MOUSE LOOK ROTATION (sama)
        if (!drag) {
            dX *= (1 - FRICTION);
            dY *= (1 - FRICTION);
            THETA += dX;
            PHI += dY;
        }

        var mouseRotationMatrix = LIBS.get_I4();
        LIBS.rotateY(mouseRotationMatrix, THETA);
        LIBS.rotateX(mouseRotationMatrix, PHI);

        // --- WASD & Vertical Movement (sama) ---
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
        
        GL.useProgram(SKYBOX_SHADER_PROGRAM); 
        
        GL.uniformMatrix4fv(_sky_Pmatrix, false, PROJMATRIX);
        // Hapus translasi kamera dari VMatrix agar skybox tetap di tengah
        var V_TEMP = LIBS.get_I4(); 
        V_TEMP = LIBS.multiply(mouseRotationMatrix, V_TEMP);
        GL.uniformMatrix4fv(_sky_Vmatrix, false, V_TEMP);
        GL.uniformMatrix4fv(_sky_Mmatrix, false, skyboxModelMatrix);

        GL.bindBuffer(GL.ARRAY_BUFFER, CUBE_VERTEX);
        GL.vertexAttribPointer(_sky_position, 3, GL.FLOAT, false, 4 * 5, 0); 
        GL.vertexAttribPointer(_sky_uv, 2, GL.FLOAT, false, 4 * 5, 4 * 3);
        
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
        
        GL.activeTexture(GL.TEXTURE0);
        GL.bindTexture(GL.TEXTURE_2D, cube_texture);
        GL.drawElements(GL.TRIANGLES, cube_faces.length, GL.UNSIGNED_SHORT, 0);

        /*========================= 2. SCENE OBJECTS DRAW ========================= */
        
        GL.useProgram(COLOR_SHADER_PROGRAM); 
        GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
        GL.uniformMatrix4fv(_Vmatrix, false, finalViewMatrix); 
        
        /*--- FLOATING ISLAND DRAW ---*/

        const currentIslandModelMatrix = LIBS.get_I4();
        LIBS.translateY(currentIslandModelMatrix, -0.1);
        
        GL.uniformMatrix4fv(_Mmatrix, false, currentIslandModelMatrix);

        // DRAW 1: Permukaan Atas (Rumput)
        GL.uniform3fv(_uColor, [0.1, 0.7, 0.1]); // Hijau (Rumput)
        GL.bindBuffer(GL.ARRAY_BUFFER, islandTopVertexBuffer);
        GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 0, 0); 
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, islandTopIndexBuffer);
        GL.drawElements(GL.TRIANGLES, islandTopIndices.length, GL.UNSIGNED_SHORT, 0);
        
        // DRAW 2: Permukaan Bawah dan Sisi (Tanah/Batu)
        GL.uniform3fv(_uColor, [0.4, 0.3, 0.1]); // Cokelat (Tanah/Batu)
        GL.bindBuffer(GL.ARRAY_BUFFER, islandBottomVertexBuffer);
        // Vertex pointer menggunakan buffer gabungan
        GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 0, 0); 
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, islandBottomIndexBuffer);
        GL.drawElements(GL.TRIANGLES, finalBottomIndices.length, GL.UNSIGNED_SHORT, 0);

        /*--- CHARACTER DRAW ---*/
        
        ralts.render(raltsModelMatrix);
        kirlia.render(kirliaModelMatrix, time);

        // Gardevoir 
        gardevoir.render(gardevoirModelMatrix, time); 
        gardevoir.updateGlobalMovement(elapsed, gardevoirModelMatrix);

        // Gallade
        gallade.render(galladeModelMatrix);

        GL.flush();
        window.requestAnimationFrame(animate);
    }
    window.requestAnimationFrame(animate);
}
window.addEventListener("load", main);