export class ModifiedEllipsoid {
    GL = null;
    SHADER_PROGRAM = null;
    _position = null;
    _MMatrix = null;
    _normal = null;          // <-- TAMBAHKAN
    OBJECT_VERTEX = null;    // Buffer Posisi
    OBJECT_NORMALS = null;   // <-- Buffer Normal BARU
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
                horizontalAngleDeg = 360, verticalAngleDeg = 180, startVerticalDeg = -90,
                color = [1.0, 1.0, 1.0]) {
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
        const horizontalAngleRad = horizontalAngleDeg * Math.PI / 180;
        const uStart = -horizontalAngleRad / 2;
        const uEnd = horizontalAngleRad / 2;
        const vStartDeg = startVerticalDeg;
        const vEndDeg = startVerticalDeg + verticalAngleDeg;
        const vStartRad = LIBS.degToRad(vStartDeg);
        const vEndRad = LIBS.degToRad(vEndDeg);

        // --- Buat Vertices & Normals ---
        // Loop ini SAMA seperti kode asli Anda untuk VERTICES
        // Hanya menambahkan perhitungan & push normal
        for (let i = 0; i <= vSegments; i++) {
            let v = vStartRad + (i / vSegments) * (vEndRad - vStartRad);
            let cosV = Math.cos(v);
            let sinV = Math.sin(v);

            for (let j = 0; j <= uSegments; j++) {
                let u = uStart + (j / uSegments) * (uEnd - uStart);
                let cosU = Math.cos(u);
                let sinU = Math.sin(u);

                // --- Hitung Posisi Vertex (Menggunakan rumus ASLI Anda - Z up?) ---
                let x = a * cosV * cosU;
                let y = b * cosV * sinU; // Rumus Y asli Anda
                let z = c * sinV;        // Rumus Z asli Anda
                this.vertices.push(x, y, z);

                // --- [BARU] Hitung Normal Berdasarkan Posisi Asli ---
                // Normal N = normalize(x/a^2, y/b^2, z/c^2) - Asumsi Z adalah sumbu vertikal
                let nx = x / (a * a);
                let ny = y / (b * b); // Gunakan Y asli Anda
                let nz = z / (c * c); // Gunakan Z asli Anda
                const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
                if (len > 0) {
                    nx /= len;
                    ny /= len;
                    nz /= len;
                } else {
                   // Fallback di kutub (sinV = +/-1 -> cosV = 0 -> x=y=0)
                   nx = 0; ny = 0; nz = (v > 0 ? 1 : -1); // Arah sumbu Z
                }
                this.normals.push(nx, ny, nz); // <-- Tambah Normal
            }
        }

        // --- Buat Faces (Indices) untuk Permukaan Melengkung ---
        for (let i = 0; i < vSegments; i++) {
            for (let j = 0; j < uSegments; j++) {
                let p1 = i * (uSegments + 1) + j;
                let p2 = p1 + (uSegments + 1);
                this.faces.push(p1, p2, p1 + 1);
                this.faces.push(p1 + 1, p2, p2 + 1);
            }
        }

        // --- Tambah Faces Tutup (jika Slice) ---
        // Kode asli Anda TIDAK menambahkan vertex baru untuk tutup,
        // hanya mencoba membuat faces dari vertex yang ada. Kita ikuti saja.
        // Normal untuk vertex ini sudah dihitung di loop atas sebagai normal melengkung.
        if (horizontalAngleDeg < 360) {
            // Face 1 (at u = uStart) - Kode Asli Anda
            for (let i = 0; i < vSegments; i++) {
                let p1 = i * (uSegments + 1);
                let p2 = (i + 1) * (uSegments + 1);
                // Indexing asli Anda (termasuk duplikat dan koreksi aneh)
                this.faces.push(p1, p2, p1 + uSegments + 1);
                this.faces.push(p1, p2, p1 + uSegments + 1);
                this.faces.push(p1, p2, (i + 1) * (uSegments + 1) + 0);
                this.faces.push(p1, (i + 1) * (uSegments + 1) + 0, i * (uSegments + 1) + 0);
            }
            // Face 2 (at u = uEnd) - Kode Asli Anda
            for (let i = 0; i < vSegments; i++) {
                let p1 = i * (uSegments + 1) + uSegments;
                let p2 = (i + 1) * (uSegments + 1) + uSegments;
                // Indexing asli Anda (termasuk duplikat dan koreksi aneh)
                this.faces.push(p1, p2, p1 - 1);
                this.faces.push(p1, p2, p1 - 1);
                this.faces.push(p1, i * (uSegments + 1) + uSegments, (i + 1) * (uSegments + 1) + uSegments);
                this.faces.push(p1, (i + 1) * (uSegments + 1) + uSegments, i * (uSegments + 1) + uSegments);
            }
        }
        // Logika tutup jika verticalAngle < 180 tidak ada di kode asli Anda.

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