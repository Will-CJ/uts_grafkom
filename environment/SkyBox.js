// /environment/SkyBox.js

export class SkyBox {
    constructor(GL, SHADER_PROGRAM, _position, _uv, _sampler) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position; // Lokasi atribut 'position'
        this._uv = _uv;             // Lokasi atribut 'uv'
        this._sampler = _sampler;   // Lokasi uniform 'sampler'

        // Matriks Model untuk Skybox (Hanya untuk penempatan awal, tidak bergerak bersama kamera)
        this.MODEL_MATRIX = LIBS.get_I4();
        // Atur translasi Y awal
        LIBS.translateY(this.MODEL_MATRIX, -3.0); 
        
        // --- GEOMETRY & BUFFERS ---
        var cube_vertex = [
            // Format: x,y,z, u,v (5 components per vertex)
            // belakang
            -1,-1,-1,    1,1/3, 1,-1,-1,    3/4,1/3, 1, 1,-1,    3/4,2/3, -1, 1,-1,    1,2/3,
            // depan
            -1,-1, 1,    1/4,1/3, 1,-1, 1,    2/4,1/3, 1, 1, 1,    2/4,2/3, -1, 1, 1,    1/4,2/3,
            // kiri
            -1,-1,-1,    0,1/3, -1, 1,-1,    0,2/3, -1, 1, 1,    1/4,2/3, -1,-1, 1,    1/4,1/3,
            // kanan
            1,-1,-1,    3/4,1/3, 1, 1,-1,    3/4,2/3, 1, 1, 1,    2/4,2/3, 1,-1, 1,    2/4,1/3,
            // bawah
            -1,-1,-1,    1/4,0, -1,-1, 1,    1/4,1/3, 1,-1, 1,    2/4,1/3, 1,-1,-1,    2/4,0,
            // atas
            -1, 1,-1,    1/4,1, -1, 1, 1,    1/4,2/3, 1, 1, 1,    2/4,2/3, 1, 1,-1,    2/4,1
        ];

        let scale = 100; // Skala agar tampak "tak terbatas"
        for (let i = 0; i < cube_vertex.length; i+=5) {
            cube_vertex[i] *= scale;
            cube_vertex[i+1] *= scale;
            cube_vertex[i+2] *= scale;
        }

        this.cube_faces = [
            0, 1, 2,  0, 2, 3, 4, 5, 6,  4, 6, 7, 8, 9,10,  8,10,11,
            12,13,14, 12,14,15, 16,17,18, 16,18,19, 20,21,22, 20,22,23
        ];

        this.CUBE_VERTEX = GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, this.CUBE_VERTEX);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(cube_vertex), GL.STATIC_DRAW);

        this.CUBE_FACES = GL.createBuffer();
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.CUBE_FACES);
        GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.cube_faces), GL.STATIC_DRAW);
        
        // --- TEXTURE LOADING ---
        this.cube_texture = this.load_texture("skybox.png");
    }
    
    // Metode untuk memuat tekstur (dipindahkan dari main.js)
    load_texture(image_URL) {
        var GL = this.GL;
        var texture = GL.createTexture();
        var image = new Image();

        image.src = image_URL;
        image.onload = function () {
            GL.bindTexture(GL.TEXTURE_2D, texture);
            GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
            GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
            GL.bindTexture(GL.TEXTURE_2D, null);
        };
        return texture;
    }
    
    /**
     * Metode render untuk menggambar skybox.
     * @param {Float32Array} Pmatrix - Matriks Proyeksi.
     * @param {Float32Array} VmatrixWithoutTranslation - Matriks View tanpa Translasi Kamera.
     */
    render(Pmatrix, VmatrixWithoutTranslation) {
        const GL = this.GL;
        
        GL.useProgram(this.SHADER_PROGRAM); 
        
        // Dapatkan lokasi uniform di SHADER_PROGRAM Skybox
        const _sky_Pmatrix = GL.getUniformLocation(this.SHADER_PROGRAM, "Pmatrix");
        const _sky_Vmatrix = GL.getUniformLocation(this.SHADER_PROGRAM, "Vmatrix");
        const _sky_Mmatrix = GL.getUniformLocation(this.SHADER_PROGRAM, "Mmatrix");

        GL.uniformMatrix4fv(_sky_Pmatrix, false, Pmatrix);
        // Matriks View HANYA rotasi, sehingga Skybox tetap berpusat pada kamera.
        GL.uniformMatrix4fv(_sky_Vmatrix, false, VmatrixWithoutTranslation);
        GL.uniformMatrix4fv(_sky_Mmatrix, false, this.MODEL_MATRIX);

        GL.bindBuffer(GL.ARRAY_BUFFER, this.CUBE_VERTEX);
        // Pointer untuk 'position' (3 float, offset 0)
        GL.vertexAttribPointer(this._position, 3, GL.FLOAT, false, 4 * 5, 0); 
        // Pointer untuk 'uv' (2 float, offset 3 * 4 byte)
        GL.vertexAttribPointer(this._uv, 2, GL.FLOAT, false, 4 * 5, 4 * 3);
        
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.CUBE_FACES);
        
        GL.activeTexture(GL.TEXTURE0);
        GL.bindTexture(GL.TEXTURE_2D, this.cube_texture);
        GL.drawElements(GL.TRIANGLES, this.cube_faces.length, GL.UNSIGNED_SHORT, 0);
    }
}