export class Crescent {
    GL = null;
    SHADER_PROGRAM = null;
    _position = null;
    _MMatrix = null;
    _normal = null;          // <-- TAMBAHKAN
    OBJECT_VERTEX = null;    // Buffer Posisi
    OBJECT_NORMALS = null;   // <-- Buffer Normal BARU
    OBJECT_FACES = null;
    vertex = [];             // Array Posisi (Struktur Lama)
    normals = [];            // <-- Array Normal BARU (Paralel)
    faces = [];              // Array Index (Struktur Lama)
    numIndices = 0;          // <-- Jumlah Index
    childs = [];
    color = [1.0, 1.0, 1.0];
    MOVE_MATRIX = LIBS.get_I4();
    POSITION_MATRIX = LIBS.get_I4();

    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, _normal, // <-- Tambah _normal
                majorRadius = 1, minorRadius = 0.3, startAngDeg = 0, endAngDeg = 360,
                majorSegments = 32, minorSegments = 32, color = [1.0, 1.0, 1.0]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this._normal = _normal; // <-- Simpan _normal
        this.color = color;

        const startRad = LIBS.degToRad(startAngDeg);
        const endRad = LIBS.degToRad(endAngDeg);
        const angleRange = endRad - startRad;

        const RADIAL_SEGMENTS = majorSegments;
        const VERTICAL_SEGMENTS = minorSegments; // Ini adalah segmen penampang (minor)

        this.vertex = [];
        this.normals = []; // <-- Inisialisasi normals
        this.faces = [];

        // --- Mesh Generation ---
        for (let i = 0; i <= RADIAL_SEGMENTS; i++) { // Loop Mayor (keliling)
            let majorAngle = startRad + (i / RADIAL_SEGMENTS) * angleRange;
            let majorCos = Math.cos(majorAngle);
            let majorSin = Math.sin(majorAngle);

            let t = i / RADIAL_SEGMENTS;
            let pinchFactor = Math.sin(t * Math.PI);
            const MIN_THICKNESS_SCALE = 0.05;
            let scaleFactor = MIN_THICKNESS_SCALE + (1.0 - MIN_THICKNESS_SCALE) * pinchFactor;
            let currentMinorRadius = minorRadius * scaleFactor;
            let currentMajorRadius = majorRadius;

            for (let j = 0; j <= VERTICAL_SEGMENTS; j++) { // Loop Minor (penampang)
                let minorAngle = j * 2.0 * Math.PI / VERTICAL_SEGMENTS;
                let minorCos = Math.cos(minorAngle);
                let minorSin = Math.sin(minorAngle);

                // --- Hitung Posisi Vertex (Sama seperti kode asli) ---
                let r = currentMajorRadius + currentMinorRadius * minorCos;
                let x = r * majorCos;
                let y = currentMinorRadius * minorSin; // Y (ketebalan) juga diskalakan
                let z = r * majorSin;
                this.vertex.push(x, y, z);

                // --- [BARU] Hitung Normal ---
                // Vektor dari pusat cincin mayor ke pusat cincin minor
                const centerMinorX = currentMajorRadius * majorCos;
                const centerMinorZ = currentMajorRadius * majorSin;
                // Vektor dari pusat cincin minor ke titik di permukaan
                const vecMinorX = currentMinorRadius * minorCos * majorCos;
                const vecMinorY = currentMinorRadius * minorSin;
                const vecMinorZ = currentMinorRadius * minorCos * majorSin;
                // Vektor ini (sebelum normalisasi) adalah normalnya
                let nx = vecMinorX;
                let ny = vecMinorY;
                let nz = vecMinorZ;
                // Normalisasi
                const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
                if (len > 0) {
                    nx /= len;
                    ny /= len;
                    nz /= len;
                } else {
                    // Fallback jika minor radius 0 (di ujung runcing)
                    // Normal bisa diarahkan keluar secara radial dari sumbu Y
                    nx = majorCos;
                    ny = 0;
                    nz = majorSin;
                    const fallbackLen = Math.sqrt(nx*nx + nz*nz);
                    if(fallbackLen > 0) {
                        nx /= fallbackLen;
                        nz /= fallbackLen;
                    } else { // Jika major radius juga 0
                        nx = 1; ny = 0; nz = 0; // Default X+
                    }
                }
                this.normals.push(nx, ny, nz); // <-- Tambah Normal
            }
        }

        // --- Faces --- (Tidak Berubah)
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

        this.numIndices = this.faces.length; // Simpan jumlah index

        // --- Menutup Ujung Potongan --- (Tidak diubah, sepertinya tidak melakukan apa-apa)
        // if (Math.abs(angleRange - (2 * Math.PI)) > 0.001) {
        //     // ... (kode penutup ujung Anda) ...
        // }
    }

    setup() {
        // --- Buffer Posisi ---
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertex), this.GL.STATIC_DRAW);

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
        // PERHATIAN: Urutan ini mungkin tidak intuitif untuk hierarki.
        // Jika hasil visual aneh, coba ubah ke Parent * Pos * Move.
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