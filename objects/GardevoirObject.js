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

function generateTorusMesh(majorRadius, minorRadius) {
    let vertices = [];
    let normals = [];
    let indices = [];

    for (let i = 0; i <= RADIAL_SEGMENTS; i++) {
        let majorAngle = i * 2.0 * Math.PI / RADIAL_SEGMENTS;
        let majorCos = Math.cos(majorAngle);
        let majorSin = Math.sin(majorAngle);
        
        for (let j = 0; j <= VERTICAL_SEGMENTS; j++) {
            let minorAngle = j * 2.0 * Math.PI / VERTICAL_SEGMENTS;
            let minorCos = Math.cos(minorAngle);
            let minorSin = Math.sin(minorAngle);
            
            let r = majorRadius + minorRadius * minorCos;
            let x = r * majorCos;
            let y = minorRadius * minorSin;
            let z = r * majorSin;
            
            vertices.push(x, y, z);
            normals.push(minorCos * majorCos, minorSin, minorCos * majorSin);
        }
    }

    for (let i = 0; i < RADIAL_SEGMENTS; i++) {
        for (let j = 0; j < VERTICAL_SEGMENTS; j++) {
            let p1 = i * (VERTICAL_SEGMENTS + 1) + j;
            let p2 = (i + 1) * (VERTICAL_SEGMENTS + 1) + j;
            let p3 = i * (VERTICAL_SEGMENTS + 1) + j + 1;
            let p4 = (i + 1) * (VERTICAL_SEGMENTS + 1) + j + 1;

            indices.push(p1, p3, p2);
            indices.push(p3, p4, p2);
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
// Objek Kuadrik: Kerucut (Cone)
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
// Objek Kuadrik: Kerucut Ganda (Double Cone)
// ==============================================================
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
// 2. Objek Kurva Revolusi: Torus
// ==============================================================

export class Torus {
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

    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, majorRadius = 1, minorRadius = 0.3, color = [1.0, 1.0, 1.0]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this.color = color;

        // Generate Mesh
        const meshData = generateTorusMesh(majorRadius, minorRadius);
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
// 3. Objek Non-Quadric dari Kurva: Bézier Surface of Revolution (SOR)
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
// CURVE PROFILES DAN EXPORT
// ==============================================================

const HEAD_PROFILE = [
    [0.0, 0.0], [0.7, 0.3], [0.7, 0.8], [0.0, 1.0]
];
const BODY_PROFILE = [
    [0.0, 0.0], [0.3, 0.1], [0.05, 0.8], [0.1, 1]
];
const LIMB_PROFILE = [
    [0.2, 0.0], [0.3, 0.5], [0.1, 0.9], [0.0, 1.0]
];
const HORN_PROFILE = [
    [0.0, 0.0], [0.5, 0.2], [0.1, 0.4], [0.0, 0.5]
];

export const PROFILES = {
    HEAD: HEAD_PROFILE,
    BODY: BODY_PROFILE,
    LIMB: LIMB_PROFILE,
    HORN: HORN_PROFILE
};