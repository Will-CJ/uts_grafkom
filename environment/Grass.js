// /environment/Grass.js
import { Ellipsoid } from "../object/Ellipsoid.js";

export class Grass {
    // Tambahkan _normal ke parameter constructor
    constructor(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, islandInstance) { 
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._Mmatrix = _Mmatrix;
        this._normal = _normal; // BARU: Simpan lokasi normal
        this.islandInstance = islandInstance; 

        const NUM_GRASS_CLUMPS = 100;
        const MAX_ISLAND_RADIUS = 4.8; 
        const GRASS_Y_MARGIN = 0.01; 
        const MAX_PLACEMENT_FACTOR = 0.8; 
        
        // Warna Rumput (Gelap)
        const GREEN_A = [0.05, 0.4, 0.05];
        const GREEN_B = [0.1, 0.5, 0.1];
        
        // Ukuran Sangat Kecil
        const minSize = 0.03; 
        const maxSize = 0.08; 

        this.grassClumps = [];
        this.rootMatrix = LIBS.get_I4(); 

        // Hitung radius maksimum baru untuk penempatan 80%
        const PLACEMENT_RADIUS = MAX_ISLAND_RADIUS * MAX_PLACEMENT_FACTOR; 

        for (let i = 0; i < NUM_GRASS_CLUMPS; i++) {
            
            // --- Penentuan Posisi Acak di Dalam Lingkaran (Dibatasi 80%) ---
            const angle = Math.random() * 2 * Math.PI;
            
            // Nilai r acak hanya sampai PLACEMENT_RADIUS (80% dari 4.8)
            const r = Math.random() * PLACEMENT_RADIUS; 
            
            const pX = Math.cos(angle) * r;
            const pZ = Math.sin(angle) * r;
            
            // --- TANYA KETINGGIAN KE PULAU ---
            // Gunakan getHeightAt() dari islandInstance
            const surfaceY = this.islandInstance ? this.islandInstance.getHeightAt(pX, pZ) : 0.01; 
            
            // Cek apakah rumput berada di area yang valid
            if (surfaceY < -10) continue; 
            
            // --- Penentuan Ukuran Ellipsoid (Rumput) ---
            const rX = Math.random() * (maxSize - minSize) + minSize;
            const rY = rX * (2.0 + Math.random() * 1.5); 
            const rZ = rX * (0.8 + Math.random() * 0.4); 
            
            // --- Penentuan Warna ---
            const color = i % 2 === 0 ? GREEN_A : GREEN_B;
            
            // --- Buat dan Posisikan Ellipsoid ---
            // MODIFIKASI: Kirim this._normal ke constructor Ellipsoid
            const grassEllipsoid = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, this._normal, // <--- MODIFIKASI INI
                                                 rX, rY, rZ, 10, 10, 360, color);
            
            // Ketinggian Y yang benar
            const pY = surfaceY + GRASS_Y_MARGIN + rY / 2;
            
            LIBS.translateX(grassEllipsoid.POSITION_MATRIX, pX);
            LIBS.translateY(grassEllipsoid.POSITION_MATRIX, pY);
            LIBS.translateZ(grassEllipsoid.POSITION_MATRIX, pZ);

            this.grassClumps.push(grassEllipsoid);
        }
    }

    setup() {
        this.grassClumps.forEach(clump => clump.setup()); 
    }
    
    /**
     * Metode render untuk menggambar semua ellipsoid rumput.
     * @param {Float32Array} parentMatrix - Matriks transformasi global pulau.
     */
    render(parentMatrix) {
        this.grassClumps.forEach(clump => clump.render(parentMatrix));
    }
}