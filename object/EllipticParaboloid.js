export class EllipticParaboloid {
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
                a = 1, b = 1, c = 1, uSegments = 30, vSegments = 30, color = [1.0, 1.0, 1.0]) {
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

        // --- Buat Vertices & Normals ---
        // Loop ini SAMA seperti kode asli Anda untuk VERTICES
        // Hanya menambahkan perhitungan & push normal
        for (let i = 0; i <= vSegments; i++) { // Loop Vertikal (dari pusat ke tepi)
            let v = i / vSegments; // v = 0 (puncak) sampai 1 (tepi)
            for (let j = 0; j <= uSegments; j++) { // Loop Horizontal (keliling)
                let u = -Math.PI + (j / uSegments) * 2 * Math.PI; // u = -PI sampai +PI
                let cosU = Math.cos(u);
                let sinU = Math.sin(u);

                // --- Hitung Posisi Vertex (Menggunakan rumus ASLI Anda) ---
                let x = a * v * cosU;
                let y = b * v * sinU;
                let z = c * v * v;
                this.vertices.push(x, y, z);

                // --- [BARU] Hitung Normal ---
                // Berdasarkan turunan parsial: N = dP/dv x dP/du
                // dP/du = (-a*v*sin(u), b*v*cos(u), 0)
                // dP/dv = (a*cos(u), b*sin(u), 2*c*v)
                // N = ( (b*v*cos(u))*(2*c*v) - 0 ,
                //       0 - (-a*v*sin(u))*(2*c*v) ,
                //       (-a*v*sin(u))*(b*sin(u)) - (b*v*cos(u))*(a*cos(u)) )
                // N = ( 2*b*c*v^2*cos(u), 2*a*c*v^2*sin(u), -a*b*v*(sin^2+cos^2) )
                // N = ( 2*b*c*v^2*cos(u), 2*a*c*v^2*sin(u), -a*b*v )
                // Kita inginkan normal mengarah keluar/atas, jadi kita balik N = dP/dv x dP/du
                let nx = -2 * b * c * v * v * cosU; // v^2 karena turunan? Seharusnya v saja. Coba v.
                let ny = -2 * a * c * v * v * sinU;
                let nz = a * b * v;

                 // Koreksi perhitungan normal (hanya perlu v, bukan v^2)
                 nx = -2 * b * c * v * cosU;
                 ny = -2 * a * c * v * sinU;
                 nz = a * b; // Turunan z=cv^2 thdp v adalah 2cv. Cross product perlu 2cv juga.
                             // Tapi Z komponen normal paraboloid biasanya konstan (jika C=1)
                             // Mari gunakan formula N = [-dz/dx, -dz/dy, 1] jika z = x^2/a^2 + y^2/b^2
                             // dz/dx = 2x/a^2, dz/dy = 2y/b^2
                             // N ~ [-2x/a^2, -2y/b^2, 1]
                             // Atau dari parametrik: N = dP/dv x dP/du
                             // dP/du = (-a*v*sinU, b*v*cosU, 0)
                             // dP/dv = (a*cosU,   b*sinU,   2*c*v)
                             // Nx = (b*v*cosU * 2*c*v) - (0 * b*sinU) = 2*b*c*v^2*cosU
                             // Ny = (0 * a*cosU) - (-a*v*sinU * 2*c*v) = 2*a*c*v^2*sinU
                             // Nz = (-a*v*sinU * b*sinU) - (b*v*cosU * a*cosU) = -a*b*v*(sin^2+cos^2) = -a*b*v
                             // Balik arah: N = (-2*b*c*v^2*cosU, -2*a*c*v^2*sinU, a*b*v)

                 nx = -2 * b * c * v * v * cosU; // Gunakan v^2 dari cross product
                 ny = -2 * a * c * v * v * sinU;
                 nz = a * b * v;

                // Normalisasi
                const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
                if (len > 0) {
                    nx /= len;
                    ny /= len;
                    nz /= len;
                } else { // Fallback di puncak (v=0)
                   nx = 0; ny = 0; nz = (c > 0 ? 1 : -1); // Arah sumbu Z
                }
                this.normals.push(-nx, -ny, -nz); // <-- Tambah Normal
            }
        }

        // --- Buat Faces (Indices) ---
        // Kode ini SAMA seperti kode asli Anda
        for (let i = 0; i < vSegments; i++) {
            for (let j = 0; j < uSegments; j++) {
                let p1 = i * (uSegments + 1) + j;
                let p2 = p1 + (uSegments + 1);
                // Waspada: Indexing asli ini mungkin salah jika urutan vertex beda
                this.faces.push(p1, p2, p1 + 1);
                this.faces.push(p1 + 1, p2, p2 + 1);
            }
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