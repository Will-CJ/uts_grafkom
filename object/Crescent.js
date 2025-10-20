export class Crescent {
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
    MOVE_MATRIX = LIBS.get_I4();    
    POSITION_MATRIX = LIBS.get_I4();

    /**
     * @param {WebGLRenderingContext} GL - Konteks WebGL.
     * @param {number} SHADER_PROGRAM - Program shader WebGL.
     * @param {number} _position - Lokasi attribute 'position'.
     * @param {number} _MMatrix - Lokasi uniform 'MMatrix'.
     * @param {number} majorRadius - Jari-jari mayor (pusat donat).
     * @param {number} minorRadius - Jari-jari minor (ketebalan/penampang).
     * @param {number} startAngDeg - Sudut awal revolusi (dalam derajat, default: 0).
     * @param {number} endAngDeg - Sudut akhir revolusi (dalam derajat, default: 360).
     * @param {number} majorSegments - Segmen keliling (default: 32).
     * @param {number} minorSegments - Segmen penampang (default: 32).
     * @param {array} color - Warna RGB.
     */
    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, majorRadius = 1, minorRadius = 0.3, startAngDeg = 0, endAngDeg = 360, majorSegments = 32, minorSegments = 32, color = [1.0, 1.0, 1.0]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this.color = color;
        
        // --- KONVERSI SUDUT DARI DERAJAT KE RADIAN ---
        const startRad = LIBS.degToRad(startAngDeg);
        const endRad = LIBS.degToRad(endAngDeg);
        const angleRange = endRad - startRad;
        
        const RADIAL_SEGMENTS = majorSegments;
        const VERTICAL_SEGMENTS = minorSegments;

        // --- Mesh Generation ---
        for (let i = 0; i <= RADIAL_SEGMENTS; i++) {
            let majorAngle = startRad + (i / RADIAL_SEGMENTS) * angleRange;
            let majorCos = Math.cos(majorAngle);
            let majorSin = Math.sin(majorAngle);
            
            // 1. HITUNG FAKTOR PINCHING (Meruncingkan)
            let t = i / RADIAL_SEGMENTS; 
            
            // Sinusial, dari ~0 ke 1, kembali ke ~0.
            let pinchFactor = Math.sin(t * Math.PI); 
            
            // Tentukan skala minimum (agar tidak collapse/menghilang)
            const MIN_THICKNESS_SCALE = 0.05; 
            
            // Factor akhir: memastikan ketebalan berkurang drastis di ujung
            let scaleFactor = MIN_THICKNESS_SCALE + (1.0 - MIN_THICKNESS_SCALE) * pinchFactor;
            
            // 2. MODULASI MINOR RADIUS (Ketebalan)
            let currentMinorRadius = minorRadius * scaleFactor;
            
            // majorRadius tetap konstan (cincin tidak mengecil)
            let currentMajorRadius = majorRadius;
            
            for (let j = 0; j <= VERTICAL_SEGMENTS; j++) {
                let minorAngle = j * 2.0 * Math.PI / VERTICAL_SEGMENTS;
                let minorCos = Math.cos(minorAngle);
                let minorSin = Math.sin(minorAngle);
                
                // Gunakan currentMinorRadius yang dimodulasi
                let r = currentMajorRadius + currentMinorRadius * minorCos;
                let x = r * majorCos;
                let y = currentMinorRadius * minorSin; // Y (ketebalan) juga harus diskalakan
                let z = r * majorSin;
                
                this.vertex.push(x, y, z);
            }
        }

        // --- Faces (Menghubungkan segmen) ---
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
        
        // --- Menutup Ujung Potongan (jika tidak 360 derajat) ---
        if (Math.abs(angleRange - (2 * Math.PI)) > 0.001) {
            
            // Titik tengah pada penampang (minor segments) adalah VERTICAL_SEGMENTS + 1 titik.
            const profilePointsPerSegment = VERTICAL_SEGMENTS + 1;
            
            // Kita membuat faces untuk menutup potongan, menghubungkan titik awal (i=0) dan titik akhir (i=majorSegments)
            
            // Titik awal jalur
            for (let j = 0; j < VERTICAL_SEGMENTS; j++) {
                let p1 = j;
                let p2 = j + 1;
                // Titik pusat buatan (index -1) digunakan untuk triangulasi tutup
                
                // KOREKSI: Tanpa titik pusat, tutupnya harus menggunakan fan atau dicari geometrinya.
                // Untuk kesederhanaan, kita hanya menggunakan meshes dari Torus yang terpotong.
                // Dalam Torus, penutupnya adalah dua lingkaran yang di-extrude.
                // Kita akan membuat dua faces datar sederhana (fans) yang menutupi potongan awal dan akhir.
                
                // Untuk Torus, penutupnya adalah dua cincin yang tersisa di awal dan akhir jalur.
                // Kita akan membuat faces melingkar yang menutup lubang di penampang (minor).
                
                // Catatan: Karena penampang melingkar (minor), penutupnya sudah ada.
                // Untuk torus parsial, kita tidak menutupnya dengan wajah datar sederhana (kecuali profil minor diubah).
                // Kami biarkan terbuka untuk kasus ini, mengikuti geometri Torus standar.
            }
        }
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