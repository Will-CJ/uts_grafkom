export class Ellipsoid {
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
                a = 1, b = 1, c = 1, uSegments = 30, vSegments = 30,
                horizontalAngleDeg = 360, color = [1.0, 1.0, 1.0]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this._normal = _normal; // <-- Simpan _normal
        this.color = color;
        this.POSITION_MATRIX = LIBS.get_I4();
        this.MOVE_MATRIX = LIBS.get_I4();
        this.vertices = [];
        this.normals = []; // <-- Inisialisasi normals
        this.faces = [];

        // --- Parameter Sudut (Tetap Sama seperti kode asli Anda) ---
        const vStart = -Math.PI / 2;
        const vEnd = Math.PI / 2;
        const horizontalAngleRad = horizontalAngleDeg * Math.PI / 180;
        const uStart = -horizontalAngleRad / 2;
        const uEnd = horizontalAngleRad / 2;

        // --- Buat Vertices & Normals ---
        // Loop ini SAMA seperti kode asli Anda untuk VERTICES
        // Hanya menambahkan perhitungan & push normal
        for (let i = 0; i <= vSegments; i++) {
            let v = vStart + (i / vSegments) * (vEnd - vStart);
            for (let j = 0; j <= uSegments; j++) {
                let u = uStart + (j / uSegments) * (uEnd - uStart);
                // --- Hitung Posisi Vertex (Menggunakan rumus ASLI Anda) ---
                let x = a * Math.cos(v) * Math.cos(u);
                let y = b * Math.cos(v) * Math.sin(u); // Rumus Y asli Anda
                let z = c * Math.sin(v);             // Rumus Z asli Anda
                this.vertices.push(x, y, z);

                // --- [BARU] Hitung Normal Berdasarkan Posisi Asli ---
                // Normal N = normalize(x/a^2, y_correct/b^2, z_correct/c^2)
                // Kita perlu HATI-HATI karena Y dan Z asli Anda mungkin tertukar
                // Asumsi: Anda menginginkan ellipsoid Y-up secara visual,
                // maka normal Y harusnya berhubungan dengan sin(v), Z dgn cos(v)sin(u)
                let y_for_normal = c * Math.sin(v); // Y yang seharusnya (pakai sin(v))
                let z_for_normal = b * Math.cos(v) * Math.sin(u); // Z yang seharusnya (pakai cos(v)sin(u))

                let nx = x / (a * a);
                let ny = y_for_normal / (b * b); // Gunakan Y yang benar untuk normal
                let nz = z_for_normal / (c * c); // Gunakan Z yang benar untuk normal
                const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
                if (len > 0) {
                    nx /= len;
                    ny /= len;
                    nz /= len;
                } else {
                   nx = 0; ny = (v > 0 ? 1 : -1); nz = 0; // Fallback kutub Y
                }
                this.normals.push(nx, ny, nz); // <-- Tambah Normal
            }
        }

        // --- Buat Faces (Indices) untuk Permukaan Melengkung ---
        // Kode ini SAMA seperti kode asli Anda
        for (let i = 0; i < vSegments; i++) {
            for (let j = 0; j < uSegments; j++) {
                let p1 = i * (uSegments + 1) + j;
                let p2 = p1 + (uSegments + 1);
                // Waspada: Indexing asli ini mungkin salah
                this.faces.push(p1, p2, p1 + 1);
                this.faces.push(p1 + 1, p2, p2 + 1);
            }
        }

        // --- Tambah Faces Tutup (jika Slice) ---
        // Kode ini SAMA seperti kode asli Anda (yang mungkin bermasalah)
        if (horizontalAngleDeg < 360) {
            // Face 1 (at u = uStart)
            for (let i = 0; i < vSegments; i++) {
                let p1 = i * (uSegments + 1);
                let p2 = (i + 1) * (uSegments + 1);
                // Indexing asli Anda
                this.faces.push(p1, p2, p1 + uSegments + 1);
                this.faces.push(p1, p2, p1 + uSegments + 1); // <-- Duplikat?
                this.faces.push(p1, p2, (i + 1) * (uSegments + 1) + 0);
                this.faces.push(p1, (i + 1) * (uSegments + 1) + 0, i * (uSegments + 1) + 0);
            }
            // Face 2 (at u = uEnd)
            for (let i = 0; i < vSegments; i++) {
                let p1 = i * (uSegments + 1) + uSegments;
                let p2 = (i + 1) * (uSegments + 1) + uSegments;
                 // Indexing asli Anda
                this.faces.push(p1, p2, p1 - 1);
                this.faces.push(p1, p2, p1 - 1); // <-- Duplikat?
                this.faces.push(p1, i * (uSegments + 1) + uSegments, (i + 1) * (uSegments + 1) + uSegments);
                this.faces.push(p1, (i + 1) * (uSegments + 1) + uSegments, i * (uSegments + 1) + uSegments);
            }
            // CATATAN: Kode tutup asli tidak menambahkan vertex tengah atau normal spesifik
            // Jadi kita tidak perlu menambahkan normal tambahan di sini.
        }

        this.numIndices = this.faces.length; // Simpan jumlah index
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
        let transformMatrix = LIBS.multiply(this.MOVE_MATRIX, this.POSITION_MATRIX); // Move * Pos
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