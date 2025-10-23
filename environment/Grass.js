// /environment/Grass.js
import { Ellipsoid } from "../object/Ellipsoid.js";

export class Grass {
    // Tambahkan islandInstance sebagai parameter karena diperlukan untuk posisi Y yang akurat
    constructor(GL, SHADER_PROGRAM, _position, _Mmatrix, islandInstance) { 
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._Mmatrix = _Mmatrix;
        this.islandInstance = islandInstance; // Diperlukan untuk getHeightAt
        
        const NUM_GRASS_CLUMPS = 100;
        const MAX_ISLAND_RADIUS = 4.8; 
        const GRASS_Y_MARGIN = 0.01; // Margin kecil di atas permukaan
        const MAX_PLACEMENT_FACTOR = 0.8; // Batas penempatan: 80% dari MAX_ISLAND_RADIUS
        
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
            
            // --- TANYA KETINGGIAN KE PULAU (DIHAPUS JIKA TIDAK ADA islandInstance) ---
            // Karena kita harus berasumsi islandInstance dikirimkan di main.js
            const surfaceY = this.islandInstance ? this.islandInstance.getHeightAt(pX, pZ) : 0.01; 
            
            // Cek apakah rumput berada di area yang valid (untuk kasus getHeightAt)
            if (surfaceY < -10) continue; 
            
            // --- Penentuan Ukuran Ellipsoid (Rumput) ---
            const rX = Math.random() * (maxSize - minSize) + minSize;
            const rY = rX * (2.0 + Math.random() * 1.5); 
            const rZ = rX * (0.8 + Math.random() * 0.4); 
            
            // --- Penentuan Warna ---
            const color = i % 2 === 0 ? GREEN_A : GREEN_B;
            
            // --- Buat dan Posisikan Ellipsoid ---
            const grassEllipsoid = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, 
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