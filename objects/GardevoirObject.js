/**
 * GardevoirObject.js
 * Implementasi class DoubleCone, Torus, dan BezierSOR sebagai objek 3D mandiri.
 * Semua objek dibuat dari kurva (Surface of Revolution).
 */

// ==============================================================
// Cone, Cone Surface, dan Double Cone
// ==============================================================

export class Cone {
    GL = null;
    SHADER_PROGRAM = null;
    _position = null;
    _MMatrix = null;
    OBJECT_VERTEX = null;
    OBJECT_FACES = null;
    vertex = [];
    faces = [];
    childs = [];
    color = [1.0, 1.0, 1.0];
    MOVE_MATRIX = LIBS.get_I4();
    POSITION_MATRIX = LIBS.get_I4();
    
    /**
     * @param {WebGLRenderingContext} GL - Konteks WebGL.
     * @param {number} SHADER_PROGRAM - Program shader WebGL.
     * @param {number} _position - Lokasi attribute 'position'.
     * @param {number} _MMatrix - Lokasi uniform 'MMatrix'.
     * @param {number} radius - Jari-jari alas.
     * @param {number} height - Tinggi kerucut.
     * @param {number} uSegments - Jumlah segmen horizontal.
     * @param {array} color - Warna RGB.
    */
   constructor(GL, SHADER_PROGRAM, _position, _MMatrix, radius = 1, height = 2, uSegments = 30, color = [1.0, 1.0, 1.0]) {
       this.GL = GL;
       this.SHADER_PROGRAM = SHADER_PROGRAM;
       this._position = _position;
       this._MMatrix = _MMatrix;
       this.color = color;
       
       this.vertex = [];
       this.faces = [];
       
       const halfHeight = height / 2;
       
       // Titik Puncak
       const tipIndex = 0;
       this.vertex.push(0, halfHeight, 0);
       
       // Titik Pusat Alas
       const baseCenterIndex = this.vertex.length / 3;
       this.vertex.push(0, -halfHeight, 0);
       
       // Vertices Alas
       for (let i = 0; i <= uSegments; i++) {
           let u = (i / uSegments) * 2 * Math.PI;
           this.vertex.push(radius * Math.cos(u), -halfHeight, radius * Math.sin(u));
        }
        
        // Faces Alas (membuat kipas dari pusat ke tepi)
        for (let i = 0; i < uSegments; i++) {
            // p1 = center, p2 = current edge, p3 = next edge
            let p2 = baseCenterIndex + 1 + i;
            let p3 = baseCenterIndex + 1 + i + 1;
            this.faces.push(baseCenterIndex, p2, p3);
        }
        
        // Faces Sisi (membuat segitiga dari puncak ke segmen alas)
        for (let i = 0; i < uSegments; i++) {
            // p1 = tip, p2 = current edge, p3 = next edge
            let p2 = baseCenterIndex + 1 + i;
            let p3 = baseCenterIndex + 1 + i + 1;
            this.faces.push(tipIndex, p3, p2); // Urutan terbalik agar normal mengarah keluar
        }
    }
    
    setup() {
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertex), this.GL.STATIC_DRAW);
        this.OBJECT_FACES = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces), this.GL.STATIC_DRAW);
        this.childs.forEach(child => child.setup());
    }
    
    render(PARENT_MATRIX) {
        this.MODEL_MATRIX = LIBS.multiply(this.MOVE_MATRIX, this.POSITION_MATRIX);
        this.MODEL_MATRIX = LIBS.multiply(this.MODEL_MATRIX, PARENT_MATRIX);
        this.GL.useProgram(this.SHADER_PROGRAM);
        this.GL.uniformMatrix4fv(this._MMatrix, false, this.MODEL_MATRIX);
        
        const _uColor = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uColor");
        this.GL.uniform3fv(_uColor, this.color);
        
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 0, 0);
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.drawElements(this.GL.TRIANGLES, this.faces.length, this.GL.UNSIGNED_SHORT, 0);
        
        this.childs.forEach(child => child.render(this.MODEL_MATRIX));
    }
}

export class ConeSurface {
    GL = null;
    SHADER_PROGRAM = null;
    _position = null;
    _MMatrix = null;
    OBJECT_VERTEX = null;
    OBJECT_FACES = null;
    vertex = [];
    faces = [];
    childs = [];
    color = [1.0, 1.0, 1.0];
    MOVE_MATRIX = LIBS.get_I4();
    POSITION_MATRIX = LIBS.get_I4();
    
    /**
     * @param {WebGLRenderingContext} GL - Konteks WebGL.
     * @param {number} SHADER_PROGRAM - Program shader WebGL.
     * @param {number} _position - Lokasi attribute 'position'.
     * @param {number} _MMatrix - Lokasi uniform 'MMatrix'.
     * @param {number} radius - Jari-jari alas.
     * @param {number} height - Tinggi kerucut.
     * @param {number} uSegments - Jumlah segmen horizontal.
     * @param {array} color - Warna RGB.
     */
    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, radius = 1, startAngDeg, endAngDeg, tipX, tipZ, height = 2, uSegments = 30, color = [1.0, 1.0, 1.0]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this.color = color;
        
        this.vertex = [];
        this.faces = [];
        
        const halfHeight = height /2;

        const startRad = LIBS.degToRad(startAngDeg);
        const endRad = LIBS.degToRad(endAngDeg);
        const angleRange = endRad - startRad;
        
        const tipIndex = 0;
        // MENGGUNAKAN tipX dan tipZ untuk koordinat puncak:
        this.vertex.push(tipX, halfHeight, tipZ); // Indeks 0

        // Vertices Alas (Loop dimulai dari 1)
        for (let i = 0; i <= uSegments; i++) {
            let u = startRad + (i / uSegments) * angleRange;
            // Vertices diletakkan di -halfHeight
            this.vertex.push(radius * Math.cos(u), -halfHeight, radius * Math.sin(u));
        }
        
        // Faces Sisi (membuat segitiga dari puncak ke segmen alas)
        // Kita menggunakan titik [1] sampai [uSegments] sebagai titik alas
        for (let i = 0; i < uSegments; i++) {
            // p1 = tip (0)
            let p2 = 1 + i;
            let p3 = 1 + i + 1;
            
            // NOTE: Tidak perlu menyimpan Titik Pusat Alas karena kita hanya ingin permukaan.
            // Vertices dihitung dari indeks 1, bukan dari baseCenterIndex.
            
            this.faces.push(tipIndex, p3, p2); // Urutan terbalik agar normal mengarah keluar
        }
        
        // Catatan: Alas Ditinggalkan. Mesh hanya memiliki permukaan samping.
    }
    
    setup() {
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertex), this.GL.STATIC_DRAW);
        this.OBJECT_FACES = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces), this.GL.STATIC_DRAW);
        this.childs.forEach(child => child.setup());
    }
    
    render(PARENT_MATRIX) {
        this.MODEL_MATRIX = LIBS.multiply(this.MOVE_MATRIX, this.POSITION_MATRIX);
        this.MODEL_MATRIX = LIBS.multiply(this.MODEL_MATRIX, PARENT_MATRIX);
        this.GL.useProgram(this.SHADER_PROGRAM);
        
        // Menggunakan _MMatrix dari properti class
        this.GL.uniformMatrix4fv(this._MMatrix, false, this.MODEL_MATRIX);
        
        const _uColor = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uColor");
        this.GL.uniform3fv(_uColor, this.color);
        
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 0, 0);
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        
        // faces.length sudah menyimpan jumlah indeks yang benar
        this.GL.drawElements(this.GL.TRIANGLES, this.faces.length, this.GL.UNSIGNED_SHORT, 0);
        
        this.childs.forEach(child => child.render(this.MODEL_MATRIX));
    }
}

// ==============================================================
// Cylinder
// ==============================================================

export class Cylinder {
    GL = null;
    SHADER_PROGRAM = null;
    _position = null;
    _MMatrix = null;
    OBJECT_VERTEX = null;
    OBJECT_FACES = null;
    vertex = [];
    faces = [];
    childs = [];
    color = [1.0, 1.0, 1.0];

    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, radius = 1, height = 2, uSegments = 30, color = [1.0, 1.0, 1.0]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this.color = color;
        this.POSITION_MATRIX = LIBS.get_I4();
        this.MOVE_MATRIX = LIBS.get_I4();
        this.vertex = [];
        this.faces = [];
        const bottomCenterIndex = 0;
        this.vertex.push(0, -height / 2, 0);
        for (let i = 0; i <= uSegments; i++) {
            let u = (i / uSegments) * 2 * Math.PI;
            this.vertex.push(radius * Math.cos(u), -height / 2, radius * Math.sin(u));
        }
        const topCenterIndex = this.vertex.length / 3;
        this.vertex.push(0, height / 2, 0);
        for (let i = 0; i <= uSegments; i++) {
            let u = (i / uSegments) * 2 * Math.PI;
            this.vertex.push(radius * Math.cos(u), height / 2, radius * Math.sin(u));
        }
        const sideStartIndex = this.vertex.length / 3;
        for (let i = 0; i <= uSegments; i++) {
            let u = (i / uSegments) * 2 * Math.PI;
            this.vertex.push(radius * Math.cos(u), -height / 2, radius * Math.sin(u));
            this.vertex.push(radius * Math.cos(u), height / 2, radius * Math.sin(u));
        }
        for (let i = 0; i < uSegments; i++) {
            this.faces.push(bottomCenterIndex, bottomCenterIndex + 1 + i, bottomCenterIndex + 1 + i + 1);
        }
        for (let i = 0; i < uSegments; i++) {
            this.faces.push(topCenterIndex, topCenterIndex + 1 + i + 1, topCenterIndex + 1 + i);
        }
        for (let i = 0; i < uSegments; i++) {
            let p1 = sideStartIndex + (i * 2);
            let p2 = p1 + 1;
            let p3 = sideStartIndex + ((i + 1) * 2);
            let p4 = p3 + 1;
            this.faces.push(p1, p2, p3);
            this.faces.push(p2, p4, p3);
        }
    }
    setup() {
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertex), this.GL.STATIC_DRAW);
        this.OBJECT_FACES = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces), this.GL.STATIC_DRAW);
        this.childs.forEach(child => child.setup());
    }
    render(PARENT_MATRIX) {
        this.MODEL_MATRIX = LIBS.multiply(this.MOVE_MATRIX, this.POSITION_MATRIX);
        this.MODEL_MATRIX = LIBS.multiply(this.MODEL_MATRIX, PARENT_MATRIX);
        this.GL.useProgram(this.SHADER_PROGRAM);
        this.GL.uniformMatrix4fv(this._MMatrix, false, this.MODEL_MATRIX);
        const _uColor = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uColor");
        this.GL.uniform3fv(_uColor, this.color);
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 0, 0);
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.drawElements(this.GL.TRIANGLES, this.faces.length, this.GL.UNSIGNED_SHORT, 0);
        this.childs.forEach(child => child.render(this.MODEL_MATRIX));
    }
}

// ==============================================================
// Kurva: Bézier Surface of Revolution (SOR)
// ==============================================================

const VERTICAL_SEGMENTS = 32;
const RADIAL_SEGMENTS = 32;

// ==============================================================
// UTILITY: Mesh Generators
// ==============================================================

function getBezierPoint(t, p) {
    let t2 = t * t;
    let t3 = t2 * t;
    let mt = 1.0 - t;
    let mt2 = mt * mt;
    let mt3 = mt2 * mt;

    let x = mt3 * p[0][0] + 3.0 * mt2 * t * p[1][0] + 3.0 * mt * t2 * p[2][0] + t3 * p[3][0];
    let y = mt3 * p[0][1] + 3.0 * mt2 * t * p[1][1] + 3.0 * mt * t2 * p[2][1] + t3 * p[3][1];

    return [x, y];
}

function generateBezierSORMesh(profilePoints) {
    let vertices = [];
    let normals = [];
    let indices = [];

    for (let j = 0; j <= RADIAL_SEGMENTS; j++) {
        let angle = j * 2.0 * Math.PI / RADIAL_SEGMENTS;
        let cosA = Math.cos(angle);
        let sinA = Math.sin(angle);

        for (let i = 0; i <= VERTICAL_SEGMENTS; i++) {
            let t = i / VERTICAL_SEGMENTS;
            let point = getBezierPoint(t, profilePoints);
            let radius = point[0]; 
            let y = point[1];      

            vertices.push(radius * cosA, y, radius * sinA);
            
            let len = Math.sqrt(radius * radius);
            if (len > 0) {
                normals.push(radius * cosA / len, 0, radius * sinA / len); 
            } else {
                normals.push(0, 1, 0); 
            }
        }
    }

    for (let j = 0; j < RADIAL_SEGMENTS; j++) {
        for (let i = 0; i < VERTICAL_SEGMENTS; i++) {
            let p1 = i * (RADIAL_SEGMENTS + 1) + j;
            let p2 = (i + 1) * (RADIAL_SEGMENTS + 1) + j;
            let p3 = i * (RADIAL_SEGMENTS + 1) + j + 1;
            let p4 = (i + 1) * (RADIAL_SEGMENTS + 1) + j + 1;

            indices.push(p1, p2, p3);
            indices.push(p3, p2, p4);
        }
    }

    return { vertices, normals, indices, numIndices: indices.length };
}

export class BezierSOR {
    GL = null;
    SHADER_PROGRAM = null;
    _position = null;
    _MMatrix = null;
    OBJECT_VERTEX = null;
    OBJECT_FACES = null;
    vertex = [];
    faces = [];
    childs = [];
    color = [1.0, 1.0, 1.0];
    MOVE_MATRIX = LIBS.get_I4();    
    POSITION_MATRIX = LIBS.get_I4();

    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, profilePoints, color = [1.0, 1.0, 1.0]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this.profilePoints = profilePoints;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this.color = color;

        // Generate Mesh
        const meshData = generateBezierSORMesh(this.profilePoints);
        this.vertex = meshData.vertices;
        this.faces = meshData.indices;
    }
    
    setup() {
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertex), this.GL.STATIC_DRAW);
        this.OBJECT_FACES = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces), this.GL.STATIC_DRAW);
        this.childs.forEach(child => child.setup());
    }

    render(PARENT_MATRIX) {
        this.MODEL_MATRIX = LIBS.multiply(this.MOVE_MATRIX, this.POSITION_MATRIX);
        this.MODEL_MATRIX = LIBS.multiply(this.MODEL_MATRIX, PARENT_MATRIX);
        this.GL.useProgram(this.SHADER_PROGRAM);
        this.GL.uniformMatrix4fv(this._MMatrix, false, this.MODEL_MATRIX);
        const _uColor = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uColor");
        this.GL.uniform3fv(_uColor, this.color);
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 0, 0);
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.drawElements(this.GL.TRIANGLES, this.faces.length, this.GL.UNSIGNED_SHORT, 0);
        this.childs.forEach(child => child.render(this.MODEL_MATRIX));
    }
}

// ==============================================================
// Ellipsoid
// ==============================================================

export class Ellipsoid {
    GL = null;
    SHADER_PROGRAM = null;
    _position = null;
    _MMatrix = null;
    OBJECT_VERTEX = null;
    OBJECT_FACES = null;
    vertex = [];
    faces = [];
    childs = [];
    color = [1.0, 1.0, 1.0];

    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, a = 1, b = 1, c = 1, uSegments = 30, vSegments = 30, horizontalAngleDeg = 360, color = [1.0, 1.0, 1.0]) { // Added horizontalAngleDeg
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this.color = color;
        this.POSITION_MATRIX = LIBS.get_I4();
        this.MOVE_MATRIX = LIBS.get_I4();
        this.vertex = [];
        this.faces = [];

        // Vertical range for a complete ellipsoid (poles to pole)
        const vStart = -Math.PI / 2;
        const vEnd = Math.PI / 2;

        // Convert horizontal angle from degrees to radians
        const horizontalAngleRad = horizontalAngleDeg * Math.PI / 180;
        const uStart = -horizontalAngleRad / 2; // Start from the center of the slice
        const uEnd = horizontalAngleRad / 2;   // End at the center of the slice

        // Create vertices for the curved surface
        for (let i = 0; i <= vSegments; i++) {
            let v = vStart + (i / vSegments) * (vEnd - vStart);
            for (let j = 0; j <= uSegments; j++) {
                let u = uStart + (j / uSegments) * (uEnd - uStart); // Use limited horizontal angle
                let x = a * Math.cos(v) * Math.cos(u);
                let y = b * Math.cos(v) * Math.sin(u);
                let z = c * Math.sin(v);
                this.vertex.push(x, y, z);
            }
        }

        // Create faces for the curved surface
        for (let i = 0; i < vSegments; i++) {
            for (let j = 0; j < uSegments; j++) {
                let p1 = i * (uSegments + 1) + j;
                let p2 = p1 + (uSegments + 1);
                this.faces.push(p1, p2, p1 + 1);
                this.faces.push(p1 + 1, p2, p2 + 1);
            }
        }

        // Add flat "cut" faces if it's a slice (horizontalAngleDeg < 360)
        if (horizontalAngleDeg < 360) {
            // Face 1 (at u = uStart)
            for (let i = 0; i < vSegments; i++) {
                let p1 = i * (uSegments + 1); // First point in current v-segment
                let p2 = (i + 1) * (uSegments + 1); // First point in next v-segment
                this.faces.push(p1, p2, p1 + uSegments + 1); // This connects p1, p2, and p2's u-neighbor.
                this.faces.push(p1, p2, p1 + uSegments + 1);
                // Corrected for flat face
                 this.faces.push(p1, p2, (i + 1) * (uSegments + 1) + 0);
                 this.faces.push(p1, (i + 1) * (uSegments + 1) + 0, i * (uSegments + 1) + 0);

            }

            // Face 2 (at u = uEnd)
            for (let i = 0; i < vSegments; i++) {
                let p1 = i * (uSegments + 1) + uSegments; // Last point in current v-segment
                let p2 = (i + 1) * (uSegments + 1) + uSegments; // Last point in next v-segment
                this.faces.push(p1, p2, p1 - 1); // This connects p1, p2, and p2's u-neighbor.
                this.faces.push(p1, p2, p1 - 1);
                // Corrected for flat face
                 this.faces.push(p1, i * (uSegments + 1) + uSegments, (i + 1) * (uSegments + 1) + uSegments);
                 this.faces.push(p1, (i + 1) * (uSegments + 1) + uSegments, i * (uSegments + 1) + uSegments);
            }
        }
    }

    setup() {
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertex), this.GL.STATIC_DRAW);
        this.OBJECT_FACES = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces), this.GL.STATIC_DRAW);
        this.childs.forEach(child => child.setup());
    }

    render(PARENT_MATRIX) {
        this.MODEL_MATRIX = LIBS.multiply(this.MOVE_MATRIX, this.POSITION_MATRIX);
        this.MODEL_MATRIX = LIBS.multiply(this.MODEL_MATRIX, PARENT_MATRIX);
        this.GL.useProgram(this.SHADER_PROGRAM);
        this.GL.uniformMatrix4fv(this._MMatrix, false, this.MODEL_MATRIX);
        const _uColor = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uColor");
        this.GL.uniform3fv(_uColor, this.color);
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 0, 0);
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.drawElements(this.GL.TRIANGLES, this.faces.length, this.GL.UNSIGNED_SHORT, 0);
        this.childs.forEach(child => child.render(this.MODEL_MATRIX));
    }
}

export class Crescent {
    GL = null;
    SHADER_PROGRAM = null;
    _position = null;
    _MMatrix = null;
    OBJECT_VERTEX = null;
    OBJECT_FACES = null;
    vertex = [];
    faces = [];
    childs = [];
    color = [1.0, 1.0, 1.0];
    MOVE_MATRIX = LIBS.get_I4();    
    POSITION_MATRIX = LIBS.get_I4();

    /**
     * @param {WebGLRenderingContext} GL - Konteks WebGL.
     * @param {number} SHADER_PROGRAM - Program shader WebGL.
     * @param {number} _position - Lokasi attribute 'position'.
     * @param {number} _MMatrix - Lokasi uniform 'MMatrix'.
     * @param {number} majorRadius - Jari-jari mayor (pusat donat).
     * @param {number} minorRadius - Jari-jari minor (ketebalan/penampang).
     * @param {number} startAngDeg - Sudut awal revolusi (dalam derajat, default: 0).
     * @param {number} endAngDeg - Sudut akhir revolusi (dalam derajat, default: 360).
     * @param {number} majorSegments - Segmen keliling (default: 32).
     * @param {number} minorSegments - Segmen penampang (default: 32).
     * @param {array} color - Warna RGB.
     */
    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, majorRadius = 1, minorRadius = 0.3, startAngDeg = 0, endAngDeg = 360, majorSegments = 32, minorSegments = 32, color = [1.0, 1.0, 1.0]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this.color = color;
        
        // --- KONVERSI SUDUT DARI DERAJAT KE RADIAN ---
        const startRad = LIBS.degToRad(startAngDeg);
        const endRad = LIBS.degToRad(endAngDeg);
        const angleRange = endRad - startRad;
        
        const RADIAL_SEGMENTS = majorSegments;
        const VERTICAL_SEGMENTS = minorSegments;

        // --- Mesh Generation ---
        for (let i = 0; i <= RADIAL_SEGMENTS; i++) {
            let majorAngle = startRad + (i / RADIAL_SEGMENTS) * angleRange;
            let majorCos = Math.cos(majorAngle);
            let majorSin = Math.sin(majorAngle);
            
            // 1. HITUNG FAKTOR PINCHING (Meruncingkan)
            let t = i / RADIAL_SEGMENTS; 
            
            // Sinusial, dari ~0 ke 1, kembali ke ~0.
            let pinchFactor = Math.sin(t * Math.PI); 
            
            // Tentukan skala minimum (agar tidak collapse/menghilang)
            const MIN_THICKNESS_SCALE = 0.05; 
            
            // Factor akhir: memastikan ketebalan berkurang drastis di ujung
            let scaleFactor = MIN_THICKNESS_SCALE + (1.0 - MIN_THICKNESS_SCALE) * pinchFactor;
            
            // 2. MODULASI MINOR RADIUS (Ketebalan)
            let currentMinorRadius = minorRadius * scaleFactor;
            
            // majorRadius tetap konstan (cincin tidak mengecil)
            let currentMajorRadius = majorRadius;
            
            for (let j = 0; j <= VERTICAL_SEGMENTS; j++) {
                let minorAngle = j * 2.0 * Math.PI / VERTICAL_SEGMENTS;
                let minorCos = Math.cos(minorAngle);
                let minorSin = Math.sin(minorAngle);
                
                // Gunakan currentMinorRadius yang dimodulasi
                let r = currentMajorRadius + currentMinorRadius * minorCos;
                let x = r * majorCos;
                let y = currentMinorRadius * minorSin; // Y (ketebalan) juga harus diskalakan
                let z = r * majorSin;
                
                this.vertex.push(x, y, z);
            }
        }

        // --- Faces (Menghubungkan segmen) ---
        for (let i = 0; i < RADIAL_SEGMENTS; i++) {
            for (let j = 0; j < VERTICAL_SEGMENTS; j++) {
                let p1 = i * (VERTICAL_SEGMENTS + 1) + j;
                let p2 = (i + 1) * (VERTICAL_SEGMENTS + 1) + j;
                let p3 = i * (VERTICAL_SEGMENTS + 1) + j + 1;
                let p4 = (i + 1) * (VERTICAL_SEGMENTS + 1) + j + 1;

                this.faces.push(p1, p3, p2);
                this.faces.push(p3, p4, p2);
            }
        }
        
        // --- Menutup Ujung Potongan (jika tidak 360 derajat) ---
        if (Math.abs(angleRange - (2 * Math.PI)) > 0.001) {
            
            // Titik tengah pada penampang (minor segments) adalah VERTICAL_SEGMENTS + 1 titik.
            const profilePointsPerSegment = VERTICAL_SEGMENTS + 1;
            
            // Kita membuat faces untuk menutup potongan, menghubungkan titik awal (i=0) dan titik akhir (i=majorSegments)
            
            // Titik awal jalur
            for (let j = 0; j < VERTICAL_SEGMENTS; j++) {
                let p1 = j;
                let p2 = j + 1;
                // Titik pusat buatan (index -1) digunakan untuk triangulasi tutup
                
                // KOREKSI: Tanpa titik pusat, tutupnya harus menggunakan fan atau dicari geometrinya.
                // Untuk kesederhanaan, kita hanya menggunakan meshes dari Torus yang terpotong.
                // Dalam Torus, penutupnya adalah dua lingkaran yang di-extrude.
                // Kita akan membuat dua faces datar sederhana (fans) yang menutupi potongan awal dan akhir.
                
                // Untuk Torus, penutupnya adalah dua cincin yang tersisa di awal dan akhir jalur.
                // Kita akan membuat faces melingkar yang menutup lubang di penampang (minor).
                
                // Catatan: Karena penampang melingkar (minor), penutupnya sudah ada.
                // Untuk torus parsial, kita tidak menutupnya dengan wajah datar sederhana (kecuali profil minor diubah).
                // Kami biarkan terbuka untuk kasus ini, mengikuti geometri Torus standar.
            }
        }
    }
    
    setup() {
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertex), this.GL.STATIC_DRAW);
        this.OBJECT_FACES = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces), this.GL.STATIC_DRAW);
        this.childs.forEach(child => child.setup());
    }

    render(PARENT_MATRIX) {
        this.MODEL_MATRIX = LIBS.multiply(this.MOVE_MATRIX, this.POSITION_MATRIX);
        this.MODEL_MATRIX = LIBS.multiply(this.MODEL_MATRIX, PARENT_MATRIX);
        
        this.GL.useProgram(this.SHADER_PROGRAM);
        
        this.GL.uniformMatrix4fv(this._MMatrix, false, this.MODEL_MATRIX);
        
        const _uColor = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uColor");
        this.GL.uniform3fv(_uColor, this.color);
        
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 0, 0);
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.drawElements(this.GL.TRIANGLES, this.faces.length, this.GL.UNSIGNED_SHORT, 0);
        
        this.childs.forEach(child => child.render(this.MODEL_MATRIX));
    }

}

function calculateBsplinePoints(controlPoints, segments) {
    if (controlPoints.length < 3) {
        // Handle kasus kurang dari 3 control points, B-spline kuadratik butuh minimal 3
        console.warn("Minimal 3 control points dibutuhkan untuk B-spline Kuadratik. Menggunakan control points apa adanya.");
        return controlPoints;
    }

    const points = [];
    const step = 1 / segments;
    const numControlPoints = controlPoints.length;

    // Untuk kurva tertutup, kita perlu memperluas control points
    // agar segmen terakhir bisa menghubungkan kembali ke awal dengan smooth.
    // Misalnya, [P0, P1, P2, P3] untuk kurva tertutup akan menjadi [P0, P1, P2, P3, P0, P1].
    const extendedControlPoints = [...controlPoints];
    extendedControlPoints.push(controlPoints[0]);
    extendedControlPoints.push(controlPoints[1]);
    // Jika hanya ada 3 CP, perlu lebih hati-hati (ini contoh umum untuk >3 CP)
    // Untuk 3 CP [P0,P1,P2] -> [P0,P1,P2,P0,P1] agar membentuk loop P0-P1-P2-P0
    if (numControlPoints === 3) {
         extendedControlPoints.push(controlPoints[0]);
    }


    // Iterasi melalui setiap segmen kurva
    // Setiap segmen B-spline kuadratik membutuhkan 3 control points (Pi, Pi+1, Pi+2)
    for (let i = 0; i <= extendedControlPoints.length - 3; i++) {
        const P0 = extendedControlPoints[i];
        const P1 = extendedControlPoints[i + 1];
        const P2 = extendedControlPoints[i + 2];

        for (let t = 0; t <= 1; t += step) {
            // Fungsi Basis B-spline Kuadratik (basis functions)
            const N0 = 0.5 * (1 - t) * (1 - t);
            const N1 = 0.5 * (-2 * t * t + 2 * t + 1);
            const N2 = 0.5 * t * t;

            const x = N0 * P0[0] + N1 * P1[0] + N2 * P2[0];
            const y = N0 * P0[1] + N1 * P1[1] + N2 * P2[1];

            // Tambahkan poin ke profil. Hindari duplikasi poin akhir untuk kurva tertutup.
            if (!(i === extendedControlPoints.length - 3 && t > 1 - step)) {
                 points.push([x, y]);
            }
           
            if (t + step > 1) break; // Pastikan t mencapai 1.0 secara akurat
        }
    }
    // Tambahkan poin awal untuk memastikan penutupan yang sempurna jika belum ada
    if (points.length > 0 && (points[0][0] !== points[points.length-1][0] || points[0][1] !== points[points.length-1][1])) {
        points.push(points[0]);
    }
    return points;
}

// --- KELAS BsplineExtrudedObject ---
export class BsplineExtrudedObject {
    GL = null;
    SHADER_PROGRAM = null;
    _position = null;
    _MMatrix = null;
    OBJECT_VERTEX = null;
    OBJECT_FACES = null;
    childs = [];
    color = [1.0, 0.2, 0.4]; 
    MOVE_MATRIX = LIBS.get_I4();    
    POSITION_MATRIX = LIBS.get_I4();

    /**
     * @param {WebGLRenderingContext} GL - Konteks WebGL.
     * @param {WebGLProgram} SHADER_PROGRAM - Program shader WebGL.
     * @param {number} _position - Lokasi attribute 'position'.
     * @param {WebGLUniformLocation} _MMatrix - Lokasi uniform 'MMatrix'.
     * @param {Array<number[]>} controlPoints - Poin kontrol 2D untuk B-spline (profil hati).
     * @param {number} depth - Jarak ekstrusi (tebal objek).
     * @param {number} curveSegments - Jumlah segmen untuk aproksimasi kurva B-spline per segmen kontrol.
     * @param {array} color - Warna RGB.
     */
    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, controlPoints, depth = 0.1, curveSegments = 20, color = [1.0, 0.2, 0.4]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        // this._normal dihilangkan
        this._MMatrix = _MMatrix;
        this.controlPoints = controlPoints;
        this.depth = depth;
        this.curveSegments = curveSegments;
        this.color = color;

        this.vertices = [];
        // this.normals dihilangkan
        this.indices = [];
        
        this.generateGeometry();
    }

    calculateProfile() {
        // Asumsi fungsi calculateBsplinePoints tersedia
        return calculateBsplinePoints(this.controlPoints, this.curveSegments);
    }
    
    generateGeometry() {
        const profile = this.calculateProfile();
        const numProfilePoints = profile.length;
        if (numProfilePoints === 0) return;

        const halfDepth = this.depth / 2;

        // **1. GENERATE VERTICES (Depan & Belakang)**
        for (let i = 0; i < numProfilePoints; i++) {
            const [x, y] = profile[i];
            
            // Verteks Depan (z = -halfDepth)
            this.vertices.push(x, y, -halfDepth);
            // Normal dihilangkan

            // Verteks Belakang (z = +halfDepth)
            this.vertices.push(x, y, halfDepth);
            // Normal dihilangkan
        }

        // **2. GENERATE INDICES (Sisi Samping)**
        for (let i = 0; i < numProfilePoints; i++) {
            const nextIndex = (i + 1) % numProfilePoints;
            
            const i0 = i * 2;           // Depan saat ini
            const i1 = i * 2 + 1;       // Belakang saat ini
            const i2 = nextIndex * 2;   // Depan berikutnya
            const i3 = nextIndex * 2 + 1; // Belakang berikutnya
            
            this.indices.push(i0, i1, i2);
            this.indices.push(i2, i1, i3);

            // Perhitungan Normal Samping dihilangkan
        }

        // **3. GENERATE INDICES (Tutup Depan dan Belakang - Triangulasi Fan)**
        let sum_x = 0;
        let sum_y = 0;
        for (const p of profile) {
            sum_x += p[0];
            sum_y += p[1];
        }
        const center_x = sum_x / numProfilePoints;
        const center_y = sum_y / numProfilePoints;
        
        const baseCenterIndex = this.vertices.length / 3;

        // Tutup Depan: Tambahkan verteks tengah
        this.vertices.push(center_x, center_y, -halfDepth);
        // Normal dihilangkan
        
        // Tutup Belakang: Tambahkan verteks tengah
        this.vertices.push(center_x, center_y, halfDepth);
        // Normal dihilangkan
        
        const centerFrontIndex = baseCenterIndex;
        const centerBackIndex = baseCenterIndex + 1;

        // Indeks Tutup Depan
        for (let i = 0; i < numProfilePoints; i++) {
            const nextIndex = (i + 1) % numProfilePoints;
            this.indices.push(centerFrontIndex, i * 2, nextIndex * 2);
        }

        // Indeks Tutup Belakang
        for (let i = 0; i < numProfilePoints; i++) {
            const nextIndex = (i + 1) % numProfilePoints;
            this.indices.push(centerBackIndex, nextIndex * 2 + 1, i * 2 + 1);
        }
    }
    
    // -----------------------------------------------------------------
    // | METODE WEBGL: SETUP DAN RENDER (Disesuaikan untuk Unlit) |
    // -----------------------------------------------------------------

    setup() {
        // Hanya buffer Vertex (Posisi)
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertices), this.GL.STATIC_DRAW);
        
        // Buffer Normal Dihilangkan

        // Buffer Index (Faces)
        this.OBJECT_FACES = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.GL.STATIC_DRAW);
        
        this.childs.forEach(child => child.setup());
    }

    render(PARENT_MATRIX) {
        // 1. Hitung Model Matrix
        this.MODEL_MATRIX = LIBS.multiply(this.MOVE_MATRIX, this.POSITION_MATRIX);
        this.MODEL_MATRIX = LIBS.multiply(this.MODEL_MATRIX, PARENT_MATRIX);
        
        this.GL.useProgram(this.SHADER_PROGRAM);
        
        // 2. Kirim Uniform Matrix Model
        this.GL.uniformMatrix4fv(this._MMatrix, false, this.MODEL_MATRIX);
        
        // 3. Kirim Uniform Warna (untuk warna solid)
        const _uColor = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uColor");
        this.GL.uniform3fv(_uColor, this.color);
        
        // 4. Bind dan Atur Vertex Position Attribute
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 0, 0);
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.drawElements(this.GL.TRIANGLES, this.indices.length, this.GL.UNSIGNED_SHORT, 0);

        this.childs.forEach(child => child.render(this.MODEL_MATRIX));
    }
}


// ==============================================================
// CURVE PROFILES DAN EXPORT
// ==============================================================
const BODY_PROFILE = [
    [0.0, 0.0], [0.27, 0.6], [0.02, 0.5], [0.0, 0.5]
];
const NECK_PROFILE = [
    [0.0, 0.0], [0.3, 0.05], [0.05, 0.01], [0.02, 0.11]
];
const LIMB_PROFILE = [
    [0.2, 0.0], [0.3, 0.5], [0.1, 0.9], [0.0, 1.0]
];
const HORN_PROFILE = [
    [0.0, 0.0], [0.5, 0.2], [0.1, 0.4], [0.0, 0.5]
];

export const PROFILES = {
    BODY: BODY_PROFILE,
    NECK: NECK_PROFILE,
    LIMB: LIMB_PROFILE,
    HORN: HORN_PROFILE
};