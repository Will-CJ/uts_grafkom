// Gardevoir.js
import { DoubleCone, Torus, BezierSOR, Cone, ConeSurface, PROFILES } from "./GardevoirObject.js";

// Definisikan class utama Gardevoir
export class Gardevoir {
    /**
     * @param {WebGLRenderingContext} GL - Konteks WebGL.
     * @param {number} SHADER_PROGRAM - Program shader WebGL.
     * @param {number} _position - Lokasi attribute 'position'.
     * @param {number} _uColor - Lokasi uniform 'uColor' (vec3).
     * @param {number} _Mmatrix - Lokasi uniform 'MMatrix'.
     * @param {number} _normal - Lokasi attribute 'normal' (diteruskan sebagai null karena shader sederhana).
     */
    constructor(GL, SHADER_PROGRAM, _position, _Mmatrix, _uColor, _normal = null) {
        // --- Mendefinisikan Warna Khas Gardevoir (RGB) ---
        const WHITE = [1.0, 1.0, 1.0];             // Putih (Gaun Atas, Kepala, Lengan)
        const GREEN = [0.4, 0.8, 0.6];             // Hijau Mint/Muda (Gaun Bawah)
        const RED = [0.9, 0.1, 0.1];               // Merah Cerah (Tanduk, Pinggang)
        
        // --- Store parameters as instance properties without redeclaring ---
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._Mmatrix = _Mmatrix;
        this._uColor = _uColor;
        this._normal = _normal; 
        
        // --- Store common parameters in an array for cleaner calls ---
        // GL_PARAMS: [GL, SHADER_PROGRAM, _position, _normal, _Mmatrix, _uColor]
        const GL_PARAMS = [this.GL, this.SHADER_PROGRAM, this._position, this._Mmatrix];

        // --- 1. BADAN UTAMA (ROOT) ---
        // BezierSOR(...GL_PARAMS, PROFILE, COLOR)
        this.body = new BezierSOR(
            ...GL_PARAMS,
            PROFILES.BODY, GREEN
        );
        LIBS.translateY(this.body.POSITION_MATRIX, 0.7);

        // --- 2. GAUN BAWAH ---
        const skirt1 = new ConeSurface(
            ...GL_PARAMS,
            1, 0, 90, -0.1, -0.1, 2.0, 30, WHITE 
        );
        LIBS.translateY(skirt1.POSITION_MATRIX, -0.3);
        LIBS.translateX(skirt1.POSITION_MATRIX, 0.05);
        LIBS.translateZ(skirt1.POSITION_MATRIX, 0.05);
        this.body.childs.push(skirt1);

        const skirt2 = new ConeSurface(
            ...GL_PARAMS,
            1, 90, 180, 0.1, -0.1, 2.0, 30, WHITE 
        );
        LIBS.translateY(skirt2.POSITION_MATRIX, -0.3);
        LIBS.translateX(skirt2.POSITION_MATRIX, -0.05);
        LIBS.translateZ(skirt2.POSITION_MATRIX, 0.05);
        this.body.childs.push(skirt2);

        const skirt3 = new ConeSurface(
            ...GL_PARAMS,
            1, 180, 270, 0.1, 0.1, 2.0, 30, WHITE 
        );
        LIBS.translateY(skirt3.POSITION_MATRIX, -0.3);
        LIBS.translateX(skirt3.POSITION_MATRIX, -0.05);
        LIBS.translateZ(skirt3.POSITION_MATRIX, -0.05);
        this.body.childs.push(skirt3);

        const skirt4 = new ConeSurface(
            ...GL_PARAMS,
            1, 270, 360, -0.1, 0.1, 2.0, 30, WHITE 
        );
        LIBS.translateY(skirt4.POSITION_MATRIX, -0.3);
        LIBS.translateX(skirt4.POSITION_MATRIX, 0.05);
        LIBS.translateZ(skirt4.POSITION_MATRIX, -0.05);
        this.body.childs.push(skirt4);

        // const ornament = new BezierSOR(
        //     ...GL_PARAMS,
        //     [
        //         [0.0, 0.0], [0.3, 0.1], [0.2, 0.1], [0.2, 1.0]
        //     ], 
        //     WHITE
        // );
        // LIBS.translateY(this.body.POSITION_MATRIX, 0.0);
        // this.body.childs.push(ornament);

        // Simpan objek utama (root)
        this.allObjects = [this.body];
    }
    
    // Metode untuk setup semua buffer
    setup() {
        this.allObjects.forEach(obj => obj.setup());
    }
    
    /**
     * Metode untuk merender semua objek. Ini yang dipanggil dari main.js.
     * @param {array} parentMatrix - Matriks global yang masuk (rotasi mouse * posisi global).
     */
    render(parentMatrix) {

        // --- Animasi Lokal (Gerakan Lengan) ---
        // Rotasi Z Lengan Kiri
        // const armLRotation = LIBS.degToRad(45 + Math.sin(time * 4) * 15);
        // LIBS.set_I4(this.armLeft.POSITION_MATRIX);
        // LIBS.translateY(this.armLeft.POSITION_MATRIX, 0.35); 
        // LIBS.translateX(this.armLeft.POSITION_MATRIX, -0.4);
        // LIBS.rotateZ(this.armLeft.POSITION_MATRIX, armLRotation);
        // LIBS.scale(this.armLeft.POSITION_MATRIX, 0.3, 1.0, 0.3);

        // Rotasi Z Lengan Kanan
        // const armRRotation = LIBS.degToRad(-45 - Math.sin(time * 4) * 15);
        // LIBS.set_I4(this.armRight.POSITION_MATRIX);
        // LIBS.translateY(this.armRight.POSITION_MATRIX, 0.35); 
        // LIBS.translateX(this.armRight.POSITION_MATRIX, 0.4);
        // LIBS.rotateZ(this.armRight.POSITION_MATRIX, armRRotation);
        // LIBS.scale(this.armRight.POSITION_MATRIX, 0.3, 1.0, 0.3);

        // Render objek root dan seluruh hierarkinya
        this.allObjects.forEach(obj => obj.render(parentMatrix));
    }
}