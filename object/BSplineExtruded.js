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
    OBJECT_VERTEX = null;
    OBJECT_FACES = null;
    childs = [];
    color = [1.0, 0.2, 0.4]; 
    MOVE_MATRIX = LIBS.get_I4();    
    POSITION_MATRIX = LIBS.get_I4();

    /**
     * @param {WebGLRenderingContext} GL - Konteks WebGL.
     * @param {WebGLProgram} SHADER_PROGRAM - Program shader WebGL.
     * @param {number} _position - Lokasi attribute 'position'.
     * @param {WebGLUniformLocation} _MMatrix - Lokasi uniform 'MMatrix'.
     * @param {Array<number[]>} controlPoints - Poin kontrol 2D untuk B-spline (profil hati).
     * @param {number} depth - Jarak ekstrusi (tebal objek).
     * @param {number} curveSegments - Jumlah segmen untuk aproksimasi kurva B-spline per segmen kontrol.
     * @param {array} color - Warna RGB.
     */
    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, controlPoints, depth = 0.1, curveSegments = 20, color = [1.0, 0.2, 0.4]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        // this._normal dihilangkan
        this._MMatrix = _MMatrix;
        this.controlPoints = controlPoints;
        this.depth = depth;
        this.curveSegments = curveSegments;
        this.color = color;

        this.vertices = [];
        // this.normals dihilangkan
        this.indices = [];
        
        this.generateGeometry();
    }

    calculateProfile() {
        // Asumsi fungsi calculateBsplinePoints tersedia
        return calculateBsplinePoints(this.controlPoints, this.curveSegments);
    }
    
    generateGeometry() {
        const profile = this.calculateProfile();
        const numProfilePoints = profile.length;
        if (numProfilePoints === 0) return;

        const halfDepth = this.depth / 2;

        // **1. GENERATE VERTICES (Depan & Belakang)**
        for (let i = 0; i < numProfilePoints; i++) {
            const [x, y] = profile[i];
            
            // Verteks Depan (z = -halfDepth)
            this.vertices.push(x, y, -halfDepth);
            // Normal dihilangkan

            // Verteks Belakang (z = +halfDepth)
            this.vertices.push(x, y, halfDepth);
            // Normal dihilangkan
        }

        // **2. GENERATE INDICES (Sisi Samping)**
        for (let i = 0; i < numProfilePoints; i++) {
            const nextIndex = (i + 1) % numProfilePoints;
            
            const i0 = i * 2;           // Depan saat ini
            const i1 = i * 2 + 1;       // Belakang saat ini
            const i2 = nextIndex * 2;   // Depan berikutnya
            const i3 = nextIndex * 2 + 1; // Belakang berikutnya
            
            this.indices.push(i0, i1, i2);
            this.indices.push(i2, i1, i3);

            // Perhitungan Normal Samping dihilangkan
        }

        // **3. GENERATE INDICES (Tutup Depan dan Belakang - Triangulasi Fan)**
        let sum_x = 0;
        let sum_y = 0;
        for (const p of profile) {
            sum_x += p[0];
            sum_y += p[1];
        }
        const center_x = sum_x / numProfilePoints;
        const center_y = sum_y / numProfilePoints;
        
        const baseCenterIndex = this.vertices.length / 3;

        // Tutup Depan: Tambahkan verteks tengah
        this.vertices.push(center_x, center_y, -halfDepth);
        // Normal dihilangkan
        
        // Tutup Belakang: Tambahkan verteks tengah
        this.vertices.push(center_x, center_y, halfDepth);
        // Normal dihilangkan
        
        const centerFrontIndex = baseCenterIndex;
        const centerBackIndex = baseCenterIndex + 1;

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
    
    // -----------------------------------------------------------------
    // | METODE WEBGL: SETUP DAN RENDER (Disesuaikan untuk Unlit) |
    // -----------------------------------------------------------------

    setup() {
        // Hanya buffer Vertex (Posisi)
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertices), this.GL.STATIC_DRAW);
        
        // Buffer Normal Dihilangkan

        // Buffer Index (Faces)
        this.OBJECT_FACES = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.GL.STATIC_DRAW);
        
        this.childs.forEach(child => child.setup());
    }

    render(PARENT_MATRIX) {
        // 1. Hitung Model Matrix
        this.MODEL_MATRIX = LIBS.multiply(this.MOVE_MATRIX, this.POSITION_MATRIX);
        this.MODEL_MATRIX = LIBS.multiply(this.MODEL_MATRIX, PARENT_MATRIX);
        
        this.GL.useProgram(this.SHADER_PROGRAM);
        
        // 2. Kirim Uniform Matrix Model
        this.GL.uniformMatrix4fv(this._MMatrix, false, this.MODEL_MATRIX);
        
        // 3. Kirim Uniform Warna (untuk warna solid)
        const _uColor = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uColor");
        this.GL.uniform3fv(_uColor, this.color);
        
        // 4. Bind dan Atur Vertex Position Attribute
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 0, 0);
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.drawElements(this.GL.TRIANGLES, this.indices.length, this.GL.UNSIGNED_SHORT, 0);

        this.childs.forEach(child => child.render(this.MODEL_MATRIX));
    }
}