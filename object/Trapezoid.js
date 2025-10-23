export class Trapezoid {
    GL = null;
    SHADER_PROGRAM = null;
    _position = null;
    _MMatrix = null;
    _normal = null;          // <-- TAMBAHKAN
    OBJECT_VERTEX = null;    // Buffer Posisi
    OBJECT_NORMALS = null;   // <-- Buffer Normal BARU
    OBJECT_FACES = null;
    vertices = [];           // Array Posisi (Struktur Lama Anda)
    normals = [];            // <-- Array Normal BARU (Paralel)
    faces = [];              // Array Index (Struktur Lama Anda)
    numIndices = 0;          // <-- Jumlah Index
    childs = [];
    color = [1.0, 1.0, 1.0];
    MOVE_MATRIX = LIBS.get_I4();
    POSITION_MATRIX = LIBS.get_I4();

    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, _normal, // <-- Tambah _normal
                baseA = 1, baseB = 2, height = 1, depth = 1, color = [1.0, 1.0, 1.0]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this._normal = _normal; // <-- Simpan _normal
        this.color = color;
        this.POSITION_MATRIX = LIBS.get_I4();
        this.MOVE_MATRIX = LIBS.get_I4();
        this.vertices = [];
        this.normals = []; // <-- Inisialisasi normals array (size = num vertices * 3)
        this.faces = [];

        // --- Vertices (Sama seperti kode asli Anda) ---
        const h = height / 2;
        const d = depth / 2;
        const halfBaseA = baseA / 2;
        const halfBaseB = baseB / 2;

        const v = [
            // Depan (z=d) - Indices 0, 1, 2, 3
            [ halfBaseA,  h, d], [-halfBaseA,  h, d], [-halfBaseB, -h, d], [ halfBaseB, -h, d],
            // Belakang (z=-d) - Indices 4, 5, 6, 7
            [ halfBaseA,  h,-d], [-halfBaseA,  h,-d], [-halfBaseB, -h,-d], [ halfBaseB, -h,-d]
        ];

        // Flatten vertices array
        this.vertices = v.flat();

        // --- Faces (Sama seperti kode asli Anda) ---
        // Format: [v0, v1, v2, ...]
        this.faces = [
             0, 1, 2,   0, 2, 3, // Depan
             4, 6, 5,   4, 7, 6, // Belakang
             0, 5, 4,   0, 1, 5, // Atas
             0, 3, 7,   0, 7, 4, // Kanan
             1, 6, 2,   1, 5, 6, // Kiri
             3, 2, 6,   3, 6, 7  // Bawah
        ];
        this.numIndices = this.faces.length;

        // --- [BARU] Hitung Normal Rata-rata per Vertex ---
        // Initialize normals with zeros
        this.normals = new Array(this.vertices.length).fill(0.0);

        // Calculate face normals and accumulate them per vertex
        for (let i = 0; i < this.faces.length; i += 3) {
            const i0 = this.faces[i];
            const i1 = this.faces[i+1];
            const i2 = this.faces[i+2];

            const v0 = [this.vertices[i0*3], this.vertices[i0*3+1], this.vertices[i0*3+2]];
            const v1 = [this.vertices[i1*3], this.vertices[i1*3+1], this.vertices[i1*3+2]];
            const v2 = [this.vertices[i2*3], this.vertices[i2*3+1], this.vertices[i2*3+2]];

            const edge1 = VEC.subtract(v1, v0);
            const edge2 = VEC.subtract(v2, v0);
            const faceNormal = VEC.normalize(VEC.cross(edge1, edge2));

            // Add face normal to each vertex of the face
            for (const index of [i0, i1, i2]) {
                this.normals[index*3 + 0] += faceNormal[0];
                this.normals[index*3 + 1] += faceNormal[1];
                this.normals[index*3 + 2] += faceNormal[2];
            }
        }

        // Normalize the accumulated normals for each vertex
        for (let i = 0; i < this.vertices.length / 3; i++) {
            const nx = this.normals[i*3 + 0];
            const ny = this.normals[i*3 + 1];
            const nz = this.normals[i*3 + 2];
            const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
            if (len > 0) {
                this.normals[i*3 + 0] /= len;
                this.normals[i*3 + 1] /= len;
                this.normals[i*3 + 2] /= len;
            }
            // else: normal remains [0,0,0], might happen for degenerate faces
        }
    }

    setup() {
        // --- Buffer Posisi --- (Tidak Berubah)
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertices), this.GL.STATIC_DRAW);

        // --- [BARU] Buffer Normal ---
        this.OBJECT_NORMALS = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_NORMALS);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.normals), this.GL.STATIC_DRAW);

        // --- Buffer Index --- (Tidak Berubah)
        this.OBJECT_FACES = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces), this.GL.STATIC_DRAW);

        this.childs.forEach(child => child.setup());
    }

    // --- RENDER (Mempertahankan Urutan Matriks Asli Anda) ---
    render(PARENT_MATRIX) {
        // 1. Hitung Model Matrix (Urutan Asli Anda: (Move * Pos) * Parent)
        let transformMatrix = LIBS.multiply(this.POSITION_MATRIX, this.MOVE_MATRIX); // Move * Pos
        transformMatrix = LIBS.multiply(transformMatrix, PARENT_MATRIX);     // (Move * Pos) * Parent

        this.GL.useProgram(this.SHADER_PROGRAM);

        // 2. Kirim Uniform Matrix Model
        this.GL.uniformMatrix4fv(this._MMatrix, false, transformMatrix);

        // 3. Kirim Uniform Warna
        const _uColor = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uColor");
        this.GL.uniform3fv(_uColor, this.color);

        // 4. Bind & Atur Atribut
        // Posisi
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 0, 0);
        this.GL.enableVertexAttribArray(this._position);

        // Normal
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_NORMALS); // <-- Bind buffer normal
        this.GL.vertexAttribPointer(this._normal, 3, this.GL.FLOAT, false, 0, 0); // <-- Pointer ke buffer normal
        this.GL.enableVertexAttribArray(this._normal); // <-- Aktifkan atribut normal


        // 5. Bind Index Buffer dan Gambar
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.drawElements(this.GL.TRIANGLES, this.numIndices, this.GL.UNSIGNED_SHORT, 0); // Gunakan numIndices

        // 6. Render Children
        this.childs.forEach(child => child.render(transformMatrix));
    }
}