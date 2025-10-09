/**
 * GardevoirObject.js
 * Implementasi class DoubleCone, Torus, dan BezierSOR sebagai objek 3D mandiri.
 * Semua objek dibuat dari kurva (Surface of Revolution).
 */

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

function generateDoubleConeMesh(radius, height) {
    let vertices = [];
    let normals = [];
    let indices = [];

    const halfHeight = height / 2.0;
    
    // Generating Vertices and Normals
    for (let j = 0; j <= RADIAL_SEGMENTS; j++) {
        let angle = j * 2.0 * Math.PI / RADIAL_SEGMENTS;
        let cosA = Math.cos(angle);
        let sinA = Math.sin(angle);

        for (let i = 0; i <= VERTICAL_SEGMENTS; i++) {
            let y = i * height / VERTICAL_SEGMENTS - halfHeight;
            let r_at_y = radius * (1.0 - Math.abs(y) / halfHeight);

            vertices.push(r_at_y * cosA, y, r_at_y * sinA);
            
            // Normals (simplified)
            let dir = y > 0 ? 1 : -1;
            let slope = radius / halfHeight;
            let len = Math.sqrt(slope * slope + 1);
            let normalX = cosA * (dir * slope) / len;
            let normalY = (r_at_y > 0 ? (radius / halfHeight) : 0) * dir;
            let normalZ = sinA * (dir * slope) / len;

            let nLen = Math.sqrt(normalX * normalX + normalY * normalY + normalZ * normalZ);
            if (nLen > 0) {
                 normals.push(normalX / nLen, normalY / nLen, normalZ / nLen);
            } else {
                 normals.push(0, dir, 0); 
            }
        }
    }

    // Generating Indices
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

export class DoubleCone {
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
    
    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, radius = 1, height = 2, color = [1.0, 1.0, 1.0]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this.color = color;
        
        // Generate Mesh
        const meshData = generateDoubleConeMesh(radius, height);
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