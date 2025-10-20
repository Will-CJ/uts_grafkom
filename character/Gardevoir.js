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
        this.pinkBlade = new BSplineExtruded(GL, SHADER_PROGRAM, _position, _Mmatrix, bladeControlPoints, 0.05, 30, RED);
        LIBS.scale(this.pinkBlade.POSITION_MATRIX, 0.3, 0.3, 0.35)
        LIBS.rotateY(this.pinkBlade.MOVE_MATRIX, LIBS.degToRad(-90))
        LIBS.rotateX(this.pinkBlade.MOVE_MATRIX, LIBS.degToRad(-90))
        LIBS.translateY(this.pinkBlade.POSITION_MATRIX, 0.15)
        LIBS.translateZ(this.pinkBlade.POSITION_MATRIX, 0.16)
        this.body.childs.push(this.pinkBlade);

        //Leher
        this.neck = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, 0.035, 0.2, 30, WHITE);
        LIBS.translateY(this.neck.POSITION_MATRIX, 0.5);
        this.body.childs.push(this.neck);

        // Kepala
        // Kepala Putih
        const headRadiusWhite = 0.18;
        this.head = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, headRadiusWhite+0.01, headRadiusWhite, headRadiusWhite+0.03, 30, 30, 360, WHITE);
        LIBS.translateY(this.head.POSITION_MATRIX, 0.73);
        this.body.childs.push(this.head);

        // Kepala Hijau
        const headGreen1Radius = 0.198;
        this.headGreen1 = new Ellipsoid(
            GL, SHADER_PROGRAM, _position, _Mmatrix,
            headGreen1Radius, headGreen1Radius, headGreen1Radius,
            30, 30, 150, GREEN
        );
        LIBS.translateY(this.headGreen1.POSITION_MATRIX, 0.01);
        LIBS.rotateZ(this.headGreen1.POSITION_MATRIX, Math.PI / 2);
        this.head.childs.push(this.headGreen1);

        const headGreen2Radius = 0.2;
        this.headGreen2 = new Ellipsoid(
            GL, SHADER_PROGRAM, _position, _Mmatrix,
            headGreen2Radius, headGreen2Radius, headGreen2Radius,
            30, 30, 90, GREEN
        );
        LIBS.translateY(this.headGreen2.POSITION_MATRIX, 0.01);
        LIBS.translateZ(this.headGreen2.POSITION_MATRIX, 0.02);
        LIBS.rotateZ(this.headGreen2.POSITION_MATRIX, Math.PI / 2);
        LIBS.rotateX(this.headGreen2.POSITION_MATRIX, Math.PI / 4);
        this.head.childs.push(this.headGreen2);

        const headGreen3Radius = 0.2;
        this.headGreen3 = new Ellipsoid(
            GL, SHADER_PROGRAM, _position, _Mmatrix,
            headGreen3Radius, headGreen3Radius, headGreen3Radius,
            30, 30, 90, GREEN
        );
        LIBS.translateY(this.headGreen3.POSITION_MATRIX, 0.01);
        LIBS.translateZ(this.headGreen3.POSITION_MATRIX, 0.02);
        LIBS.rotateZ(this.headGreen3.POSITION_MATRIX, Math.PI / 2.6);
        LIBS.rotateX(this.headGreen3.POSITION_MATRIX, Math.PI / 7);
        this.head.childs.push(this.headGreen3);

        const headGreen4Radius = 0.2;
        this.headGreen4 = new Ellipsoid(
            GL, SHADER_PROGRAM, _position, _Mmatrix,
            headGreen4Radius, headGreen4Radius, headGreen4Radius,
            30, 30, 90, GREEN
        );
        LIBS.translateY(this.headGreen4.POSITION_MATRIX, 0.01);
        LIBS.translateZ(this.headGreen4.POSITION_MATRIX, 0.02);
        LIBS.rotateZ(this.headGreen4.POSITION_MATRIX, Math.PI / 1.57);
        LIBS.rotateX(this.headGreen4.POSITION_MATRIX, Math.PI / 7);
        this.head.childs.push(this.headGreen4);

        const headRadiusGreen = 0.18;
        this.headGreen = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, headRadiusGreen+0.01, headRadiusGreen, headRadiusGreen+0.03, 30, 30, 360, GREEN);
        LIBS.translateZ(this.headGreen.POSITION_MATRIX, -0.005);
        this.head.childs.push(this.headGreen);

        //Kepang
        const braid_radius = 0.35;
        const braid_thickness = 0.15;
        const braid_start = 90;
        const braid_end = 270; // Dari samping kiri ke samping kanan (busur 180 derajat)

        this.braid1 = new Crescent(
            ...GL_PARAMS,
            braid_radius,   // majorRadius (7)
            braid_thickness,// minorRadius (8)
            braid_start,    // startAngDeg (9)
            braid_end,      // endAngDeg (10)
            32,             // majorSegments (11)
            32,             // minorSegments (12)
            [0.7, 0.94, 0.8]             // color (13)
        );

        LIBS.translateY(this.braid1.POSITION_MATRIX, -0.04);
        LIBS.translateZ(this.braid1.POSITION_MATRIX, 0.08);
        LIBS.translateX(this.braid1.POSITION_MATRIX, 0.13);
        LIBS.rotateZ(this.braid1.MOVE_MATRIX, LIBS.degToRad(90))
        LIBS.rotateX(this.braid1.MOVE_MATRIX, LIBS.degToRad(90))
        LIBS.scale(this.braid1.POSITION_MATRIX, 0.5, 0.5, 0.5); // Skala keseluruhan
        this.head.childs.push(this.braid1);

        this.braid2 = new Crescent(
            ...GL_PARAMS,
            braid_radius,   // majorRadius (7)
            braid_thickness,// minorRadius (8)
            braid_start,    // startAngDeg (9)
            braid_end,      // endAngDeg (10)
            32,             // majorSegments (11)
            32,             // minorSegments (12)
            [0.7, 0.94, 0.8]             // color (13)
        );

        LIBS.translateY(this.braid2.POSITION_MATRIX, -0.04);
        LIBS.translateZ(this.braid2.POSITION_MATRIX, 0.08);
        LIBS.translateX(this.braid2.POSITION_MATRIX, -0.13);
        LIBS.rotateZ(this.braid2.MOVE_MATRIX, LIBS.degToRad(90))
        LIBS.rotateX(this.braid2.MOVE_MATRIX, LIBS.degToRad(90))
        LIBS.scale(this.braid2.POSITION_MATRIX, 0.5, 0.5, 0.5); // Skala keseluruhan
        this.head.childs.push(this.braid2);

        //Gaun
        this.skirt1 = new Cone(
            ...GL_PARAMS,
            0.7, 0, 90, -0.1, -0.1, 1.5, 30, WHITE
        );
        LIBS.translateY(this.skirt1.POSITION_MATRIX, -0.3);
        LIBS.translateX(this.skirt1.POSITION_MATRIX, 0.05);
        LIBS.translateZ(this.skirt1.POSITION_MATRIX, 0.05);
        this.body.childs.push(this.skirt1);

        this.skirt2 = new Cone(
            ...GL_PARAMS,
            0.7, 90, 180, 0.1, -0.1, 1.5, 30, WHITE
        );
        LIBS.translateY(this.skirt2.POSITION_MATRIX, -0.3);
        LIBS.translateX(this.skirt2.POSITION_MATRIX, -0.05);
        LIBS.translateZ(this.skirt2.POSITION_MATRIX, 0.05);
        this.body.childs.push(this.skirt2);

        this.skirt3 = new Cone(
            ...GL_PARAMS,
            0.7, 180, 270, 0.1, 0.1, 1.5, 30, WHITE
        );
        LIBS.translateY(this.skirt3.POSITION_MATRIX, -0.3);
        LIBS.translateX(this.skirt3.POSITION_MATRIX, -0.05);
        LIBS.translateZ(this.skirt3.POSITION_MATRIX, -0.05);
        this.body.childs.push(this.skirt3);

        this.skirt4 = new Cone(
            ...GL_PARAMS,
            0.7, 270, 360, -0.1, 0.1, 1.5, 30, WHITE
        );
        LIBS.translateY(this.skirt4.POSITION_MATRIX, -0.3);
        LIBS.translateX(this.skirt4.POSITION_MATRIX, 0.05);
        LIBS.translateZ(this.skirt4.POSITION_MATRIX, -0.05);
        this.body.childs.push(this.skirt4);

        //Tangan Kiri
        const ArmLeftTopRadius = 0.05;
        const ArmLeftTopHeight = 0.5;
        this.ArmLeftTop = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, ArmLeftTopRadius, ArmLeftTopHeight, 30, GREEN);
        LIBS.rotateZ(this.ArmLeftTop.POSITION_MATRIX, -Math.PI / 2);
        LIBS.translateY(this.ArmLeftTop.POSITION_MATRIX, 0.32);
        LIBS.translateX(this.ArmLeftTop.POSITION_MATRIX, -0.2);
        LIBS.rotateZ(this.ArmLeftTop.POSITION_MATRIX, LIBS.degToRad(40));
        this.body.childs.push(this.ArmLeftTop);

        const ArmLeftBottomRadius = 0.15;
        this.ArmLeftBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, ArmLeftBottomRadius-0.075, ArmLeftBottomRadius+0.15, ArmLeftBottomRadius-0.075, 30, 30, 360, GREEN);
        LIBS.translateY(this.ArmLeftBottom.POSITION_MATRIX, -0.5);
        this.ArmLeftTop.childs.push(this.ArmLeftBottom);

        //Tangan Kanan
        const ArmRightTopRadius = 0.05;
        const ArmRightTopHeight = 0.5;
        this.ArmRightTop = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, ArmRightTopRadius, ArmRightTopHeight, 30, GREEN);
        LIBS.rotateZ(this.ArmRightTop.POSITION_MATRIX, -Math.PI / 2);
        LIBS.translateY(this.ArmRightTop.POSITION_MATRIX, 0.32);
        LIBS.translateX(this.ArmRightTop.POSITION_MATRIX, 0.2);
        LIBS.rotateZ(this.ArmRightTop.POSITION_MATRIX, LIBS.degToRad(-40));
        this.body.childs.push(this.ArmRightTop);

        const ArmRightBottomRadius = 0.15;
        this.ArmRightBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, ArmRightBottomRadius-0.075, ArmRightBottomRadius+0.15, ArmRightBottomRadius-0.075, 30, 30, 360, GREEN);
        LIBS.translateY(this.ArmRightBottom.POSITION_MATRIX, 0.5);
        this.ArmRightTop.childs.push(this.ArmRightBottom);

        // Kaki Kiri
        const legLeftTopRadius = 0.04;
        const legLeftTopHeight = 1.1;
        this.legLeftTop = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, legLeftTopRadius, legLeftTopHeight, 30, GREEN);
        LIBS.translateY(this.legLeftTop.POSITION_MATRIX, -0.3);
        LIBS.translateX(this.legLeftTop.POSITION_MATRIX, -0.06);
        this.body.childs.push(this.legLeftTop);
       
        const legLeftBottomRadius = 0.15;
        this.legLeftBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, legLeftBottomRadius-0.075, legLeftBottomRadius+0.1, legLeftBottomRadius-0.075, 30, 30, 360, GREEN);
        LIBS.translateY(this.legLeftBottom.POSITION_MATRIX, -0.55);
        this.legLeftTop.childs.push(this.legLeftBottom);
    
        // Kaki Kanan
        const legRightTopRadius = 0.04;
        const legRightTopHeight = 1.1;
        this.legRightTop = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, legRightTopRadius, legRightTopHeight, 30, GREEN);
        LIBS.translateY(this.legRightTop.POSITION_MATRIX, -0.3);
        LIBS.translateX(this.legRightTop.POSITION_MATRIX, 0.06);
        this.body.childs.push(this.legRightTop);
       
        const legRightBottomRadius = 0.15;
        this.legRightBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, legRightBottomRadius-0.075, legRightBottomRadius+0.1, legRightBottomRadius-0.075, 30, 30, 360, GREEN);
        LIBS.translateY(this.legRightBottom.POSITION_MATRIX, -0.55)
        this.legRightTop.childs.push(this.legRightBottom)

        // Simpan objek utama (root)
        this.allObjects = [this.body];

    }

    // Metode untuk setup semua buffer
    setup() {
        this.allObjects.forEach(obj => obj.setup());
    }

    applyWalkingAnimation(time) {
        // Kecepatan animasi, sesuaikan nilai 4.0
        const speed = 0.01;
        // Nilai rotasi leg (max +/- 20 derajat)
        const legMaxRot = 20;
        // Nilai rotasi/geser skirt (max +/- 15 derajat / 0.15)
        const skirtRot = 15;
        const skirtTransZ = -0.12;

        // --- Variabel Animasi Tangan (Hanya Tangan yang Bergerak Dinamis) ---
        const armMinRot = 30; // Rotasi minimum (paling mundur)
        const armMaxRot = 45; // Rotasi maksimum (paling maju)
        const armTopHeight = 0.5
        // Amplitudo ayunan: (Max - Min) / 2 = 7.5
        const armAmplitude = (armMaxRot - armMinRot) / 2;
        // Nilai tengah (offset) yang akan membuat ayunan berpusat di (30 + 45) / 2 = 37.5
        const armOffset = armMinRot + armAmplitude; // 37.5 derajat
        const sinValue = Math.sin(time * speed);   
        const dynamicRotation = (sinValue * armAmplitude) + armOffset;

        // ------------------------------------
        // --- IMPLEMENTASI ANIMASI TANGAN ---
        // ------------------------------------
        LIBS.set_I4(this.ArmLeftTop.MOVE_MATRIX);
        LIBS.translateX(this.ArmLeftTop.MOVE_MATRIX, -armTopHeight / 2);
        LIBS.rotateX(this.ArmLeftTop.MOVE_MATRIX, LIBS.degToRad(dynamicRotation));
        LIBS.translateX(this.ArmLeftTop.MOVE_MATRIX, armTopHeight / 2);
        LIBS.translateZ(this.ArmLeftTop.MOVE_MATRIX, -0.15)

        LIBS.set_I4(this.ArmRightTop.MOVE_MATRIX);
        LIBS.translateX(this.ArmRightTop.MOVE_MATRIX, -armTopHeight / 2);
        LIBS.rotateX(this.ArmRightTop.MOVE_MATRIX, LIBS.degToRad(-dynamicRotation));
        LIBS.translateX(this.ArmRightTop.MOVE_MATRIX, armTopHeight / 2);
        LIBS.translateZ(this.ArmRightTop.MOVE_MATRIX, -0.15)

        // --- Animasi Kaki (Legs) ---
        LIBS.set_I4(this.legLeftTop.MOVE_MATRIX);
        LIBS.rotateX(this.legLeftTop.MOVE_MATRIX, LIBS.degToRad(legMaxRot));
        LIBS.translateZ(this.legLeftTop.MOVE_MATRIX, -0.17)

        // Reset dan Terapkan Kaki Kanan
        LIBS.set_I4(this.legRightTop.MOVE_MATRIX);
        LIBS.rotateX(this.legRightTop.MOVE_MATRIX, LIBS.degToRad(legMaxRot));
        LIBS.translateZ(this.legRightTop.MOVE_MATRIX, -0.17)

        // --- Animasi Gaun (Skirts) ---
        // Gaun Depan-Kanan (skirt1) - 
        LIBS.set_I4(this.skirt1.MOVE_MATRIX);
        LIBS.rotateX(this.skirt1.MOVE_MATRIX, LIBS.degToRad(skirtRot));
        LIBS.translateZ(this.skirt1.MOVE_MATRIX, skirtTransZ);

        // Gaun Belakang-Kanan (skirt2) 
        LIBS.set_I4(this.skirt2.MOVE_MATRIX);
        LIBS.rotateX(this.skirt2.MOVE_MATRIX, LIBS.degToRad(skirtRot));
        LIBS.translateZ(this.skirt2.MOVE_MATRIX, skirtTransZ);

        // Gaun Belakang-Kiri (skirt3) - Bergerak bersama kaki kiri (berlawanan skirt2)
        LIBS.set_I4(this.skirt3.MOVE_MATRIX);
        LIBS.rotateX(this.skirt3.MOVE_MATRIX, LIBS.degToRad(skirtRot));
        LIBS.translateZ(this.skirt3.MOVE_MATRIX, skirtTransZ);

        // Gaun Depan-Kiri (skirt4) - Bergerak berlawanan dengan kaki kiri (berlawanan skirt1)
        LIBS.set_I4(this.skirt4.MOVE_MATRIX);
        LIBS.rotateX(this.skirt4.MOVE_MATRIX, LIBS.degToRad(skirtRot));
        LIBS.translateZ(this.skirt4.MOVE_MATRIX, skirtTransZ);
    }

    /**
     * Mengatur ulang semua matriks ke posisi statis (seperti di constructor).
     */
    resetWalkingAnimation() {
        // Fungsi untuk mereset POSITION_MATRIX ke nilai awal
        const resetPosition = (obj, tx, ty, tz) => {
            LIBS.set_I4(obj.POSITION_MATRIX);
            LIBS.translateY(obj.POSITION_MATRIX, ty);
            LIBS.translateX(obj.POSITION_MATRIX, tx);
            LIBS.translateZ(obj.POSITION_MATRIX, tz);
        };


        // Tangan Kiri
        LIBS.set_I4(this.ArmLeftTop.MOVE_MATRIX);
        // Tangan Kanan
        LIBS.set_I4(this.ArmRightTop.MOVE_MATRIX);

        // Kaki Kiri
        LIBS.set_I4(this.legLeftTop.MOVE_MATRIX); // Reset rotasi
        resetPosition(this.legLeftTop, -0.06, -0.3, 0.0);

        // Kaki Kanan
        LIBS.set_I4(this.legRightTop.MOVE_MATRIX); // Reset rotasi
        resetPosition(this.legRightTop, 0.06, -0.3, 0.0);

        // Skirt1 (depan-kanan)
        LIBS.set_I4(this.skirt1.MOVE_MATRIX);
        resetPosition(this.skirt1, 0.05, -0.3, 0.05);

        // Skirt2 (belakang-kanan)
        LIBS.set_I4(this.skirt2.MOVE_MATRIX);
        resetPosition(this.skirt2, -0.05, -0.3, 0.05);

        // Skirt3 (belakang-kiri)
        LIBS.set_I4(this.skirt3.MOVE_MATRIX);
        resetPosition(this.skirt3, -0.05, -0.3, -0.05);

        // Skirt4 (depan-kiri)
        LIBS.set_I4(this.skirt4.MOVE_MATRIX);
        resetPosition(this.skirt4, 0.05, -0.3, -0.05);
    }

    /**
     * Metode untuk merender semua objek. Ini yang dipanggil dari main.js.
     * @param {array} parentMatrix - Matriks global yang masuk (rotasi mouse * posisi global).
     */
    render(parentMatrix, time, isWalking) {
        // Panggil fungsi animasi
        if (isWalking) {
            this.applyWalkingAnimation(time);
        } else {
            // Reset/stabilkan posisi saat tidak berjalan (PENTING!)
            this.resetWalkingAnimation();
        }

        this.allObjects.forEach(obj => obj.render(parentMatrix));
    }
}