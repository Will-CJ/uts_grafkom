export class ModifiedEllipsoid {
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

    /**
     * Membuat Ellipsoid yang dimodifikasi dengan kontrol sudut horizontal dan vertikal.
     * @param {number} a - Radius X.
     * @param {number} b - Radius Y.
     * @param {number} c - Radius Z.
     * @param {number} horizontalAngleDeg - Sudut potong horizontal (0-360).
     * @param {number} verticalAngleDeg - Sudut potong vertikal (0-180).
     * @param {number} startVerticalDeg - Sudut awal vertikal (-90 hingga 90).
     */
    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, a = 1, b = 1, c = 1, uSegments = 30, vSegments = 30, horizontalAngleDeg = 360, verticalAngleDeg = 180, startVerticalDeg = -90, color = [1.0, 1.0, 1.0]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this.color = color;
        this.POSITION_MATRIX = LIBS.get_I4();
        this.MOVE_MATRIX = LIBS.get_I4();
        this.vertex = [];
        this.faces = [];

        // Konversi Sudut Horizontal
        const horizontalAngleRad = horizontalAngleDeg * Math.PI / 180;
        const uStart = -horizontalAngleRad / 2;
        const uEnd = horizontalAngleRad / 2; 

        // 🔑 KOREKSI: Menghitung Rentang Sudut Vertikal (v) 🔑
        // vStart dan vEnd adalah sudut latitudinal (latitude), dari -PI/2 (bawah) hingga PI/2 (atas).
        const vMax = Math.PI / 2;
        const vMin = -Math.PI / 2;

        // Hitung sudut latitudinal dalam radian (dari -PI/2 hingga PI/2)
        // Sudut Vertikal dimulai dari -90 (bawah) hingga +90 (atas).
        const vStartDeg = startVerticalDeg; // Sudut Awal (e.g., -90)
        const vEndDeg = startVerticalDeg + verticalAngleDeg; // Sudut Akhir (e.g., -90 + 180 = 90)
        
        const vStartRad = LIBS.degToRad(vStartDeg);
        const vEndRad = LIBS.degToRad(vEndDeg);

        // --- Buat Vertices untuk Permukaan Melengkung ---
        for (let i = 0; i <= vSegments; i++) {
            // Interpolasi sudut v (latitudinal) dalam radian
            let v = vStartRad + (i / vSegments) * (vEndRad - vStartRad); 
            
            for (let j = 0; j <= uSegments; j++) {
                // Interpolasi sudut u (longitudinal) dalam radian
                let u = uStart + (j / uSegments) * (uEnd - uStart); 
                
                // Koordinat Ellipsoid: (X, Y, Z)
                let x = a * Math.cos(v) * Math.cos(u);
                let y = b * Math.cos(v) * Math.sin(u);
                let z = c * Math.sin(v); // Z adalah sumbu vertikal/tinggi
                
                this.vertex.push(x, y, z);
            }
        }

        // --- Buat Faces untuk Permukaan Melengkung ---
        for (let i = 0; i < vSegments; i++) {
            for (let j = 0; j < uSegments; j++) {
                let p1 = i * (uSegments + 1) + j;
                let p2 = p1 + (uSegments + 1);
                
                this.faces.push(p1, p2, p1 + 1);
                this.faces.push(p1 + 1, p2, p2 + 1);
            }
        }
        
        // CATATAN: Logika untuk menutup 'cut faces' (jika horizontalAngleDeg < 360) 
        // atau bagian atas/bawah (jika verticalAngleDeg < 180) harus ditambahkan di sini.
        // Bagian ini sangat kompleks dan membutuhkan logika penentuan titik pusat caps.

        // Jika verticalAngleDeg < 180 dan tidak dimulai/berakhir di kutub, 
        // Anda memiliki dua cut faces horizontal (atas dan bawah).
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