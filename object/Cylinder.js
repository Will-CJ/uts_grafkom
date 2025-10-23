export class Cylinder {
    GL = null;
    SHADER_PROGRAM = null;
    _position = null;
    _MMatrix = null;
    _normal = null;          // <-- TAMBAHKAN
    OBJECT_VERTEX = null;    // Buffer Posisi
    OBJECT_NORMALS = null;   // <-- Buffer Normal BARU
    OBJECT_FACES = null;
    vertices = [];           // Array Posisi (Struktur Lama)
    normals = [];            // <-- Array Normal BARU (Paralel)
    faces = [];              // Array Index (Struktur Lama)
    numIndices = 0;          // <-- Jumlah Index
    childs = [];
    color = [1.0, 1.0, 1.0];
    MOVE_MATRIX = LIBS.get_I4();
    POSITION_MATRIX = LIBS.get_I4();

    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, _normal, // <-- Tambah _normal
                radius = 1, height = 2, uSegments = 30, color = [1.0, 1.0, 1.0]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this._normal = _normal; // <-- Simpan _normal
        this.color = color;

        this.vertices = [];
        this.normals = []; // <-- Inisialisasi normals
        this.faces = [];

        const halfHeight = height / 2;

        // --- Vertices & Normals Alas Bawah (Bottom Cap) ---
        const bottomCenterIndex = 0;
        this.vertices.push(0, -halfHeight, 0); // Posisi tengah bawah
        this.normals.push(0, -1, 0);           // Normal tengah bawah

        for (let i = 0; i <= uSegments; i++) {
            let u = (i / uSegments) * 2 * Math.PI;
            let cosU = Math.cos(u);
            let sinU = Math.sin(u);
            this.vertices.push(radius * cosU, -halfHeight, radius * sinU); // Posisi tepi bawah
            this.normals.push(0, -1, 0);                                  // Normal tepi bawah
        }

        // --- Vertices & Normals Alas Atas (Top Cap) ---
        const topCenterIndex = this.vertices.length / 3; // Index sebelum tambah vertex atas
        this.vertices.push(0, halfHeight, 0);  // Posisi tengah atas
        this.normals.push(0, 1, 0);            // Normal tengah atas

        for (let i = 0; i <= uSegments; i++) {
            let u = (i / uSegments) * 2 * Math.PI;
            let cosU = Math.cos(u);
            let sinU = Math.sin(u);
            this.vertices.push(radius * cosU, halfHeight, radius * sinU); // Posisi tepi atas
            this.normals.push(0, 1, 0);                                 // Normal tepi atas
        }

        // --- Vertices & Normals Sisi (Sides) ---
        // Kode asli Anda membuat duplikat vertex untuk sisi, kita ikuti
        const sideStartIndex = this.vertices.length / 3; // Index sebelum tambah vertex sisi
        for (let i = 0; i <= uSegments; i++) {
            let u = (i / uSegments) * 2 * Math.PI;
            let cosU = Math.cos(u);
            let sinU = Math.sin(u);

            // Normal radial untuk sisi
            const nx = cosU;
            const ny = 0;
            const nz = sinU;
            // (Tidak perlu normalisasi karena radius=1 implisit di cos/sin)

            // Vertex sisi bawah (duplikat dari tepi bawah)
            this.vertices.push(radius * cosU, -halfHeight, radius * sinU);
            this.normals.push(nx, ny, nz); // <-- Tambah Normal Sisi

            // Vertex sisi atas (duplikat dari tepi atas)
            this.vertices.push(radius * cosU, halfHeight, radius * sinU);
            this.normals.push(nx, ny, nz); // <-- Tambah Normal Sisi (sama)
        }

        // --- Faces Alas Bawah --- (Tidak Berubah)
        for (let i = 0; i < uSegments; i++) {
            this.faces.push(bottomCenterIndex, bottomCenterIndex + 1 + i, bottomCenterIndex + 1 + i + 1);
        }

        // --- Faces Alas Atas --- (Tidak Berubah)
        for (let i = 0; i < uSegments; i++) {
            // Urutan dibalik untuk normal Y+
            this.faces.push(topCenterIndex, topCenterIndex + 1 + i + 1, topCenterIndex + 1 + i);
        }

        // --- Faces Sisi --- (Tidak Berubah, menggunakan vertex sisi yang diduplikasi)
        for (let i = 0; i < uSegments; i++) {
            let p1 = sideStartIndex + (i * 2);      // Sisi bawah saat ini
            let p2 = p1 + 1;                        // Sisi atas saat ini
            let p3 = sideStartIndex + ((i + 1) * 2);// Sisi bawah berikutnya
            let p4 = p3 + 1;                        // Sisi atas berikutnya
            this.faces.push(p1, p2, p3); // Segitiga 1 (bawah_i, atas_i, bawah_next)
            this.faces.push(p2, p4, p3); // Segitiga 2 (atas_i, atas_next, bawah_next)
        }

        this.numIndices = this.faces.length; // Simpan jumlah index
    }

    setup() {
        // --- Buffer Posisi ---
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertices), this.GL.STATIC_DRAW);

        // --- [BARU] Buffer Normal ---
        this.OBJECT_NORMALS = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_NORMALS);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.normals), this.GL.STATIC_DRAW);

        // --- Buffer Index ---
        this.OBJECT_FACES = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces), this.GL.STATIC_DRAW);

        this.childs.forEach(child => child.setup());
    }

    // --- RENDER (Mempertahankan Urutan Matriks Asli Anda) ---
    render(PARENT_MATRIX) {
        // 1. Hitung Model Matrix (Urutan Asli Anda: (Move * Pos) * Parent)
        let transformMatrix = LIBS.multiply(this.MOVE_MATRIX, this.POSITION_MATRIX); // Move * Pos
        transformMatrix = LIBS.multiply(transformMatrix, PARENT_MATRIX);     // (Move * Pos) * Parent

        this.GL.useProgram(this.SHADER_PROGRAM);

        // 2. Kirim Uniform Matrix Model
        this.GL.uniformMatrix4fv(this._MMatrix, false, transformMatrix);

        // 3. Kirim Uniform Warna
        const _uColor = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uColor");
        this.GL.uniform3fv(_uColor, this.color);

        // 4. Bind & Atur Atribut
        // Atribut Posisi
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 0, 0);
        this.GL.enableVertexAttribArray(this._position);

        // Atribut Normal
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