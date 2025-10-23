// Kirlia.js (Kode dengan Orb Arbitrary Axis Rotation)
import { Cylinder } from "../object/Cylinder.js";
import { Ellipsoid } from "../object/Ellipsoid.js";
import { Trapezoid } from "../object/Trapezoid.js";
import { BSplineExtruded } from "../object/BSplineExtruded.js";
import { Cone } from "../object/Cone.js";
import { Crescent } from "../object/Crescent.js"
import { ModifiedEllipsoid } from "../object/ModifiedEllipsoid.js"

// Definisikan state animasi pergerakan Z
const MOVEMENT_STATE = {
    IDLE: 0,
    WALK_FRONT: 1,
    WALK_BACK: 2,
    BOWING: 3 // State untuk Bowing
};

// Definisikan state untuk rotasi putar balik
const ROTATION_STATE = {
    STATIONARY: 0,
    ROTATING_TO_BACK: 1, // Rotasi 0 -> 180 (Saat mau walk back)
    ROTATING_TO_FRONT: 2 // Rotasi 180 -> 0 (Saat selesai walk back)
};

// Buat kelas untuk Pokémon Kirlia
export class Kirlia {
    constructor(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal) {
        // --- Menyimpan parameter GL (PENTING untuk mencegah error setup) ---
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._Mmatrix = _Mmatrix;
        this._normal = _normal;
        const GL_PARAMS = [this.GL, this.SHADER_PROGRAM, this._position, this._Mmatrix, this._normal];

        // Mendefinisikan warna-warna yang digunakan
        const WHITE = [1.0, 1.0, 1.0];
        const LIGHT_PASTEL_GREEN = [0.733, 0.984, 0.741];
        const LIGHT_PINK = [1.0, 0.667, 0.686];
        const BLACK = [0.0, 0.0, 0.0];
        // WARNA BARU UNTUK ORB
        const ORB_COLOR = [0.0, 0.9, 1.0]; // Cyan terang
        // WARNA BARU UNTUK ORB 2 (Dibuat sedikit berbeda)
        const ORB2_COLOR = [1.0, 0.0, 0.9]; // Magenta terang

        // --- Animation State Variables (Bowing) ---
        this.bowStartTime = 0;
        this.bowDuration = 1800; // 2 seconds in milliseconds
        this.maxBowAngle = 70 * Math.PI / 180; // 90 degrees in radians
        this.currentBowAngle = 0;

        // --- Animation State Variables (Movement) ---
        this.currentMovementState = MOVEMENT_STATE.IDLE;
        this.movementStartTime = 0;
        this.movementDuration = 2000; // 2 detik untuk maju/mundur
        this.delayDuration = 500;    // 1 detik delay (BARU)
        this.targetZ = 3.0; // Jarak translasi Z
        this.currentZ = 0.0; // Posisi Z saat ini
        
        // --- Animation State Variables (Rotation BARU) ---
        this.currentRotationState = ROTATION_STATE.STATIONARY;
        this.rotationStartTime = 0;
        this.rotationDuration = 1000; // 1 detik untuk rotasi 180 derajat
        this.currentRotationY = 0; // Rotasi Y saat ini (radian)

        // --- Breathing/Idle Movement Variables (BARU) ---
        this.breatheBodyAmplitude = 0.02; // Naik-turun badan (0.02)
        this.breatheHeadAmplitude = 0.01; // Naik-turun kepala (0.01)
        this.breatheSpeed = 0.005; // Kecepatan bernafas (sama untuk semua)
        
        // --- ORB ARBITRARY AXIS ROTATION VARIABLES (BARU) ---
        this.orbRadius = 0.02;
        this.orbOrbitRadius = 0.8; // Jarak orb dari pusat Kirlia (Body)
        this.orbRotationAngle = 0; // Sudut putaran orb mengelilingi
        this.orbSelfRotationAngle = 0; // Sudut rotasi diri sendiri pada sumbu sembarang
        
        // Sumbu Rotasi Sembarang ORB 1 (V = [1, 1.5, 0] dinormalisasi)
        const ORB_AXIS_X = 1.0;
        const ORB_AXIS_Y = 1.5;
        const ORB_AXIS_Z = 0.0;
        let length = Math.sqrt(ORB_AXIS_X * ORB_AXIS_X + ORB_AXIS_Y * ORB_AXIS_Y + ORB_AXIS_Z * ORB_AXIS_Z);
        this.orbAxis = [ORB_AXIS_X / length, ORB_AXIS_Y / length, ORB_AXIS_Z / length];

        // Sumbu Rotasi Sembarang ORB 2 (BARU: V' = [-1, 1.5, 0] dinormalisasi)
        const ORB2_AXIS_X = -1.0;
        const ORB2_AXIS_Y = 1.5;
        const ORB2_AXIS_Z = 0.0;
        length = Math.sqrt(ORB2_AXIS_X * ORB2_AXIS_X + ORB2_AXIS_Y * ORB2_AXIS_Y + ORB2_AXIS_Z * ORB2_AXIS_Z);
        this.orb2Axis = [ORB2_AXIS_X / length, ORB2_AXIS_Y / length, ORB2_AXIS_Z / length];
        
        // --- EYE BLINK ANIMATION VARIABLES (BARU UNTUK KEDIP MATA) ---
        this.blinkStartTime = 0;
        this.isBlinking = false;
        this.blinkDuration = 600; // Total 1.0 detik (0.5s tutup + 0.5s buka)
        this.currentScaleY = 1.0; // Skala Y saat ini
        this.blinkInterval = 5000; // Interval kedip (misalnya, kedip setiap 5 detik)
        this.nextBlinkTime = performance.now() + this.blinkInterval + (Math.random() * 2000); // Kedip pertama acak

        // --- Membuat semua bagian tubuh Kirlia... (Bagian ini tidak berubah) ---
        const bodyGreenRadius = 0.1;
        this.bodyGreen = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, bodyGreenRadius-0.01, bodyGreenRadius-0.03, bodyGreenRadius-0.01, 30, 30, 360, LIGHT_PASTEL_GREEN);
        
        // SIMPAN POSISI Y AWAL bodyGreen (Pivot untuk rotasi)
        this.bodyGreenInitialY = -0.14; 
        LIBS.translateY(this.bodyGreen.POSITION_MATRIX, this.bodyGreenInitialY);

        const bodyRadius = 0.026;
        const bodyHeight = 0.38;
        this.body = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, bodyRadius, bodyHeight, 30, WHITE);
        LIBS.translateY(this.body.POSITION_MATRIX, 0.14);
        this.bodyGreen.childs.push(this.body)
        
        // ... (Kode bagian tubuh lainnya tidak berubah) ...
        
        const middleBodyRadius = 0.1;
        const middleBodyHeight = 0.28;
        const radius = middleBodyRadius - 0.01;
        const height = middleBodyHeight - 0.01;
        const middleBody = new Cone(
            GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, 
            radius, 0, 360, 0, 0, height, 30, WHITE
        );
        LIBS.translateY(middleBody.POSITION_MATRIX, 0.035);
        this.body.childs.push(middleBody);
        
        //Kaki
        const legLeftTopRadius = 0.018;
        const legLeftTopHeight = 0.27;
        this.legRoot = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, bodyGreenRadius-0.01, bodyGreenRadius-0.03, bodyGreenRadius-0.01, 30, 30, 360, LIGHT_PASTEL_GREEN);
        LIBS.translateY(this.legRoot.POSITION_MATRIX, -0.14);

        this.legLeftTop = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, legLeftTopRadius, legLeftTopHeight, 30, LIGHT_PASTEL_GREEN);
        this.legLeftTopHeight = legLeftTopHeight; // Simpan tinggi untuk pivot
        LIBS.translateY(this.legLeftTop.POSITION_MATRIX, -0.16);
        LIBS.translateX(this.legLeftTop.POSITION_MATRIX, -0.06);
        this.legRoot.childs.push(this.legLeftTop);
        
        const legLeftBottomRadius = 0.1;
        const legLeftBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, legLeftBottomRadius-0.075, legLeftBottomRadius+0.01, legLeftBottomRadius-0.075, 30, 30, 360, LIGHT_PASTEL_GREEN);
        LIBS.translateY(legLeftBottom.POSITION_MATRIX, -0.18);
        this.legLeftTop.childs.push(legLeftBottom);
        
        const legRightTopRadius = 0.018;
        const legRightTopHeight = 0.27;
        this.legRightTop = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, legRightTopRadius, legRightTopHeight, 30, LIGHT_PASTEL_GREEN);
        this.legRightTopHeight = legRightTopHeight; // Simpan tinggi untuk pivot
        LIBS.translateY(this.legRightTop.POSITION_MATRIX, -0.16);
        LIBS.translateX(this.legRightTop.POSITION_MATRIX, 0.06);
        this.legRoot.childs.push(this.legRightTop);
        
        const legRightBottomRadius = 0.1;
        const legRightBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, legRightBottomRadius-0.075, legRightBottomRadius+0.01, legRightBottomRadius-0.075, 30, 30, 360, LIGHT_PASTEL_GREEN);
        LIBS.translateY(legRightBottom.POSITION_MATRIX, -0.18);
        this.legRightTop.childs.push(legRightBottom);
        
        //Tangan (Transformasi dinamis akan diterapkan di render/MOVE_MATRIX)
        const ArmLeftTopRadius = 0.016;
        const ArmLeftTopHeight = 0.26;
        this.ArmLeftTop = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, ArmLeftTopRadius, ArmLeftTopHeight, 30, WHITE);
        this.ArmLeftTopHeight = ArmLeftTopHeight; // Simpan tinggi untuk pivot
        LIBS.rotateZ(this.ArmLeftTop.POSITION_MATRIX, -Math.PI / 4.5);
        LIBS.translateX(this.ArmLeftTop.POSITION_MATRIX, -0.1);
        this.body.childs.push(this.ArmLeftTop);
        
        const ArmLeftBottomRadius = 0.1;
        const ArmLeftBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, ArmLeftBottomRadius-0.075, ArmLeftBottomRadius+0.01, ArmLeftBottomRadius-0.075, 30, 30, 360, WHITE);
        LIBS.translateY(ArmLeftBottom.POSITION_MATRIX, -0.2);
        this.ArmLeftTop.childs.push(ArmLeftBottom);
        
        const ArmRightTopRadius = 0.016;
        const ArmRightTopHeight = 0.26;
        this.ArmRightTop = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, ArmRightTopRadius, ArmRightTopHeight, 30, WHITE);
        this.ArmRightTopHeight = ArmRightTopHeight; // Simpan tinggi untuk pivot
        LIBS.rotateZ(this.ArmRightTop.POSITION_MATRIX, Math.PI / 4.5);
        LIBS.translateX(this.ArmRightTop.POSITION_MATRIX, 0.1);
        this.body.childs.push(this.ArmRightTop);
        
        const ArmRightBottomRadius = 0.1;
        const ArmRightBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, ArmRightBottomRadius-0.075, ArmRightBottomRadius+0.01, ArmRightBottomRadius-0.075, 30, 30, 360, WHITE);
        LIBS.translateY(ArmRightBottom.POSITION_MATRIX, -0.2);
        this.ArmRightTop.childs.push(ArmRightBottom);

        
        //Kepala
        const headRadiusWhite = 0.18;
        this.head = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, headRadiusWhite+0.01, headRadiusWhite, headRadiusWhite+0.03, 30, 30, 360, WHITE);
        const headPositionY = (bodyHeight / 2) + headRadiusWhite-0.05;
        LIBS.translateY(this.head.POSITION_MATRIX, headPositionY);
        this.body.childs.push(this.head);
        
        const headGreen1Radius = 0.198;
        const headGreen1 = new Ellipsoid(
            GL, SHADER_PROGRAM, _position, _Mmatrix, _normal,
            headGreen1Radius, headGreen1Radius, headGreen1Radius,
            30, 30, 150, LIGHT_PASTEL_GREEN
        );
        LIBS.translateY(headGreen1.POSITION_MATRIX, 0.01);
        LIBS.rotateZ(headGreen1.POSITION_MATRIX, Math.PI / 2);
        this.head.childs.push(headGreen1);

        //Rambut depan (Crescent)
        this.frontHair = new Crescent(
            ...GL_PARAMS,
            0.15,  // majorRadius (7)
            0.17, // minorRadius (8) - Dibuat positif untuk lekukan normal
            90, // startAngDeg (9)
            270, // endAngDeg (10)
            32,  // majorSegments (11)
            32, // minorSegments (12)
            LIGHT_PASTEL_GREEN  // color (13)
        );
        LIBS.translateZ(this.frontHair.POSITION_MATRIX, 0.06)
        LIBS.translateY(this.frontHair.POSITION_MATRIX, -0.12)
        LIBS.rotateZ(this.frontHair.POSITION_MATRIX, LIBS.degToRad(-90))
        this.head.childs.push(this.frontHair)              
        
        const headGreen3Radius = 0.2;
        const headGreen3 = new Ellipsoid(
            GL, SHADER_PROGRAM, _position, _Mmatrix, _normal,
            headGreen3Radius, headGreen3Radius, headGreen3Radius,
            30, 30, 90, LIGHT_PASTEL_GREEN
        );
        LIBS.translateY(headGreen3.POSITION_MATRIX, 0.01);
        LIBS.translateZ(headGreen3.POSITION_MATRIX, 0.02);
        LIBS.rotateZ(headGreen3.POSITION_MATRIX, Math.PI / 2.6);
        LIBS.rotateX(headGreen3.POSITION_MATRIX, Math.PI / 7);
        this.head.childs.push(headGreen3);
        
        const headGreen4Radius = 0.2;
        const headGreen4 = new Ellipsoid(
            GL, SHADER_PROGRAM, _position, _Mmatrix, _normal,
            headGreen4Radius, headGreen4Radius, headGreen4Radius,
            30, 30, 90, LIGHT_PASTEL_GREEN
        );
        LIBS.translateY(headGreen4.POSITION_MATRIX, 0.01);
        LIBS.translateZ(headGreen4.POSITION_MATRIX, 0.02);
        LIBS.rotateZ(headGreen4.POSITION_MATRIX, Math.PI / 1.57);
        LIBS.rotateX(headGreen4.POSITION_MATRIX, Math.PI / 7);
        this.head.childs.push(headGreen4);
        
        const headRadiusGreen = 0.18;
        const headGreen = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, headRadiusGreen+0.01, headRadiusGreen, headRadiusGreen+0.01, 30, 30, 360, LIGHT_PASTEL_GREEN);
        LIBS.translateY(headGreen.POSITION_MATRIX, -0.005);
        LIBS.translateZ(headGreen.POSITION_MATRIX, -0.025);
        this.head.childs.push(headGreen);

        //Left Eye
        this.leftEyeB = new ModifiedEllipsoid(
            ...GL_PARAMS, 0.18, 0.18, 0.18, 30, 30, 360, 25, 90, BLACK
        )
        LIBS.translateZ(this.leftEyeB.POSITION_MATRIX, 0.03)
        LIBS.rotateX(this.leftEyeB.POSITION_MATRIX, LIBS.degToRad(13))
        LIBS.rotateY(this.leftEyeB.POSITION_MATRIX, LIBS.degToRad(-35))
        this.head.childs.push(this.leftEyeB)

        this.leftEyeW = new ModifiedEllipsoid(
            ...GL_PARAMS, 0.18, 0.18, 0.18, 30, 30, 360, 23, 90, WHITE
        )
        LIBS.translateZ(this.leftEyeW.POSITION_MATRIX, 0.00001)
        this.leftEyeB.childs.push(this.leftEyeW)

        this.leftEyeB2 = new ModifiedEllipsoid(
            ...GL_PARAMS, 0.18, 0.18, 0.18, 30, 30, 360, 18, 90, BLACK
        )
        LIBS.translateZ(this.leftEyeB2.POSITION_MATRIX, 0.0001)
        LIBS.rotateX(this.leftEyeB2.POSITION_MATRIX, LIBS.degToRad(4))
        LIBS.rotateY(this.leftEyeB2.POSITION_MATRIX, LIBS.degToRad(4))
        this.leftEyeB.childs.push(this.leftEyeB2)

        this.leftEyeR = new ModifiedEllipsoid(
            ...GL_PARAMS, 0.18, 0.18, 0.18, 30, 30, 360, 16, 90, LIGHT_PINK
        )
        LIBS.translateZ(this.leftEyeR.POSITION_MATRIX, 0.0002)
        LIBS.rotateX(this.leftEyeR.POSITION_MATRIX, LIBS.degToRad(0.1))
        LIBS.rotateY(this.leftEyeR.POSITION_MATRIX, LIBS.degToRad(0.5))
        this.leftEyeB2.childs.push(this.leftEyeR)

        this.leftEyeB3 = new ModifiedEllipsoid(
            ...GL_PARAMS, 0.18, 0.18, 0.18, 30, 30, 360, 12, 90, BLACK
        )
        LIBS.scale(this.leftEyeB3.POSITION_MATRIX, 0.3, 0.5, 1)
        LIBS.translateZ(this.leftEyeB3.POSITION_MATRIX, 0.003)
        LIBS.rotateX(this.leftEyeB3.POSITION_MATRIX, LIBS.degToRad(2))
        LIBS.rotateY(this.leftEyeB3.POSITION_MATRIX, LIBS.degToRad(2))
        this.leftEyeR.childs.push(this.leftEyeB3)

        //Right Eye
        this.rightEyeB = new ModifiedEllipsoid(
            ...GL_PARAMS, 0.18, 0.18, 0.18, 30, 30, 360, 25, 90, BLACK
        )
        LIBS.translateZ(this.rightEyeB.POSITION_MATRIX, 0.03)
        LIBS.rotateX(this.rightEyeB.POSITION_MATRIX, LIBS.degToRad(13))
        LIBS.rotateY(this.rightEyeB.POSITION_MATRIX, LIBS.degToRad(35))
        this.head.childs.push(this.rightEyeB)

        this.rightEyeW = new ModifiedEllipsoid(
            ...GL_PARAMS, 0.18, 0.18, 0.18, 30, 30, 360, 23, 90, WHITE
        )
        LIBS.translateZ(this.rightEyeW.POSITION_MATRIX, 0.00001)
        this.rightEyeB.childs.push(this.rightEyeW)

        this.rightEyeB2 = new ModifiedEllipsoid(
            ...GL_PARAMS, 0.18, 0.18, 0.18, 30, 30, 360, 18, 90, BLACK
        )
        LIBS.translateZ(this.rightEyeB2.POSITION_MATRIX, 0.0001)
        LIBS.rotateX(this.rightEyeB2.POSITION_MATRIX, LIBS.degToRad(4))
        LIBS.rotateY(this.rightEyeB2.POSITION_MATRIX, LIBS.degToRad(-4))
        this.rightEyeB.childs.push(this.rightEyeB2)

        this.rightEyeR = new ModifiedEllipsoid(
            ...GL_PARAMS, 0.18, 0.18, 0.18, 30, 30, 360, 16, 90, LIGHT_PINK
        )
        LIBS.translateZ(this.rightEyeR.POSITION_MATRIX, 0.0002)
        LIBS.rotateX(this.rightEyeR.POSITION_MATRIX, LIBS.degToRad(0.1))
        LIBS.rotateY(this.rightEyeR.POSITION_MATRIX, LIBS.degToRad(-0.5))
        this.rightEyeB2.childs.push(this.rightEyeR)

        this.rightEyeB3 = new ModifiedEllipsoid(
            ...GL_PARAMS, 0.18, 0.18, 0.18, 30, 30, 360, 12, 90, BLACK
        )
        LIBS.scale(this.rightEyeB3.POSITION_MATRIX, 0.3, 0.5, 1)
        LIBS.translateZ(this.rightEyeB3.POSITION_MATRIX, 0.003)
        LIBS.rotateX(this.rightEyeB3.POSITION_MATRIX, LIBS.degToRad(2))
        LIBS.rotateY(this.rightEyeB3.POSITION_MATRIX, LIBS.degToRad(-2))
        this.rightEyeR.childs.push(this.rightEyeB3)

        //Rambut
        const hairBaseA = 0.15;
        const hairBaseB = 0.25;
        const hairHeight = 0.43;
        const hairDepth = 0.02;
        const hairRight = new Trapezoid(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, hairBaseA, hairBaseB, hairHeight, hairDepth, LIGHT_PASTEL_GREEN);
        LIBS.rotateX(hairRight.POSITION_MATRIX, -Math.PI / 15);
        LIBS.rotateY(hairRight.POSITION_MATRIX, Math.PI / 2);
        LIBS.translateY(hairRight.POSITION_MATRIX, -0.12);
        LIBS.translateX(hairRight.POSITION_MATRIX, 0.215);
        this.head.childs.push(hairRight);
        
        const hairLeft = new Trapezoid(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, hairBaseA, hairBaseB, hairHeight, hairDepth, LIGHT_PASTEL_GREEN);
        LIBS.rotateX(hairLeft.POSITION_MATRIX, Math.PI / 15);
        LIBS.rotateY(hairLeft.POSITION_MATRIX, Math.PI / 2);
        LIBS.translateY(hairLeft.POSITION_MATRIX, -0.12);
        LIBS.translateX(hairLeft.POSITION_MATRIX, -0.215);
        this.head.childs.push(hairLeft);
        
        //Skirt (Semua objek skirt harus diakses melalui 'this.')
        const trapBaseA = 0.1;
        const trapBaseB = 0.2;
        const trapHeight = 0.38;
        const trapDepth = 0.01;
        this.skirtRightMiddle = new Trapezoid(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, trapBaseA, trapBaseB, trapHeight, trapDepth, WHITE);
        LIBS.rotateX(this.skirtRightMiddle.POSITION_MATRIX, -Math.PI / 4);
        LIBS.rotateY(this.skirtRightMiddle.POSITION_MATRIX, Math.PI / 2);
        LIBS.translateY(this.skirtRightMiddle.POSITION_MATRIX, -0.2);
        LIBS.translateX(this.skirtRightMiddle.POSITION_MATRIX, 0.18);
        this.body.childs.push(this.skirtRightMiddle);
        
        const trapBaseA1 = 0.1;
        const trapBaseB1 = 0.18;
        const trapHeight1 = 0.38;
        const trapDepth1 = 0.01;
        this.skirtRightLeft = new Trapezoid(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, trapBaseA1, trapBaseB1, trapHeight1, trapDepth1, WHITE);
        LIBS.rotateX(this.skirtRightLeft.POSITION_MATRIX, -Math.PI / 4);
        LIBS.rotateY(this.skirtRightLeft.POSITION_MATRIX, Math.PI / 4);
        LIBS.translateY(this.skirtRightLeft.POSITION_MATRIX, -0.18);
        LIBS.translateX(this.skirtRightLeft.POSITION_MATRIX, 0.1);
        LIBS.translateZ(this.skirtRightLeft.POSITION_MATRIX, 0.115);
        this.body.childs.push(this.skirtRightLeft);
        
        this.skirtRightRight = new Trapezoid(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, trapBaseA1, trapBaseB1, trapHeight1, trapDepth1, WHITE);
        LIBS.rotateX(this.skirtRightRight.POSITION_MATRIX, Math.PI / 4);
        LIBS.rotateY(this.skirtRightRight.POSITION_MATRIX, -Math.PI / 4);
        LIBS.translateY(this.skirtRightRight.POSITION_MATRIX, -0.18);
        LIBS.translateX(this.skirtRightRight.POSITION_MATRIX, 0.1);
        LIBS.translateZ(this.skirtRightRight.POSITION_MATRIX, -0.115);
        this.body.childs.push(this.skirtRightRight);
        
        this.skirtLeftMiddle = new Trapezoid(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, trapBaseA, trapBaseB, trapHeight, trapDepth, WHITE);
        LIBS.rotateX(this.skirtLeftMiddle.POSITION_MATRIX, Math.PI / 4);
        LIBS.rotateY(this.skirtLeftMiddle.POSITION_MATRIX, Math.PI / 2);
        LIBS.translateY(this.skirtLeftMiddle.POSITION_MATRIX, -0.2);
        LIBS.translateX(this.skirtLeftMiddle.POSITION_MATRIX, -0.18);
        this.body.childs.push(this.skirtLeftMiddle);
        
        this.skirtLeftRight = new Trapezoid(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, trapBaseA1, trapBaseB1, trapHeight1, trapDepth1, WHITE);
        LIBS.rotateX(this.skirtLeftRight.POSITION_MATRIX, -Math.PI / 4);
        LIBS.rotateY(this.skirtLeftRight.POSITION_MATRIX, -Math.PI / 4);
        LIBS.translateY(this.skirtLeftRight.POSITION_MATRIX, -0.18);
        LIBS.translateX(this.skirtLeftRight.POSITION_MATRIX, -0.1);
        LIBS.translateZ(this.skirtLeftRight.POSITION_MATRIX, 0.115);
        this.body.childs.push(this.skirtLeftRight);
        
        this.skirtLeftLeft = new Trapezoid(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, trapBaseA1, trapBaseB1, trapHeight1, trapDepth1, WHITE);
        LIBS.rotateX(this.skirtLeftLeft.POSITION_MATRIX, Math.PI / 4);
        LIBS.rotateY(this.skirtLeftLeft.POSITION_MATRIX, Math.PI / 4);
        LIBS.translateY(this.skirtLeftLeft.POSITION_MATRIX, -0.18);
        LIBS.translateX(this.skirtLeftLeft.POSITION_MATRIX, -0.1);
        LIBS.translateZ(this.skirtLeftLeft.POSITION_MATRIX, -0.115);
        this.body.childs.push(this.skirtLeftLeft);
        
        //Tanduk (BSpline Extruded)
        const custom_controlPoints = [ 
            [-0.1, 0.0], [-0.05, 0.3], [0.2, 0.1], [0.0, -0.2]
        ];
        const headHornLeft = new BSplineExtruded(
            GL, SHADER_PROGRAM, _position, _Mmatrix, _normal,
            custom_controlPoints, 0.01, 30, LIGHT_PINK
        );
        LIBS.translateY(headHornLeft.POSITION_MATRIX, 0.4);
        LIBS.translateX(headHornLeft.POSITION_MATRIX, -0.15);
        LIBS.rotateY(headHornLeft.POSITION_MATRIX, -Math.PI / 2.6);
        LIBS.rotateZ(headHornLeft.POSITION_MATRIX, Math.PI / 4);
        LIBS.rotateY(headHornLeft.POSITION_MATRIX, -Math.PI / 6);
        this.body.childs.push(headHornLeft);
        
        const headHornRight = new BSplineExtruded(
            GL, SHADER_PROGRAM, _position, _Mmatrix, _normal,
            custom_controlPoints, 0.01, 30, LIGHT_PINK
        );
        LIBS.translateY(headHornRight.POSITION_MATRIX, 0.4);
        LIBS.translateX(headHornRight.POSITION_MATRIX, 0.15);
        LIBS.rotateY(headHornRight.POSITION_MATRIX, -Math.PI / 1.6);
        LIBS.rotateZ(headHornRight.POSITION_MATRIX, -Math.PI / 4);
        LIBS.rotateY(headHornRight.POSITION_MATRIX, Math.PI / 6);
        this.body.childs.push(headHornRight);
        
        // --- MEMBUAT ORB 1 (Cyan) ---
        this.orb = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, 
            this.orbRadius, this.orbRadius, this.orbRadius, 
            20, 20, 360, ORB_COLOR);
        LIBS.translateX(this.orb.POSITION_MATRIX, -0.3); // Posisi awal arb (di luar)
        LIBS.translateY(this.orb.POSITION_MATRIX, -0.2); // Posisi awal arb (di bawah)
        this.bodyGreen.childs.push(this.orb); 

        // --- MEMBUAT ORB 2 (Magenta, BARU) ---
        this.orb2 = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, 
            this.orbRadius, this.orbRadius, this.orbRadius, 
            20, 20, 360, ORB2_COLOR);
        LIBS.translateX(this.orb2.POSITION_MATRIX, 0.3); // Posisi awal di sisi X positif
        LIBS.translateY(this.orb2.POSITION_MATRIX, -0.2);  // Posisi awal di sisi Y positif
        this.bodyGreen.childs.push(this.orb2); 
        
        // Simpan objek utama (root) ke dalam array
        this.allObjects = [this.bodyGreen, this.legRoot];
    }
    
    // Metode untuk setup semua buffer
    setup() {
        this.allObjects.forEach(obj => obj.setup());
        // Orb sudah menjadi child, jadi setup otomatis terpanggil.
    }
    
    // =======================================================
    // --- FUNGSI ANIMASI KEDIP MATA (BARU) ---
    // =======================================================
    
    /**
     * Menghitung dan menerapkan skala Y untuk animasi kedip mata (blinking).
     * @param {number} time - Waktu saat ini (dalam milidetik).
     */
    applyBlinkAnimation(time) {
        if (!this.isBlinking && time >= this.nextBlinkTime) {
            // Memulai kedipan
            this.isBlinking = true;
            this.blinkStartTime = time;
        }

        if (this.isBlinking) {
            const elapsedTime = time - this.blinkStartTime;
            let progress = Math.min(elapsedTime / this.blinkDuration, 1.0);
            
            // Variabel untuk menyimpan skala Y yang dihitung
            let calculatedScaleY = 1.0;

            // Fase 1: Menutup (0.0s hingga 0.5s)
            if (progress < 0.5) {
                // Progress menutup: 0.0 -> 1.0 dalam 0.5 detik
                let closeProgress = progress * 2.0; 
                // Skala Y mengecil dari 1.0 hingga mendekati 0.0 (misalnya 0.01)
                calculatedScaleY = 1.0 - (0.999 * closeProgress); // Skala min 0.001
                calculatedScaleY = Math.max(0.001, calculatedScaleY);

            // Fase 2: Membuka (0.5s hingga 1.0s)
            } else if (progress < 1.0) {
                // Progress membuka: 0.0 -> 1.0 dalam 0.5 detik
                let openProgress = (progress - 0.5) * 2.0; 
                // Skala Y membesar dari 0.001 hingga 1.0
                calculatedScaleY = 0.001 + (1.0 - 0.001) * openProgress;
                
            } else {
                // Kedipan Selesai
                this.isBlinking = false;
                calculatedScaleY = 1.0; // Kembali normal
                
                // Atur waktu kedip berikutnya dengan jeda acak (5000ms + 0-2000ms)
                this.nextBlinkTime = time + this.blinkInterval + (Math.random() * 2000);
            }
            
            this.currentScaleY = calculatedScaleY;
        } else {
            // Mata normal
            this.currentScaleY = 1.0;
        }

        // Terapkan Scaling ke Mata
        // Ini adalah lapisan putih kedua pada mata.

        // Mata Kiri (leftEyeB2)
        LIBS.set_I4(this.leftEyeB2.MOVE_MATRIX); // Reset MOVE_MATRIX
        LIBS.scale(this.leftEyeB2.MOVE_MATRIX, 1.0, this.currentScaleY, 1.0);

        // Mata Kanan (rightEyeB2)
        LIBS.set_I4(this.rightEyeB2.MOVE_MATRIX); // Reset MOVE_MATRIX
        LIBS.scale(this.rightEyeB2.MOVE_MATRIX, 1.0, this.currentScaleY, 1.0);
    }
    
    // =======================================================
    // --- FUNGSI ANIMASI JALAN & IDLE ---
    // (Tidak ada perubahan signifikan di sini)
    // =======================================================

    applyWalkingAnimation(time) {
        const speed = 0.007; // Kecepatan ayunan
        const sinValue = Math.sin(time * speed);  
        
        // --- ANIMASI LENGAN (Diperbaiki: Ayunan -10 ke +10) ---
        const armMaxRot = 20; 
        const armAmplitude = armMaxRot; // 20 derajat ayunan total, nilai sin * 20
        const dynamicArmRotation = sinValue * armAmplitude; 

        // Lengan Kiri (Ayunan X)
        let l_arm_id = LIBS.get_I4();
        LIBS.set_I4(this.ArmLeftTop.MOVE_MATRIX);
        LIBS.translateY(l_arm_id, -this.ArmLeftTopHeight / 2); // Pivot
        let l_arm_id2 = LIBS.get_I4();
        LIBS.rotateX(l_arm_id2, LIBS.degToRad(dynamicArmRotation)); // Rotasi X
        l_arm_id = LIBS.multiply(l_arm_id, l_arm_id2);
        LIBS.translateY(l_arm_id, this.ArmLeftTopHeight / 2); // Pivot balik
        this.ArmLeftTop.MOVE_MATRIX = LIBS.multiply(this.ArmLeftTop.MOVE_MATRIX, l_arm_id);

        // Lengan Kanan (Berlawanan arah)
        let r_arm_id = LIBS.get_I4();
        LIBS.set_I4(this.ArmRightTop.MOVE_MATRIX);
        LIBS.translateY(r_arm_id, -this.ArmRightTopHeight / 2); // Pivot
        let r_arm_id2 = LIBS.get_I4();
        LIBS.rotateX(r_arm_id2, LIBS.degToRad(-dynamicArmRotation)); // Rotasi X (negatif)
        r_arm_id = LIBS.multiply(r_arm_id, r_arm_id2);
        LIBS.translateY(r_arm_id, this.ArmRightTopHeight / 2); // Pivot balik
        this.ArmRightTop.MOVE_MATRIX = LIBS.multiply(this.ArmRightTop.MOVE_MATRIX, r_arm_id);
        
        
        // --- ANIMASI KAKI (Diperbaiki: Ayunan -15 ke +15, berlawanan fase dengan tangan) ---
        const legMaxRot = 15; 
        const legAmplitude = legMaxRot; // 15 derajat ayunan total, nilai sin * 15
        
        // Ayunan Kaki: [-15, +15]
        const dynamicLegRotation = sinValue * legAmplitude;

        // Kaki Kiri (Ayunan X)
        let l_leg_id = LIBS.get_I4();
        LIBS.set_I4(this.legLeftTop.MOVE_MATRIX);
        LIBS.translateY(l_leg_id, -this.legLeftTopHeight / 2); // Pivot
        let l_leg_id2 = LIBS.get_I4();
        // Kaki Kiri harus BERLAWANAN fase DENGAN LENGAN KIRI:
        // Lengan Kiri: +sinValue (Maju) -> Kaki Kiri: -sinValue (Mundur)
        LIBS.rotateX(l_leg_id2, LIBS.degToRad(-dynamicLegRotation)); // Rotasi X (Lawan)
        l_leg_id = LIBS.multiply(l_leg_id, l_leg_id2);
        LIBS.translateY(l_leg_id, this.legLeftTopHeight / 2); // Pivot balik
        this.legLeftTop.MOVE_MATRIX = LIBS.multiply(this.legLeftTop.MOVE_MATRIX, l_leg_id);

        // Kaki Kanan (Ayunan X)
        let r_leg_id = LIBS.get_I4();
        LIBS.set_I4(this.legRightTop.MOVE_MATRIX);
        LIBS.translateY(r_leg_id, -this.legRightTopHeight / 2); // Pivot
        let r_leg_id2 = LIBS.get_I4();
        // Kaki Kanan harus BERLAWANAN fase DENGAN LENGAN KANAN:
        // Lengan Kanan: -sinValue (Mundur) -> Kaki Kanan: +sinValue (Maju)
        LIBS.rotateX(r_leg_id2, LIBS.degToRad(dynamicLegRotation)); // Rotasi X 
        r_leg_id = LIBS.multiply(r_leg_id, r_leg_id2);
        LIBS.translateY(r_leg_id, this.legRightTopHeight / 2); // Pivot balik
        this.legRightTop.MOVE_MATRIX = LIBS.multiply(this.legRightTop.MOVE_MATRIX, r_leg_id);
    }

    resetAnimation() {
        // Reset semua MOVE_MATRIX ke Matriks Identitas (posisi diam)
        LIBS.set_I4(this.ArmLeftTop.MOVE_MATRIX);
        LIBS.set_I4(this.ArmRightTop.MOVE_MATRIX);
        LIBS.set_I4(this.legLeftTop.MOVE_MATRIX); // Reset Kaki
        LIBS.set_I4(this.legRightTop.MOVE_MATRIX); // Reset Kaki
        
        // Matriks Rok tidak perlu di-reset di sini karena mereka akan selalu diatur oleh logika Idle di render()
        LIBS.set_I4(this.skirtRightMiddle.MOVE_MATRIX);
        LIBS.set_I4(this.skirtRightLeft.MOVE_MATRIX);
        LIBS.set_I4(this.skirtRightRight.MOVE_MATRIX);
        LIBS.set_I4(this.skirtLeftMiddle.MOVE_MATRIX);
        LIBS.set_I4(this.skirtLeftRight.MOVE_MATRIX);
        LIBS.set_I4(this.skirtLeftLeft.MOVE_MATRIX);
        
        // Catatan: this.leftEyeR.MOVE_MATRIX dan this.rightEyeR.MOVE_MATRIX 
        // akan di-reset dan di-set di applyBlinkAnimation()
    }
    
    // =======================================================
    // --- FUNGSI ANIMASI PENGENDALI ---
    // (Tidak ada perubahan di sini)
    // =======================================================
    
    /**
     * FUNGSI BARU: Memulai urutan animasi walkFront -> bowing -> walkBack.
     */
    runAnimation() {
        if (this.currentMovementState === MOVEMENT_STATE.IDLE && this.currentRotationState === ROTATION_STATE.STATIONARY) {
            this.currentMovementState = MOVEMENT_STATE.WALK_FRONT;
            this.movementStartTime = performance.now();
        }
    }

    bowing() {
        // Hanya bisa dipanggil jika IDLE
        if (this.currentMovementState === MOVEMENT_STATE.IDLE) {
            this.currentMovementState = MOVEMENT_STATE.BOWING;
            this.movementStartTime = performance.now();
        }
    }

    walkFront() {
        // Hanya bisa dipanggil jika IDLE
        if (this.currentMovementState === MOVEMENT_STATE.IDLE) {
            this.currentMovementState = MOVEMENT_STATE.WALK_FRONT;
            this.movementStartTime = performance.now();
        }
    }

    walkBack() {
        // Hanya bisa dipanggil jika IDLE DAN sudah di posisi depan
        if (this.currentMovementState === MOVEMENT_STATE.IDLE && this.currentZ === this.targetZ) {
            // Ubah ke state rotasi dulu, bukan langsung WALK_BACK
            this.currentRotationState = ROTATION_STATE.ROTATING_TO_BACK;
            this.rotationStartTime = performance.now();
            // Tidak perlu update movementState sampai rotasi selesai
        }
    }

    /**
     * Metode untuk merender semua objek
     * @param {array} parentMatrix - Matriks global dari root
     * @param {number} time - Waktu saat ini (dalam milidetik)
     */
    render(parentMatrix, time) {
        
        // --- 0. Panggil Animasi Kedip Mata ---
        this.applyBlinkAnimation(time);
        
        let currentBowAngle = 0;
        let targetZ = this.currentZ;
        
        // Flag untuk mengontrol animasi lengan/kaki
        let shouldAnimateLimbs = false;

        // --- 1. Update Logika Rotasi (Y-Axis) ---
        if (this.currentRotationState !== ROTATION_STATE.STATIONARY) {
            const rotElapsedTime = time - this.rotationStartTime;
            let progress = Math.min(rotElapsedTime / this.rotationDuration, 1.0);
            
            const PI = Math.PI;

            if (this.currentRotationState === ROTATION_STATE.ROTATING_TO_BACK) {
                // Rotasi 0 -> PI (0 -> 180 deg)
                this.currentRotationY = PI * progress;
                
                if (progress >= 1.0) {
                    this.currentRotationY = PI; // Selesaikan di 180 deg
                    // Lanjutkan ke WALK_BACK setelah rotasi selesai
                    this.currentMovementState = MOVEMENT_STATE.WALK_BACK;
                    this.movementStartTime = time; // Gunakan waktu saat ini
                    this.currentRotationState = ROTATION_STATE.STATIONARY; // Rotasi selesai
                }
            } else if (this.currentRotationState === ROTATION_STATE.ROTATING_TO_FRONT) {
                // Rotasi PI -> 0 (180 -> 0 deg)
                // Mulai dari PI, bergerak ke 0
                this.currentRotationY = PI * (1.0 - progress);

                if (progress >= 1.0) {
                    this.currentRotationY = 0; // Selesaikan di 0 deg
                    // Lanjutkan ke IDLE setelah rotasi selesai
                    this.currentMovementState = MOVEMENT_STATE.IDLE;
                    this.currentRotationState = ROTATION_STATE.STATIONARY; // Rotasi selesai
                }
            }
        }
        
        // --- 2. Update Logika Pergerakan/Bowing berdasarkan State Machine ---
        if (this.currentMovementState !== MOVEMENT_STATE.IDLE) {
            const elapsedTime = time - this.movementStartTime;
            const walkDuration = this.movementDuration; // Waktu animasi berjalan sebenarnya
            
            const totalWalkTimeNeeded = walkDuration + this.delayDuration; 
            const totalBowTimeNeeded = this.bowDuration + this.delayDuration; 
            
            if (this.currentMovementState === MOVEMENT_STATE.BOWING) {
                const bowElapsedTime = Math.min(elapsedTime, this.bowDuration);
                let bowProgress = bowElapsedTime / this.bowDuration;

                if (bowProgress < 0.5) {
                    let t = bowProgress * 2; 
                    currentBowAngle = this.maxBowAngle * t;
                } else if (bowProgress < 1.0) {
                    let t = (bowProgress - 0.5) * 2; 
                    currentBowAngle = this.maxBowAngle * (1 - t);
                } else {
                    currentBowAngle = 0;
                    if (elapsedTime >= totalBowTimeNeeded) {
                        // SEQUENCER: Setelah BOWING selesai, lakukan rotasi ke belakang (ROTATING_TO_BACK)
                        this.currentMovementState = MOVEMENT_STATE.IDLE; // Harus IDLE agar bisa dipanggil walkBack
                        
                        // Periksa posisi Z, jika sudah di depan, mulai rotasi putar balik
                        if (this.currentZ === this.targetZ) {
                            this.currentRotationState = ROTATION_STATE.ROTATING_TO_BACK;
                            this.rotationStartTime = time; 
                        }
                    }
                }
            } else { // WALK_FRONT atau WALK_BACK
                const walkElapsedTime = Math.min(elapsedTime, walkDuration);
                let progress = walkElapsedTime / walkDuration;

                if (walkElapsedTime < walkDuration) {
                    // Animasi perpindahan Z masih berlangsung
                    shouldAnimateLimbs = true; // Aktifkan animasi tangan/kaki
                    
                    if (this.currentMovementState === MOVEMENT_STATE.WALK_FRONT) {
                        targetZ = this.targetZ * progress;
                    } else if (this.currentMovementState === MOVEMENT_STATE.WALK_BACK) {
                        const startZ = this.targetZ; 
                        targetZ = startZ * (1 - progress); 
                    }
                } else {
                    // Animasi perpindahan Z selesai. Limbs animation HARUS MATI.
                    targetZ = (this.currentMovementState === MOVEMENT_STATE.WALK_FRONT) ? this.targetZ : 0.0;
                    
                    if (elapsedTime >= totalWalkTimeNeeded) {
                        if (this.currentMovementState === MOVEMENT_STATE.WALK_FRONT) {
                            // Selesai WALK_FRONT, Lanjut ke BOWING
                            this.currentMovementState = MOVEMENT_STATE.BOWING;
                            this.movementStartTime = time; 
                        } else if (this.currentMovementState === MOVEMENT_STATE.WALK_BACK) {
                            // Selesai WALK_BACK (sudah kembali), Lanjut ke ROTATING_TO_FRONT
                            this.currentMovementState = MOVEMENT_STATE.IDLE; // Diperlakukan IDLE untuk transisi rotasi
                            this.currentRotationState = ROTATION_STATE.ROTATING_TO_FRONT;
                            this.rotationStartTime = time;
                        }
                    }
                }
            }
        }
        
        this.currentZ = targetZ; // Update posisi Z
        
        // --- 3. Idle/Breathing Movement Logic ---
        let idleYOffset = 0.0;
        let idleBodyMatrix = LIBS.get_I4();
        let idleHeadMatrix = LIBS.get_I4();
        let skirtRotAngle = 0; // Rotasi rok
        
        const isBodyStationary = this.currentRotationState !== ROTATION_STATE.STATIONARY || shouldAnimateLimbs;


        // Hitung nilai sin untuk Idle/Breathing
        const sinVal = Math.sin(time * this.breatheSpeed);

        if (!isBodyStationary) { 
            // Gerakan Badan (Root/bodyGreen): 0.02
            idleYOffset = sinVal * this.breatheBodyAmplitude;
            LIBS.translateY(idleBodyMatrix, idleYOffset);
            
            // Gerakan Kepala (Head/this.head): 0.01 (Berlawanan arah)
            const headYOffset = -sinVal * this.breatheHeadAmplitude;
            LIBS.translateY(idleHeadMatrix, headYOffset);
        } else {
             // Pastikan posisi Y idle tetap 0 saat walk/rotasi
             LIBS.translateY(idleBodyMatrix, 0); 
             LIBS.translateY(idleHeadMatrix, 0); 
        }

        // Rotasi Rok
        if (!shouldAnimateLimbs && this.currentRotationState === ROTATION_STATE.STATIONARY) { 
             skirtRotAngle = LIBS.degToRad(-2 * sinVal); // -2 derajat max saat badan naik.
        } else if (shouldAnimateLimbs) {
             // Selama berjalan, goyangan rok lebih cepat.
             skirtRotAngle = LIBS.degToRad(3 * Math.sin(time * 0.02)); 
        }


        // --- 4. Animasi Tangan dan Kaki ---
        if (shouldAnimateLimbs) {
            this.applyWalkingAnimation(time);
        } else {
            this.resetAnimation(); // Matikan animasi tangan/kaki
        }
        
        // Terapkan Rotasi/Goyangan Rok
        const skirtObjects = [
            this.skirtRightMiddle, this.skirtRightLeft, this.skirtRightRight, 
            this.skirtLeftMiddle, this.skirtLeftRight, this.skirtLeftLeft
        ];
        
        skirtObjects.forEach(skirt => {
            LIBS.set_I4(skirt.MOVE_MATRIX);
            LIBS.rotateX(skirt.MOVE_MATRIX, skirtRotAngle);
        });


        // --- 5. Gabungkan Global Transform (Hanya Z-Move) ---
        let globalTransformMatrix = LIBS.get_I4();
        
        // Terapkan Pergerakan Z (Global/Posisi Awal Objek)
        LIBS.translateZ(globalTransformMatrix, this.currentZ);
        
        const combinedMatrix = LIBS.multiply(parentMatrix, globalTransformMatrix);


        // --- 6. Terapkan Transformasi Sub-Root dan Orb ---
        
        // A. Terapkan Rotasi Diri Sendiri (Y-Rot) dan Rotasi Bowing pada Body Green
        this.bodyGreen.POSITION_MATRIX = LIBS.get_I4();
        // Terapkan Rotasi Y (BERPUTAR DI SUMBU Y bodyGreen)
        LIBS.rotateY(this.bodyGreen.POSITION_MATRIX, this.currentRotationY);
        LIBS.rotateX(this.bodyGreen.POSITION_MATRIX, currentBowAngle);
        LIBS.translateY(this.bodyGreen.POSITION_MATRIX, this.bodyGreenInitialY + idleYOffset); // Idle Y di sini

        // B. Terapkan Rotasi Diri Sendiri (Y-Rot) pada Leg Root
        this.legRoot.POSITION_MATRIX = LIBS.get_I4();
        // Terapkan Rotasi Y (BERPUTAR DI SUMBU Y legRoot)
        LIBS.rotateY(this.legRoot.POSITION_MATRIX, this.currentRotationY);
        LIBS.translateY(this.legRoot.POSITION_MATRIX, -0.14 + idleYOffset); // Idle Y di sini
        
        // C. Terapkan Idle Movement pada Kepala (child dari Body)
        LIBS.set_I4(this.head.MOVE_MATRIX); 
        this.head.MOVE_MATRIX = LIBS.multiply(this.head.MOVE_MATRIX, idleHeadMatrix);
        
        // D. Terapkan Transformasi Orb 1 (Orbit & Rotasi Sumbu Sembarang)
        this.orbRotationAngle = time * 0.003; // Kecepatan rotasi orbit
        this.orbSelfRotationAngle = time * 0.007; // Kecepatan rotasi diri sendiri (arbitrary)
        
        // --- ORB 1 (Cyan) ---
        LIBS.set_I4(this.orb.MOVE_MATRIX);

        // 1. Terapkan translasi awal ke radius orbit (X)
        LIBS.translateX(this.orb.MOVE_MATRIX, this.orbOrbitRadius); 
        
        // 2. Rotasi Orbit (mengelilingi sumbu Y Kirlia)
        LIBS.rotateY(this.orb.MOVE_MATRIX, this.orbRotationAngle); 
        
        // 3. Rotasi Sumbu Sembarang (Diri Sendiri)
        let arbitraryRotMatrix = LIBS.get_I4();
        LIBS.rotateArbitraryAxis(arbitraryRotMatrix, this.orbSelfRotationAngle, 
            this.orbAxis[0], this.orbAxis[1], this.orbAxis[2]);
            
        // Gabungkan Rotasi Arbitrary Axis ke MOVE_MATRIX Orb
        this.orb.MOVE_MATRIX = LIBS.multiply(this.orb.MOVE_MATRIX, arbitraryRotMatrix); 
        
        // --- ORB 2 (Magenta, BARU) ---
        LIBS.set_I4(this.orb2.MOVE_MATRIX);
        
        // 1. Terapkan translasi awal ke radius orbit (X negatif agar berlawanan)
        LIBS.translateX(this.orb2.MOVE_MATRIX, -this.orbOrbitRadius); 
        
        // 2. Rotasi Orbit (mengelilingi sumbu Y Kirlia). Dibuat berlawanan arah dengan Orb 1.
        LIBS.rotateY(this.orb2.MOVE_MATRIX, -this.orbRotationAngle); 
        
        // 3. Rotasi Sumbu Sembarang Orb 2
        let arbitraryRotMatrix2 = LIBS.get_I4();
        LIBS.rotateArbitraryAxis(arbitraryRotMatrix2, -this.orbSelfRotationAngle,  // Rotasi diri sendiri berlawanan
            this.orb2Axis[0], this.orb2Axis[1], this.orb2Axis[2]);
            
        // Gabungkan Rotasi Arbitrary Axis ke MOVE_MATRIX Orb 2
        this.orb2.MOVE_MATRIX = LIBS.multiply(this.orb2.MOVE_MATRIX, arbitraryRotMatrix2);

        // Render DUA root (bodyGreen dan legRoot) menggunakan combinedMatrix (hanya berisi Z-move)
        this.allObjects.forEach(obj => obj.render(combinedMatrix));
    }
}