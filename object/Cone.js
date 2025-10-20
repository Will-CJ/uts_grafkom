export class Cone {
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
     * @param {number} radius - Jari-jari alas.
     * @param {number} height - Tinggi kerucut.
     * @param {number} uSegments - Jumlah segmen horizontal.
     * @param {array} color - Warna RGB.
     */
    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, radius = 1, startAngDeg, endAngDeg, tipX, tipZ, height = 2, uSegments = 30, color = [1.0, 1.0, 1.0]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this.color = color;
        
        this.vertex = [];
        this.faces = [];
        
        const halfHeight = height /2;

        const startRad = LIBS.degToRad(startAngDeg);
        const endRad = LIBS.degToRad(endAngDeg);
        const angleRange = endRad - startRad;
        
        const tipIndex = 0;
        // MENGGUNAKAN tipX dan tipZ untuk koordinat puncak:
        this.vertex.push(tipX, halfHeight, tipZ); // Indeks 0

        // Vertices Alas (Loop dimulai dari 1)
        for (let i = 0; i <= uSegments; i++) {
            let u = startRad + (i / uSegments) * angleRange;
            // Vertices diletakkan di -halfHeight
            this.vertex.push(radius * Math.cos(u), -halfHeight, radius * Math.sin(u));
        }
        
        // Faces Sisi (membuat segitiga dari puncak ke segmen alas)
        // Kita menggunakan titik [1] sampai [uSegments] sebagai titik alas
        for (let i = 0; i < uSegments; i++) {
            // p1 = tip (0)
            let p2 = 1 + i;
            let p3 = 1 + i + 1;
            
            // NOTE: Tidak perlu menyimpan Titik Pusat Alas karena kita hanya ingin permukaan.
            // Vertices dihitung dari indeks 1, bukan dari baseCenterIndex.
            
            this.faces.push(tipIndex, p3, p2); // Urutan terbalik agar normal mengarah keluar
        }
        
        // Catatan: Alas Ditinggalkan. Mesh hanya memiliki permukaan samping.
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
        
        // Menggunakan _MMatrix dari properti class
        this.GL.uniformMatrix4fv(this._MMatrix, false, this.MODEL_MATRIX);
        
        const _uColor = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uColor");
        this.GL.uniform3fv(_uColor, this.color);
        
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 0, 0);
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        
        // faces.length sudah menyimpan jumlah indeks yang benar
        this.GL.drawElements(this.GL.TRIANGLES, this.faces.length, this.GL.UNSIGNED_SHORT, 0);
        
        this.childs.forEach(child => child.render(this.MODEL_MATRIX));
    }
}