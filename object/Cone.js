export class Cone {
    GL = null;
    SHADER_PROGRAM = null;
    _position = null;
    _MMatrix = null;
    _normal = null;          // <-- TAMBAHKAN
    OBJECT_VERTEX = null;    // Buffer Posisi
    OBJECT_NORMALS = null;   // <-- Buffer Normal BARU
    OBJECT_FACES = null;
    vertices = [];           // Array Posisi
    normals = [];            // <-- Array Normal BARU (Paralel)
    faces = [];              // Array Index
    numIndices = 0;          // <-- Jumlah Index
    childs = [];
    color = [1.0, 1.0, 1.0];
    MOVE_MATRIX = LIBS.get_I4();
    POSITION_MATRIX = LIBS.get_I4();

    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, _normal, // <-- Tambah _normal
                radius = 1, startAngDeg, endAngDeg, tipX, tipZ, height = 2, uSegments = 30, color = [1.0, 1.0, 1.0]) {
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
        const startRad = LIBS.degToRad(startAngDeg);
        const endRad = LIBS.degToRad(endAngDeg);
        const angleRange = endRad - startRad;

        // --- Puncak (Tip) ---
        const tipPos = [tipX, halfHeight, tipZ];
        this.vertices.push(...tipPos); // Indeks 0
        // Normal puncak akan dihitung nanti (rata-rata)
        // Untuk sementara, push placeholder atau normal awal (misal Y+)
        this.normals.push(0, 1, 0); // Placeholder normal for tip (index 0)

        // --- Vertices & Normals Alas ---
        const baseNormals = []; // Simpan normal alas sementara
        for (let i = 0; i <= uSegments; i++) {
            let u = startRad + (i / uSegments) * angleRange;
            let cosU = Math.cos(u);
            let sinU = Math.sin(u);

            // Posisi vertex alas
            const basePos = [radius * cosU, -halfHeight, radius * sinU];
            this.vertices.push(...basePos);

            // --- Hitung Normal Sisi untuk Vertex Alas ---
            // Vektor dari puncak ke titik alas (V)
            const V = [basePos[0] - tipPos[0], basePos[1] - tipPos[1], basePos[2] - tipPos[2]];
            // Vektor tangen lingkaran alas (T) - turunan posisi alas thdp sudut u
            const T = [-radius * sinU, 0, radius * cosU];
            // Normal = V x T (Cross Product), arahkan keluar
            let N = [
                V[1] * T[2] - V[2] * T[1],
                V[2] * T[0] - V[0] * T[2],
                V[0] * T[1] - V[1] * T[0]
            ];
            // Normalisasi
            const len = Math.sqrt(N[0]*N[0] + N[1]*N[1] + N[2]*N[2]);
            if (len > 0) {
                N[0] /= len; N[1] /= len; N[2] /= len;
            } else {
                N = [cosU, 0, sinU]; // Fallback ke arah radial jika gagal
            }
            this.normals.push(...N); // Push normal untuk vertex alas ini
            if (i < uSegments) { // Simpan untuk rata-rata normal puncak
                 baseNormals.push(N);
            }
        }

        // --- Hitung Ulang Normal Puncak (Rata-rata) ---
         if (baseNormals.length > 0) {
             let avgNx = 0, avgNy = 0, avgNz = 0;
             // Jika kerucut penuh, normal pertama dan terakhir harus dirata-ratakan juga
             if (Math.abs(angleRange - 2 * Math.PI) < 0.001) {
                 baseNormals.push(baseNormals[0]); // Include first normal again for wrap-around average
             }
             for (let i = 0; i < baseNormals.length; ++i) {
                 // Rata-rata normal dari segmen kiri dan kanan
                 const norm1 = baseNormals[i];
                 const norm2 = baseNormals[(i + 1) % baseNormals.length]; // Wrap around for the last segment if needed
                 avgNx += (norm1[0] + norm2[0]) * 0.5;
                 avgNy += (norm1[1] + norm2[1]) * 0.5;
                 avgNz += (norm1[2] + norm2[2]) * 0.5;
            }
            // Normalisasi rata-rata
            const avgLen = Math.sqrt(avgNx * avgNx + avgNy * avgNy + avgNz * avgNz);
             if (avgLen > 0) {
                 this.normals[0] = avgNx / avgLen; // Update normal X puncak (indeks 0)
                 this.normals[1] = avgNy / avgLen; // Update normal Y puncak (indeks 1)
                 this.normals[2] = avgNz / avgLen; // Update normal Z puncak (indeks 2)
             }
             // Jika gagal (misal baseNormals kosong), biarkan placeholder [0,1,0]
         }


        // --- Faces Sisi --- (Tidak Berubah)
        const tipIndex = 0;
        for (let i = 0; i < uSegments; i++) {
            let p2 = 1 + i;
            let p3 = 1 + i + 1;
            this.faces.push(tipIndex, p3, p2); // Urutan dibalik agar normal mengarah keluar
        }

        this.numIndices = this.faces.length; // Simpan jumlah index
    }

    setup() {
        // --- Buffer Posisi ---
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertices), this.GL.STATIC_DRAW);

        // --- Buffer Normal ---
        this.OBJECT_NORMALS = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_NORMALS);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.normals), this.GL.STATIC_DRAW);

        // --- Buffer Index ---
        this.OBJECT_FACES = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces), this.GL.STATIC_DRAW);

        this.childs.forEach(child => child.setup());
    }

    render(PARENT_MATRIX) {
        // 1. Hitung Model Matrix Final
        this.MODEL_MATRIX = LIBS.multiply(this.MOVE_MATRIX, this.POSITION_MATRIX); // Move * Pos
        this.MODEL_MATRIX = LIBS.multiply(this.MODEL_MATRIX, PARENT_MATRIX);

        this.GL.useProgram(this.SHADER_PROGRAM);

        // 2. Kirim Uniform Matrix Model
        this.GL.uniformMatrix4fv(this._MMatrix, false, this.MODEL_MATRIX);

        // 3. Kirim Uniform Warna
        const _uColor = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uColor");
        this.GL.uniform3fv(_uColor, this.color);

        // 4. Bind & Atur Atribut
        // Posisi
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 0, 0);
        this.GL.enableVertexAttribArray(this._position);

        // Normal
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_NORMALS);
        this.GL.vertexAttribPointer(this._normal, 3, this.GL.FLOAT, false, 0, 0);
        this.GL.enableVertexAttribArray(this._normal);


        // 5. Bind Index Buffer dan Gambar
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.drawElements(this.GL.TRIANGLES, this.numIndices, this.GL.UNSIGNED_SHORT, 0); // Gunakan numIndices

        // 6. Render Children
        this.childs.forEach(child => child.render(transformMatrix));
    }
}