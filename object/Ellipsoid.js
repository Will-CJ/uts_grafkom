export class Ellipsoid {
    GL = null;
    SHADER_PROGRAM = null;
    _position = null;
    _MMatrix = null;
    _normal = null;          
    OBJECT_VERTEX = null;    
    OBJECT_NORMALS = null;   
    OBJECT_FACES = null;
    vertices = [];           
    normals = [];            
    faces = [];              
    numIndices = 0;          
    childs = [];
    color = [1.0, 1.0, 1.0];
    MOVE_MATRIX = LIBS.get_I4();
    POSITION_MATRIX = LIBS.get_I4();

    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, _normal, // <-- Menerima _normal
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
        this.normals = []; 
        this.faces = [];

        // --- Parameter Sudut ---
        const vStart = -Math.PI / 2;
        const vEnd = Math.PI / 2;
        const horizontalAngleRad = horizontalAngleDeg * Math.PI / 180;
        const uStart = -horizontalAngleRad / 2;
        const uEnd = horizontalAngleRad / 2;

        // --- Buat Vertices & Normals ---
        for (let i = 0; i <= vSegments; i++) {
            let v = vStart + (i / vSegments) * (vEnd - vStart);
            for (let j = 0; j <= uSegments; j++) {
                let u = uStart + (j / uSegments) * (uEnd - uStart);
                
                // --- Hitung Posisi Vertex (Sama seperti kode asli Anda) ---
                let x = a * Math.cos(v) * Math.cos(u);
                let y = b * Math.cos(v) * Math.sin(u); 
                let z = c * Math.sin(v); 
                this.vertices.push(x, y, z);

                // --- [PERBAIKAN] Hitung Normal Ellipsoid ---
                // Menggunakan rumus N = normalize(x/a^2, y/b^2, z/c^2)
                let nx = x / (a * a);
                let ny = y / (b * b); 
                let nz = z / (c * c); 
                
                const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
                if (len > 0) {
                    nx /= len;
                    ny /= len;
                    nz /= len;
                } else {
                    // Fallback kutub vertikal (Z-Axis, sesuai rumus z = c * sin(v))
                    nx = 0; ny = 0; nz = (v > 0 ? 1 : -1); 
                }
                this.normals.push(nx, ny, nz); 
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
        if (horizontalAngleDeg < 360) {
            // Face 1 (at u = uStart)
            for (let i = 0; i < vSegments; i++) {
                let p1 = i * (uSegments + 1);
                let p2 = (i + 1) * (uSegments + 1);
                // Indexing asli Anda (termasuk duplikat yang mungkin tidak diperlukan)
                this.faces.push(p1, p2, p1 + uSegments + 1);
                this.faces.push(p1, p2, p1 + uSegments + 1); 
                this.faces.push(p1, p2, (i + 1) * (uSegments + 1) + 0);
                this.faces.push(p1, (i + 1) * (uSegments + 1) + 0, i * (uSegments + 1) + 0);
            }
            // Face 2 (at u = uEnd)
            for (let i = 0; i < vSegments; i++) {
                let p1 = i * (uSegments + 1) + uSegments;
                let p2 = (i + 1) * (uSegments + 1) + uSegments;
                // Indexing asli Anda (termasuk duplikat yang mungkin tidak diperlukan)
                this.faces.push(p1, p2, p1 - 1);
                this.faces.push(p1, p2, p1 - 1); 
                this.faces.push(p1, i * (uSegments + 1) + uSegments, (i + 1) * (uSegments + 1) + uSegments);
                this.faces.push(p1, (i + 1) * (uSegments + 1) + uSegments, i * (uSegments + 1) + uSegments);
            }
        }

        this.numIndices = this.faces.length;
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

    // --- RENDER (TIDAK DIUBAH, MENGGUNAKAN URUTAN TERBALIK ANDA) ---
    render(PARENT_MATRIX) {
        // 1. Hitung Model Matrix (Urutan Asli Anda: (Move * Pos) * Parent)
        let transformMatrix = LIBS.multiply(this.MOVE_MATRIX, this.POSITION_MATRIX); // Move * Pos
        transformMatrix = LIBS.multiply(transformMatrix, PARENT_MATRIX);     // (Move * Pos) * Parent

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
        this.GL.drawElements(this.GL.TRIANGLES, this.numIndices, this.GL.UNSIGNED_SHORT, 0); 

        // 6. Render Children
        this.childs.forEach(child => child.render(transformMatrix));
    }
}