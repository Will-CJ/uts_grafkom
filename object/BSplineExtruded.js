function calculateBsplineTangent(t, P0, P1, P2) {
    // Turunan fungsi basis B-spline Kuadratik
    const N0_prime = -(1 - t);       // d/dt [0.5 * (1-t)^2] = 0.5 * 2 * (1-t) * (-1)
    const N1_prime = -2 * t + 1;     // d/dt [0.5 * (-2t^2 + 2t + 1)] = 0.5 * (-4t + 2)
    const N2_prime = t;              // d/dt [0.5 * t^2] = 0.5 * 2t

    const tx = N0_prime * P0[0] + N1_prime * P1[0] + N2_prime * P2[0];
    const ty = N0_prime * P0[1] + N1_prime * P1[1] + N2_prime * P2[1];

    return [tx, ty];
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
export class BSplineExtruded {
    GL = null;
    SHADER_PROGRAM = null;
    _position = null;
    _MMatrix = null;
    _normal = null;          // <-- TAMBAHKAN
    OBJECT_VERTEX = null;    // Buffer Posisi
    OBJECT_NORMALS = null;   // <-- Buffer Normal BARU
    OBJECT_FACES = null;
    vertices = [];           // Array Posisi (Struktur Asli Anda)
    normals = [];            // <-- Array Normal BARU (Paralel)
    indices = [];            // Array Index (Struktur Asli Anda)
    numIndices = 0;          // <-- Jumlah Index
    childs = [];
    color = [1.0, 0.2, 0.4];
    MOVE_MATRIX = LIBS.get_I4();
    POSITION_MATRIX = LIBS.get_I4();

    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, _normal, // <-- Tambah _normal
                controlPoints, depth = 0.1, curveSegments = 20, color = [1.0, 0.2, 0.4]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this._normal = _normal; // <-- Simpan _normal
        this.controlPoints = controlPoints;
        this.depth = depth;
        this.curveSegments = curveSegments;
        this.color = color;

        this.vertices = [];
        this.normals = []; // <-- Inisialisasi array normal
        this.indices = [];

        this.generateGeometry();
        this.numIndices = this.indices.length; // <-- Simpan jumlah index
    }

    calculateProfile() {
        // Fungsi ini TIDAK BERUBAH dari kode asli Anda
        return calculateBsplinePoints(this.controlPoints, this.curveSegments);
    }

    // --- [MODIFIKASI UTAMA GENERATE GEOMETRY] ---
    // Menggunakan struktur asli Anda + aproksimasi normal
    generateGeometry() {
        // const profile = this.calculateProfile(); // Kita tidak pakai profile langsung lagi
        // const numProfilePoints = profile.length; // Jumlah poin akan ditentukan oleh loop B-Spline

        const controlPoints = this.controlPoints;
        const segments = this.curveSegments;
        if (controlPoints.length < 3) {
            console.warn("BSplineExtruded: Butuh minimal 3 control points.");
            return;
        }

        const halfDepth = this.depth / 2;
        this.vertices = []; // Reset
        this.normals = [];  // Reset
        this.indices = [];  // Reset

        // --- Perluasan Control Points (Sama seperti calculateBsplinePoints) ---
        const extendedControlPoints = [...controlPoints];
        extendedControlPoints.push(controlPoints[0]);
        extendedControlPoints.push(controlPoints[1]);
        if (controlPoints.length === 3) extendedControlPoints.push(controlPoints[0]);

        const step = 1.0 / segments;
        const generatedProfilePoints = []; // Untuk menghitung centroid nanti

        // **1. GENERATE VERTICES & NORMALS (Depan & Belakang Sisi) - Loop B-Spline**
        for (let i = 0; i <= extendedControlPoints.length - 3; i++) {
            const P0 = extendedControlPoints[i];
            const P1 = extendedControlPoints[i + 1];
            const P2 = extendedControlPoints[i + 2];

            // Loop B-Spline untuk menghitung posisi DAN tangen
            for (let t = 0; t <= 1.0; t += step) {
                let currentT = Math.min(t, 1.0);

                // Hindari duplikasi titik akhir segmen B-spline (kecuali loop terakhir)
                if (i < extendedControlPoints.length - 3 && currentT > 1.0 - step * 0.5) {
                continue;
                }
                // Handle titik terakhir loop B-spline
                if (i === extendedControlPoints.length - 3 && currentT > 1.0) {
                    currentT = 1.0; // Paksa ke 1.0
                }

                // --- Hitung Posisi 2D ---
                const N0 = 0.5 * (1 - currentT) * (1 - currentT);
                const N1 = 0.5 * (-2 * currentT * currentT + 2 * currentT + 1);
                const N2 = 0.5 * currentT * currentT;
                const x = N0 * P0[0] + N1 * P1[0] + N2 * P2[0];
                const y = N0 * P0[1] + N1 * P1[1] + N2 * P2[1];
                generatedProfilePoints.push([x, y]); // Simpan untuk centroid

                // --- Hitung Normal Samping (dari Tangen B-Spline) ---
                const [tx, ty] = calculateBsplineTangent(currentT, P0, P1, P2);
                let nx_side = ty;
                let ny_side = -tx;
                const len_side = Math.sqrt(nx_side * nx_side + ny_side * ny_side);
                if (len_side > 0) {
                    nx_side /= len_side;
                    ny_side /= len_side;
                } else { // Fallback
                nx_side = x; ny_side = y;
                const len_rad = Math.sqrt(x*x + y*y);
                if(len_rad > 0) { nx_side /= len_rad; ny_side /= len_rad; } else { nx_side = 1; ny_side = 0;}
                }
                // --- Selesai Hitung Normal Samping ---

                // Verteks Depan
                this.vertices.push(x, y, -halfDepth);
                this.normals.push(nx_side, ny_side, 0); // Normal Samping

                // Verteks Belakang
                this.vertices.push(x, y, halfDepth);
                this.normals.push(nx_side, ny_side, 0); // Normal Samping (sama)

                 // Handle loop B-spline terakhir
                if (currentT === 1.0 && i === extendedControlPoints.length - 3) break;
            }
        }
        // Pastikan titik awal ditambahkan jika belum tertutup (opsional, tergantung calculateBsplinePoints)
        if (generatedProfilePoints.length > 0 &&
            (generatedProfilePoints[0][0] !== generatedProfilePoints[generatedProfilePoints.length-1][0] ||
            generatedProfilePoints[0][1] !== generatedProfilePoints[generatedProfilePoints.length-1][1]))
        {
             // Duplikasi vertex pertama (posisi dan normal) untuk menutup loop
            this.vertices.push(this.vertices[0], this.vertices[1], this.vertices[2]);
            this.normals.push(this.normals[0], this.normals[1], this.normals[2]);
            this.vertices.push(this.vertices[3], this.vertices[4], this.vertices[5]);
            this.normals.push(this.normals[3], this.normals[4], this.normals[5]);
             generatedProfilePoints.push(generatedProfilePoints[0]); // Tutup profil juga
        }

        const numProfilePoints = generatedProfilePoints.length; // Jumlah titik aktual yang dihasilkan

        // **2. GENERATE INDICES (Sisi Samping)** - TIDAK BERUBAH
        // Menggunakan numProfilePoints yang baru dihitung
        for (let i = 0; i < numProfilePoints; i++) {
            // Perlu dicek apakah i+1 perlu % numProfilePoints
            // Kode asli Anda menggunakan % numProfilePoints, jadi kita pertahankan
            const nextIndex = (i + 1) % numProfilePoints;
            // Indeks vertex tetap sama: depan = 2*i, belakang = 2*i+1
            const i0 = i * 2;
            const i1 = i * 2 + 1;
            const i2 = nextIndex * 2;
            const i3 = nextIndex * 2 + 1;
            this.indices.push(i0, i1, i2);
            this.indices.push(i2, i1, i3);
        }

        // **3. GENERATE VERTICES & NORMALS (Tutup - Tengah)** - TIDAK BERUBAH
        let sum_x = 0, sum_y = 0;
        // Gunakan generatedProfilePoints untuk centroid
        for (const p of generatedProfilePoints) { sum_x += p[0]; sum_y += p[1]; }
        const center_x = sum_x / numProfilePoints;
        const center_y = sum_y / numProfilePoints;
        const baseCenterIndex = this.vertices.length / 3;

        // Tutup Depan: Tambahkan verteks tengah
        this.vertices.push(center_x, center_y, -halfDepth);
        this.normals.push(0, 0, -1); // Normal Tutup Depan

        // Tutup Belakang: Tambahkan verteks tengah
        this.vertices.push(center_x, center_y, halfDepth);
        this.normals.push(0, 0, 1); // Normal Tutup Belakang

        const centerFrontIndex = baseCenterIndex;
        const centerBackIndex = baseCenterIndex + 1;

        // **4. GENERATE INDICES (Tutup)** - TIDAK BERUBAH
        // Menggunakan numProfilePoints yang baru dihitung
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


    setup() {
        // --- Buffer Posisi --- (Tidak Berubah)
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertices), this.GL.STATIC_DRAW);

        // --- Buffer Normal --- (Baru)
        this.OBJECT_NORMALS = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_NORMALS);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.normals), this.GL.STATIC_DRAW);

        // --- Buffer Index --- (Tidak Berubah)
        this.OBJECT_FACES = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.GL.STATIC_DRAW);

        this.childs.forEach(child => child.setup());
    }

    // --- [PERBAIKAN RENDER] ---
    render(PARENT_MATRIX) {
        // 1. Hitung Model Matrix Final (Urutan: Parent * Position * Move)
        // Pastikan urutan ini benar sesuai hierarki Anda
        this.MODEL_MATRIX = LIBS.multiply(this.MOVE_MATRIX, this.POSITION_MATRIX); // Move * Pos
        this.MODEL_MATRIX = LIBS.multiply(this.MODEL_MATRIX, PARENT_MATRIX);

        this.GL.useProgram(this.SHADER_PROGRAM);

        // 2. Kirim Uniform Matrix Model
        this.GL.uniformMatrix4fv(this._MMatrix, false, this.MODEL_MATRIX); // Kirim matriks final

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
        // Pastikan Anda menggunakan this.indices.length atau this.numIndices
        this.GL.drawElements(this.GL.TRIANGLES, this.indices.length, this.GL.UNSIGNED_SHORT, 0);

        // 6. Render Children
        // Berikan matriks final sebagai parent matrix untuk children
        this.childs.forEach(child => child.render(transformMatrix));
    }
}