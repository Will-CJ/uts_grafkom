// Gardevoir.js
import { PROFILES } from "./GardevoirProfile.js";
import { BezierSOR } from "../object/BezierSOR.js"
import { Ellipsoid } from "../object/Ellipsoid.js"
import { Cone } from "../object/Cone.js"
import { Cylinder } from "../object/Cylinder.js"
import { Crescent } from "../object/Crescent.js"
import { BSplineExtruded } from "../object/BSplineExtruded.js"

// Definisikan class utama Gardevoir
export class Gardevoir {
    /**
     * @param {WebGLRenderingContext} GL - Konteks WebGL.
     * @param {number} SHADER_PROGRAM - Program shader WebGL.
     * @param {number} _position - Lokasi attribute 'position'.
     * @param {number} _Mmatrix - Lokasi uniform 'MMatrix'.
     * @param {number} _normal - Lokasi attribute 'normal' (diteruskan sebagai null karena shader sederhana).
     */
    constructor(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal = null) {
        // --- Mendefinisikan Warna Khas Gardevoir (RGB) ---
        const WHITE = [1.0, 1.0, 1.0];             // Putih (Gaun Atas, Kepala, Lengan)
        const GREEN = [0.7, 0.94, 0.7];             // Hijau Mint/Muda (Gaun Bawah)
        const RED = [1.0, 0.667, 0.686];               // Merah Cerah (Tanduk, Pinggang)
        
        // --- Store parameters as instance properties without redeclaring ---
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._Mmatrix = _Mmatrix;
        this._normal = _normal; 
        
        // --- Store common parameters in an array for cleaner calls ---
        // GL_PARAMS: [GL, SHADER_PROGRAM, _position, _normal, _Mmatrix]
        const GL_PARAMS = [this.GL, this.SHADER_PROGRAM, this._position, this._Mmatrix];

        //Badan
        this.body = new BezierSOR(
            ...GL_PARAMS,
            PROFILES.BODY, GREEN
        );
        LIBS.translateY(this.body.POSITION_MATRIX, 0.7);

        //Pink
        const bladeControlPoints = [
            [ -0.2, 1.0 ],  // Top peak
            [ 0.9, 1.1 ],  // Top curve assist
            [ 1.0, 0.1 ],  // Shoulder
            [ 0.7, -1.0 ]

        ];

        // Buat objek 3D dengan kedalaman 0.2
        const pinkBlade = new BSplineExtruded(GL, SHADER_PROGRAM, _position, _Mmatrix, bladeControlPoints, 0.05, 30, RED);
        LIBS.scale(pinkBlade.POSITION_MATRIX, 0.3, 0.3, 0.35)
        LIBS.rotateY(pinkBlade.MOVE_MATRIX, LIBS.degToRad(-90))
        LIBS.rotateX(pinkBlade.MOVE_MATRIX, LIBS.degToRad(-90))
        LIBS.translateY(pinkBlade.POSITION_MATRIX, 0.15)
        LIBS.translateZ(pinkBlade.POSITION_MATRIX, 0.16)
        this.body.childs.push(pinkBlade);

        //Leher
        const neck = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, 0.035, 0.2, 30, WHITE);
        LIBS.translateY(neck.POSITION_MATRIX, 0.5);
        this.body.childs.push(neck);

        // Kepala
        // Kepala Putih
        const headRadiusWhite = 0.18;
        const head = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, headRadiusWhite+0.01, headRadiusWhite, headRadiusWhite+0.03, 30, 30, 360, WHITE);
        LIBS.translateY(head.POSITION_MATRIX, 0.73);
        this.body.childs.push(head);

        // Kepala Hijau
        const headGreen1Radius = 0.198;
        const headGreen1 = new Ellipsoid(
            GL, SHADER_PROGRAM, _position, _Mmatrix,
            headGreen1Radius, headGreen1Radius, headGreen1Radius,
            30, 30, 150, GREEN
        );
        LIBS.translateY(headGreen1.POSITION_MATRIX, 0.01);
        LIBS.rotateZ(headGreen1.POSITION_MATRIX, Math.PI / 2);
        head.childs.push(headGreen1);

        const headGreen2Radius = 0.2;
        const headGreen2 = new Ellipsoid(
            GL, SHADER_PROGRAM, _position, _Mmatrix,
            headGreen2Radius, headGreen2Radius, headGreen2Radius,
            30, 30, 90, GREEN
        );
        LIBS.translateY(headGreen2.POSITION_MATRIX, 0.01);
        LIBS.translateZ(headGreen2.POSITION_MATRIX, 0.02);
        LIBS.rotateZ(headGreen2.POSITION_MATRIX, Math.PI / 2);
        LIBS.rotateX(headGreen2.POSITION_MATRIX, Math.PI / 4);
        head.childs.push(headGreen2);
        
        const headGreen3Radius = 0.2;
        const headGreen3 = new Ellipsoid(
            GL, SHADER_PROGRAM, _position, _Mmatrix,
            headGreen3Radius, headGreen3Radius, headGreen3Radius,
            30, 30, 90, GREEN
        );
        LIBS.translateY(headGreen3.POSITION_MATRIX, 0.01);
        LIBS.translateZ(headGreen3.POSITION_MATRIX, 0.02);
        LIBS.rotateZ(headGreen3.POSITION_MATRIX, Math.PI / 2.6);
        LIBS.rotateX(headGreen3.POSITION_MATRIX, Math.PI / 7);
        head.childs.push(headGreen3);
        
        const headGreen4Radius = 0.2;
        const headGreen4 = new Ellipsoid(
            GL, SHADER_PROGRAM, _position, _Mmatrix,
            headGreen4Radius, headGreen4Radius, headGreen4Radius,
            30, 30, 90, GREEN
        );
        LIBS.translateY(headGreen4.POSITION_MATRIX, 0.01);
        LIBS.translateZ(headGreen4.POSITION_MATRIX, 0.02);
        LIBS.rotateZ(headGreen4.POSITION_MATRIX, Math.PI / 1.57);
        LIBS.rotateX(headGreen4.POSITION_MATRIX, Math.PI / 7);
        head.childs.push(headGreen4);
        
        const headRadiusGreen = 0.18;
        const headGreen = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, headRadiusGreen+0.01, headRadiusGreen, headRadiusGreen+0.03, 30, 30, 360, GREEN);
        LIBS.translateZ(headGreen.POSITION_MATRIX, -0.005);
        head.childs.push(headGreen);

        //Kepang
        const braid_radius = 0.35;
        const braid_thickness = 0.15;
        const braid_start = 90;
        const braid_end = 270; // Dari samping kiri ke samping kanan (busur 180 derajat)

        const braid1 = new Crescent(
            ...GL_PARAMS,
            braid_radius,   // majorRadius (7)
            braid_thickness,// minorRadius (8)
            braid_start,    // startAngDeg (9)
            braid_end,      // endAngDeg (10)
            32,             // majorSegments (11)
            32,             // minorSegments (12)
            [0.7, 0.94, 0.8]             // color (13)
        );

        LIBS.translateY(braid1.POSITION_MATRIX, -0.04); 
        LIBS.translateZ(braid1.POSITION_MATRIX, 0.08); 
        LIBS.translateX(braid1.POSITION_MATRIX, 0.13); 
        LIBS.rotateZ(braid1.MOVE_MATRIX, LIBS.degToRad(90))
        LIBS.rotateX(braid1.MOVE_MATRIX, LIBS.degToRad(90))
        LIBS.scale(braid1.POSITION_MATRIX, 0.5, 0.5, 0.5); // Skala keseluruhan
        head.childs.push(braid1);

        const braid2 = new Crescent(
            ...GL_PARAMS,
            braid_radius,   // majorRadius (7)
            braid_thickness,// minorRadius (8)
            braid_start,    // startAngDeg (9)
            braid_end,      // endAngDeg (10)
            32,             // majorSegments (11)
            32,             // minorSegments (12)
            [0.7, 0.94, 0.8]             // color (13)
        );

        LIBS.translateY(braid2.POSITION_MATRIX, -0.04); 
        LIBS.translateZ(braid2.POSITION_MATRIX, 0.08); 
        LIBS.translateX(braid2.POSITION_MATRIX, -0.13); 
        LIBS.rotateZ(braid2.MOVE_MATRIX, LIBS.degToRad(90))
        LIBS.rotateX(braid2.MOVE_MATRIX, LIBS.degToRad(90))
        LIBS.scale(braid2.POSITION_MATRIX, 0.5, 0.5, 0.5); // Skala keseluruhan
        head.childs.push(braid2);

        //Gaun
        const skirt1 = new Cone(
            ...GL_PARAMS,
            0.7, 0, 90, -0.1, -0.1, 1.5, 30, WHITE 
        );
        LIBS.translateY(skirt1.POSITION_MATRIX, -0.3);
        LIBS.translateX(skirt1.POSITION_MATRIX, 0.05);
        LIBS.translateZ(skirt1.POSITION_MATRIX, 0.05);
        this.body.childs.push(skirt1);

        const skirt2 = new Cone(
            ...GL_PARAMS,
            0.7, 90, 180, 0.1, -0.1, 1.5, 30, WHITE 
        );
        LIBS.translateY(skirt2.POSITION_MATRIX, -0.3);
        LIBS.translateX(skirt2.POSITION_MATRIX, -0.05);
        LIBS.translateZ(skirt2.POSITION_MATRIX, 0.05);
        this.body.childs.push(skirt2);

        const skirt3 = new Cone(
            ...GL_PARAMS,
            0.7, 180, 270, 0.1, 0.1, 1.5, 30, WHITE 
        );
        LIBS.translateY(skirt3.POSITION_MATRIX, -0.3);
        LIBS.translateX(skirt3.POSITION_MATRIX, -0.05);
        LIBS.translateZ(skirt3.POSITION_MATRIX, -0.05);
        this.body.childs.push(skirt3);

        const skirt4 = new Cone(
            ...GL_PARAMS,
            0.7, 270, 360, -0.1, 0.1, 1.5, 30, WHITE 
        );
        LIBS.translateY(skirt4.POSITION_MATRIX, -0.3);
        LIBS.translateX(skirt4.POSITION_MATRIX, 0.05);
        LIBS.translateZ(skirt4.POSITION_MATRIX, -0.05);
        this.body.childs.push(skirt4);

        //Tangan Kiri
        const ArmLeftTopRadius = 0.05;
        const ArmLeftTopHeight = 0.9;
        const ArmLeftTop = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, ArmLeftTopRadius, ArmLeftTopHeight, 30, GREEN);
        LIBS.rotateZ(ArmLeftTop.POSITION_MATRIX, -Math.PI / 2);
        LIBS.translateY(ArmLeftTop.POSITION_MATRIX, 0.45);
        LIBS.translateX(ArmLeftTop.POSITION_MATRIX, -0.5);
        this.body.childs.push(ArmLeftTop);

        //Tangan Kanan
        const ArmRightTopRadius = 0.05;
        const ArmRightTopHeight = 0.9;
        const ArmRightTop = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, ArmRightTopRadius, ArmRightTopHeight, 30, GREEN);
        LIBS.rotateZ(ArmRightTop.POSITION_MATRIX, -Math.PI / 2);
        LIBS.translateY(ArmRightTop.POSITION_MATRIX, 0.45);
        LIBS.translateX(ArmRightTop.POSITION_MATRIX, 0.5);
        this.body.childs.push(ArmRightTop);

        // Kaki Kiri
        const legLeftTopRadius = 0.04;
        const legLeftTopHeight = 1.5;
        const legLeftTop = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, legLeftTopRadius, legLeftTopHeight, 30, GREEN);
        LIBS.translateY(legLeftTop.POSITION_MATRIX, -0.3);
        LIBS.translateX(legLeftTop.POSITION_MATRIX, -0.06);
        this.body.childs.push(legLeftTop);
        
        const legLeftBottomRadius = 0.15;
        const legLeftBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, legLeftBottomRadius-0.075, legLeftBottomRadius+0.1, legLeftBottomRadius-0.075, 30, 30, 360, GREEN);
        LIBS.translateY(legLeftBottom.POSITION_MATRIX, -0.55);
        legLeftTop.childs.push(legLeftBottom);
        
        // Kaki Kanan
        const legRightTopRadius = 0.04;
        const legRightTopHeight = 1.5;
        const legRightTop = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, legRightTopRadius, legRightTopHeight, 30, GREEN);
        LIBS.translateY(legRightTop.POSITION_MATRIX, -0.3);
        LIBS.translateX(legRightTop.POSITION_MATRIX, 0.06);
        this.body.childs.push(legRightTop);
        
        const legRightBottomRadius = 0.15;
        const legRightBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, legRightBottomRadius-0.075, legRightBottomRadius+0.1, legRightBottomRadius-0.075, 30, 30, 360, GREEN);
        LIBS.translateY(legRightBottom.POSITION_MATRIX, -0.55);
        legRightTop.childs.push(legRightBottom);

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