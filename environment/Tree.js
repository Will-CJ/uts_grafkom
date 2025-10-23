// Tree.js
import { Cylinder } from "../object/Cylinder.js";
import { Ellipsoid } from "../object/Ellipsoid.js";

export class Tree {
    // TAMBAH: _normal ke constructor
    constructor(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._Mmatrix = _Mmatrix;
        this._normal = _normal; // SIMPAN LOKASI NORMAL
        
        // Warna
        const BROWN = [0.4, 0.2, 0.05];
        const GREEN_DARK = [0.05, 0.45, 0.05];
        const GREEN_LIGHT = [0.15, 0.55, 0.15];
        
        // --- 1. Batang (Trunk) ---
        const trunkRadius = 0.35;
        const trunkHeight = 2.8; 
        
        // MODIFIKASI: Kirim _normal ke constructor Cylinder
        this.trunk = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, this._normal, // <--- MODIFIKASI INI
                                  trunkRadius, trunkHeight, 30, BROWN);
        
        // Posisikan Batang agar berdiri di Y=0
        LIBS.translateY(this.trunk.POSITION_MATRIX, trunkHeight / 2);

        // --- 2. Mahkota Daun (50 Ellipsoid Terstruktur) ---
        
        const NUM_ELLIPSOIDS = 50;
        
        const CROWN_BASE_Y = trunkHeight - 1.0; 
        const MAX_CROWN_HEIGHT = 4.0;
        const MAX_CROWN_RADIUS = 3.5;
        
        this.crownObjects = [];
        let currentParent = this.trunk; 
        
        // Menggunakan loop terstruktur untuk menghasilkan 50 ellipsoid
        for (let i = 0; i < NUM_ELLIPSOIDS; i++) {
            
            // --- Penentuan Lapisan Vertikal (Y) ---
            const y_progress = i / NUM_ELLIPSOIDS; 
            const pY = CROWN_BASE_Y + y_progress * MAX_CROWN_HEIGHT;
            
            // --- Penentuan Posisi Horizontal (X, Z) ---
            const angle = i * 137.5 * (Math.PI / 180); 
            const max_r_at_y = MAX_CROWN_RADIUS * (1 - Math.pow(y_progress, 2.5)); 
            
            const radius = max_r_at_y * (0.3 + (i % 5) * 0.1); 
            
            const pX = Math.cos(angle) * radius;
            const pZ = Math.sin(angle) * radius;
            
            // --- Penentuan Ukuran Ellipsoid ---
            const base_size = (1 - y_progress) * 0.9 + 0.5; 
            
            const rX = base_size * (0.8 + (i % 3) * 0.1); 
            const rY = base_size * 0.8; 
            const rZ = base_size * (0.9 + (i % 4) * 0.05); 
            
            // --- Penentuan Warna ---
            const colorIndex = i % 2; 
            const color = colorIndex === 0 ? GREEN_DARK : GREEN_LIGHT;
            
            // --- Buat dan Posisikan Ellipsoid ---
            // MODIFIKASI: Kirim _normal ke constructor Ellipsoid
            const leafEllipsoid = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, this._normal, // <--- MODIFIKASI INI
                                                rX, rY, rZ, 30, 30, 360, color);
            
            LIBS.translateX(leafEllipsoid.POSITION_MATRIX, pX);
            LIBS.translateY(leafEllipsoid.POSITION_MATRIX, pY);
            LIBS.translateZ(leafEllipsoid.POSITION_MATRIX, pZ);

            currentParent.childs.push(leafEllipsoid);
            this.crownObjects.push(leafEllipsoid);
        }

        // Simpan root objek (Batang)
        this.root = this.trunk;
    }

    setup() {
        // Setup root akan otomatis men-setup semua children
        this.root.setup(); 
    }
    
    /**
     * Metode render untuk menggambar pohon.
     * @param {Float32Array} parentMatrix - Matriks transformasi global.
     */
    render(parentMatrix) {
        this.root.render(parentMatrix);
    }
}