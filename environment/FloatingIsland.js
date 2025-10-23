// FloatingIsland.js
export class FloatingIsland {
    constructor(GL, SHADER_PROGRAM, _position, _Mmatrix,_normal) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._Mmatrix = _Mmatrix;
        
        // Konstanta warna
        this.COLOR_GRASS = [0.1, 0.7, 0.1];
        this.COLOR_ROCK = [0.4, 0.3, 0.1];
        
        // Matriks posisi/model awal pulau
        this.MODEL_MATRIX = LIBS.get_I4();
        // Atur posisi Y awal jika diperlukan, misalnya:
        // LIBS.translateY(this.MODEL_MATRIX, -0.1);

        // --- Variabel untuk Geometri Island ---
        const islandSize = 10.0; 
        const islandResolution = 40;
        const bottomDepth = 6.0;
        const GRASS_HEIGHT = 0.01;
        const maxBottomRadius = islandSize / 2;
        
        // Variabel untuk menyimpan faktor acak agar konsisten
        const randomFactors = [];

        // --- 1. Geometri Permukaan Atas (Rumput) ---
        // (Masukkan seluruh logika perhitungan islandTopVertices dan islandTopIndices di sini)
        const islandTopVertices = [];
        const islandTopIndices = [];
        islandTopVertices.push(0.0, GRASS_HEIGHT, 0.0);
        const centerIndex = 0;
        const numSegments = islandResolution;
        const baseRadiusForGrass = maxBottomRadius; 

        for (let i = 0; i < numSegments; i++) {
            const angle = i * 2 * Math.PI / numSegments;
            const randomFactor = Math.random() * 0.3 + 0.8; 
            randomFactors.push(randomFactor);

            const currentRadius = baseRadiusForGrass * randomFactor; 
            const x = Math.cos(angle) * currentRadius;
            const z = Math.sin(angle) * currentRadius;

            islandTopVertices.push(x, GRASS_HEIGHT, z);
        }
        for (let i = 0; i < numSegments; i++) {
            const p1 = centerIndex + 1 + i;
            const p2 = centerIndex + 1 + ((i + 1) % numSegments);
            islandTopIndices.push(centerIndex, p1, p2); 
        }

        // --- 2. Geometri Bagian Bawah Kasar (Batu) ---
        // (Masukkan seluruh logika perhitungan islandBottomVertices dan index gabungan di sini)
        const islandBottomVertices = [];
        const islandBottomIndices = [];
        const numRadialSegments = islandResolution;
        const numVerticalSegments = 5;

        // ... (Logika perhitungan islandBottomVertices, islandBottomIndices, sideWallIndices) ...
        // PASTIKAN LOGIKA PENGGABUNGAN VERTEX DAN INDEX JUGA DIMASUKKAN DI SINI.

        // Bagian Bawah Kasar/Organik (Bentuk kerucut dengan variasi)
        for (let i = 0; i <= numVerticalSegments; i++) {
            const v = i / numVerticalSegments;
            const minRadiusFactor = 0.3;
            const currentRadius = maxBottomRadius * (1 - v * (1 - minRadiusFactor));
            let base_y = -bottomDepth * v;

            for (let j = 0; j < numRadialSegments; j++) {
                const angle = j * 2 * Math.PI / numRadialSegments;

                let randomFactor;
                if (i === 0) {
                    randomFactor = randomFactors[j]; 
                } else {
                    randomFactor = Math.random() * 0.3 + 0.8; 
                }

                const x = Math.cos(angle) * currentRadius * randomFactor;
                const z = Math.sin(angle) * currentRadius * randomFactor;
                const y_variation = (Math.random() - 0.5) * 0.5 * (v * v) * bottomDepth/8;
                let y = base_y + y_variation; 

                if (i === 0) y = 0.0 + y_variation * 0.1; 
                islandBottomVertices.push(x, y, z); 
            }
        }
    
        const numBottomVerticesPerLayer = numRadialSegments; 
        islandBottomVertices.push(0.0, -bottomDepth * 1.05, 0.0);
        const bottomCenterIndex = islandBottomVertices.length / 3 - 1; 

        // === Menghubungkan lapisan-lapisan (Dinding Bawah) ===
        for (let i = 0; i < numVerticalSegments; i++) {
            for (let j = 0; j < numRadialSegments; j++) {
                const p0 = i * numBottomVerticesPerLayer + j; 
                const p1 = i * numBottomVerticesPerLayer + ((j + 1) % numRadialSegments); 
                const p2 = (i + 1) * numBottomVerticesPerLayer + j; 
                const p3 = (i + 1) * numBottomVerticesPerLayer + ((j + 1) % numRadialSegments); 
                
                islandBottomIndices.push(p0, p2, p1);
                islandBottomIndices.push(p1, p2, p3);
            }
        }
        
        // === Menghubungkan lapisan terbawah ke pusat bawah ===
        const lastLayerStartIndex = numVerticalSegments * numBottomVerticesPerLayer;
        for (let j = 0; j < numRadialSegments; j++) {
            const p0 = lastLayerStartIndex + j;
            const p1 = lastLayerStartIndex + ((j + 1) % numRadialSegments);
            islandBottomIndices.push(p1, p0, bottomCenterIndex); 
        }

        // --- BUFFERS GABUNGAN (Finalisasi Index) ---
        const numTopVertices = numSegments + 1;
        const allVertices = islandTopVertices.concat(islandBottomVertices);
        
        // 1. Dinding Samping (Side Walls)
        const sideWallIndices = [];
        const firstTopVertexIndex = 1; 
        const firstBottomLayerVertexIndex = numTopVertices; 

        for (let j = 0; j < numSegments; j++) {
            const top_p0 = firstTopVertexIndex + j;
            const top_p1 = firstTopVertexIndex + ((j + 1) % numSegments);
            const bottom_p0 = firstBottomLayerVertexIndex + j;
            const bottom_p1 = firstBottomLayerVertexIndex + ((j + 1) % numSegments);
            
            sideWallIndices.push(top_p1, bottom_p1, top_p0); 
            sideWallIndices.push(top_p0, bottom_p1, bottom_p0); 
        }

        // 2. Bagian Bawah Organik & Dasar (Offsetting)
        const actualBottomIndices = [];
        for (const index of islandBottomIndices) {
            if (index === bottomCenterIndex) {
                 actualBottomIndices.push(bottomCenterIndex + numTopVertices);
            } else {
                 actualBottomIndices.push(index + numTopVertices);
            }
        }

        this.finalBottomIndices = sideWallIndices.concat(actualBottomIndices);
        this.islandTopIndices = islandTopIndices; // Simpan untuk render

        // --- BUFFERS WEBGL ---
        this.islandTopVertexBuffer = GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, this.islandTopVertexBuffer);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(islandTopVertices), GL.STATIC_DRAW);

        this.islandTopIndexBuffer = GL.createBuffer();
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.islandTopIndexBuffer);
        GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.islandTopIndices), GL.STATIC_DRAW);

        this.islandBottomVertexBuffer = GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, this.islandBottomVertexBuffer);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(allVertices), GL.STATIC_DRAW);

        this.islandBottomIndexBuffer = GL.createBuffer();
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.islandBottomIndexBuffer);
        GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.finalBottomIndices), GL.STATIC_DRAW);
    }

    // Metode render untuk menggambar pulau
    render() {
        const GL = this.GL;
        const _position = this._position;
        const _Mmatrix = this._Mmatrix;
        const _uColor = GL.getUniformLocation(this.SHADER_PROGRAM, "uColor");
        
        // Terapkan Matriks Model (Transformasi global)
        GL.uniformMatrix4fv(_Mmatrix, false, this.MODEL_MATRIX);

        // DRAW 1: Permukaan Atas (Rumput)
        GL.uniform3fv(_uColor, this.COLOR_GRASS);
        GL.bindBuffer(GL.ARRAY_BUFFER, this.islandTopVertexBuffer);
        GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 0, 0); 
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.islandTopIndexBuffer);
        GL.drawElements(GL.TRIANGLES, this.islandTopIndices.length, GL.UNSIGNED_SHORT, 0);
        
        // DRAW 2: Permukaan Bawah dan Sisi (Tanah/Batu)
        GL.uniform3fv(_uColor, this.COLOR_ROCK);
        GL.bindBuffer(GL.ARRAY_BUFFER, this.islandBottomVertexBuffer);
        // Vertex pointer menggunakan buffer gabungan
        GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 0, 0); 
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.islandBottomIndexBuffer);
        GL.drawElements(GL.TRIANGLES, this.finalBottomIndices.length, GL.UNSIGNED_SHORT, 0);
    }
}