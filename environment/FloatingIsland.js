// FloatingIsland.js
export class FloatingIsland {
    // Tambahkan _normal ke parameter constructor
    constructor(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal) { 
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._Mmatrix = _Mmatrix;
        this._normal = _normal; // <--- MODIFIKASI: Simpan lokasi _normal
        
        // Konstanta warna
        this.COLOR_GRASS = [0.1, 0.7, 0.1];
        this.COLOR_ROCK = [0.4, 0.3, 0.1];
        
        // Matriks posisi/model awal pulau
        this.MODEL_MATRIX = LIBS.get_I4();

        // --- Variabel untuk Geometri Island ---
        const islandSize = 10.0; 
        const islandResolution = 40;
        const bottomDepth = 6.0;
        const GRASS_HEIGHT = 0.01;
        const maxBottomRadius = islandSize / 2;
        
        // --- MODIFIKASI: Simpan konstanta untuk getHeightAt() ---
        this.maxBottomRadius = maxBottomRadius;
        this.GRASS_HEIGHT = GRASS_HEIGHT;
        
        // Variabel untuk menyimpan faktor acak agar konsisten
        const randomFactors = [];

        // --- 1. Geometri Permukaan Atas (Rumput) ---
        // Format vertex diubah menjadi: [X, Y, Z, Nx, Ny, Nz] (Position + Normal)
        const islandTopVertices = [];
        const islandTopIndices = [];
        const UP_NORMAL = [0.0, 1.0, 0.0]; // Normal untuk permukaan datar ke atas
        
        // Vertex tengah (Pusat lingkaran): [0.0, GRASS_HEIGHT, 0.0] + [0, 1, 0]
        islandTopVertices.push(0.0, GRASS_HEIGHT, 0.0, ...UP_NORMAL); 
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

            // Vertex di lingkaran luar: [x, GRASS_HEIGHT, z] + [0, 1, 0]
            islandTopVertices.push(x, GRASS_HEIGHT, z, ...UP_NORMAL); 
        }
        for (let i = 0; i < numSegments; i++) {
            const p1 = centerIndex + 1 + i;
            const p2 = centerIndex + 1 + ((i + 1) % numSegments);
            islandTopIndices.push(centerIndex, p1, p2); 
        }

        // --- 2. Geometri Bagian Bawah Kasar (Batu) ---
        // Format vertex: [X, Y, Z, Nx, Ny, Nz]
        const islandBottomVertices = [];
        const islandBottomIndices = [];
        const numRadialSegments = islandResolution;
        const numVerticalSegments = 5;
        const VERTEX_SIZE = 6; // Posisi (3) + Normal (3)

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
                
                // NORMAL: Untuk menyederhanakan, kita gunakan normal radial yang menunjuk keluar
                const radialNormal = LIBS.normalize([x, y, z]); // Aproksimasi Normal

                islandBottomVertices.push(x, y, z, ...radialNormal); // Push Position + Normal
            }
        }
    
        const numBottomVerticesPerLayer = numRadialSegments; 
        
        // Vertex pusat paling bawah (Normal menunjuk ke bawah)
        islandBottomVertices.push(0.0, -bottomDepth * 1.05, 0.0, 0.0, -1.0, 0.0); // Pos + Normal
        const bottomCenterIndex = islandBottomVertices.length / VERTEX_SIZE - 1; 

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
        // Jumlah vertices top sekarang 40 * 6 = 240. Jumlah index top = 40.
        const numTopVertices = numSegments + 1;
        const allVertices = islandTopVertices.concat(islandBottomVertices);
        
        // 1. Dinding Samping (Side Walls) - Menghubungkan topVertices dan bottomVertices (layer 0)
        const sideWallIndices = [];
        // Indeks di islandTopVertices: 1 sampai numSegments (index 0 adalah tengah)
        const firstTopEdgeVertexIndex = 1; 
        // Indeks di array gabungan allVertices: numTopVertices sampai (numTopVertices + numRadialSegments - 1)
        const firstBottomLayerVertexIndex = numTopVertices; 

        for (let j = 0; j < numSegments; j++) {
            const top_p0 = firstTopEdgeVertexIndex + j;
            const top_p1 = firstTopEdgeVertexIndex + ((j + 1) % numSegments);
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
        this.islandTopIndices = islandTopIndices; 

        // --- BUFFERS WEBGL ---
        // islandTopVertexBuffer
        this.islandTopVertexBuffer = GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, this.islandTopVertexBuffer);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(islandTopVertices), GL.STATIC_DRAW);

        this.islandTopIndexBuffer = GL.createBuffer();
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.islandTopIndexBuffer);
        GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.islandTopIndices), GL.STATIC_DRAW);

        // islandBottomVertexBuffer (mengandung semua vertices termasuk top edge dan bottom)
        this.islandBottomVertexBuffer = GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, this.islandBottomVertexBuffer);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(allVertices), GL.STATIC_DRAW);

        this.islandBottomIndexBuffer = GL.createBuffer();
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.islandBottomIndexBuffer);
        GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.finalBottomIndices), GL.STATIC_DRAW);
    }
    
    // FUNGSI HEIGHT UNTUK GRASS (Diambil dari solusi sebelumnya)
    getHeightAt(x, z) {
        const distance = Math.sqrt(x * x + z * z);
        
        let baseY = this.GRASS_HEIGHT;
        const noiseAmplitude = 0.15;
        const noiseFrequency = 1.5;
        
        const roughness = Math.sin(x * noiseFrequency) * Math.cos(z * noiseFrequency);
        const edgeFactor = (1 - distance / this.maxBottomRadius);
        
        baseY += roughness * noiseAmplitude * edgeFactor;
        
        if (distance > this.maxBottomRadius) {
            return -100;
        }

        return baseY;
    }

    // Metode render untuk menggambar pulau
    render() {
        const GL = this.GL;
        const _position = this._position;
        const _Mmatrix = this._Mmatrix;
        const _normal = this._normal; // <--- Gunakan lokasi normal yang disimpan
        const _uColor = GL.getUniformLocation(this.SHADER_PROGRAM, "uColor");
        const VERTEX_SIZE = 6; // 6 float per vertex (Position + Normal)
        
        // Terapkan Matriks Model (Transformasi global)
        GL.uniformMatrix4fv(_Mmatrix, false, this.MODEL_MATRIX);
        
        // Hitung stride dan offset dalam bytes (1 float = 4 bytes)
        const stride = 4 * VERTEX_SIZE;
        const positionOffset = 0;
        const normalOffset = 4 * 3; // Normal dimulai setelah 3 float posisi

        // DRAW 1: Permukaan Atas (Rumput)
        GL.uniform3fv(_uColor, this.COLOR_GRASS);
        GL.bindBuffer(GL.ARRAY_BUFFER, this.islandTopVertexBuffer);
        
        // Set Pointers untuk Position dan Normal
        GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, stride, positionOffset); 
        GL.vertexAttribPointer(_normal, 3, GL.FLOAT, false, stride, normalOffset); // <--- Binding Normal
        
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.islandTopIndexBuffer);
        GL.drawElements(GL.TRIANGLES, this.islandTopIndices.length, GL.UNSIGNED_SHORT, 0);
        
        // DRAW 2: Permukaan Bawah dan Sisi (Tanah/Batu)
        GL.uniform3fv(_uColor, this.COLOR_ROCK);
        GL.bindBuffer(GL.ARRAY_BUFFER, this.islandBottomVertexBuffer);
        
        // Set Pointers untuk Position dan Normal
        GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, stride, positionOffset); 
        GL.vertexAttribPointer(_normal, 3, GL.FLOAT, false, stride, normalOffset); // <--- Binding Normal
        
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.islandBottomIndexBuffer);
        GL.drawElements(GL.TRIANGLES, this.finalBottomIndices.length, GL.UNSIGNED_SHORT, 0);
    }
}