// Gardevoir.js
import { BezierSOR } from "../object/BezierSOR.js"
import { Ellipsoid } from "../object/Ellipsoid.js"
import { Cone } from "../object/Cone.js"
import { Cylinder } from "../object/Cylinder.js"
import { Crescent } from "../object/Crescent.js"
import { BSplineExtruded } from "../object/BSplineExtruded.js"
import { ModifiedEllipsoid } from "../object/ModifiedEllipsoid.js"

const BODY_PROFILE = [
    [0.0, 0.0], [0.27, 0.6], [0.02, 0.5], [0.0, 0.5]
];

const PROFILES = {
    BODY: BODY_PROFILE,
};

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
        const WHITE = [1.0, 1.0, 1.0];
        const GREEN = [0.7, 0.94, 0.7];
        const RED = [1.0, 0.667, 0.686];
        const BLACK = [0, 0, 0];
        
        // --- State Gerakan Global ---
        this.transitionFactor = 0.0;
        this.lastTime = 0;
        this.globalTimeAcc = 0;
        this.isIdle = true; 
        this.idleStartTime = 0; 
        this.idleDuration = 5.0; 
        this.moveRadius = 5.0; 
        this.moveSpeed = LIBS.degToRad(30);

        // --- State Waypoint ---
        this.idlePoints = [
            LIBS.degToRad(90),
            LIBS.degToRad(270)
        ];
        this.currentWaypointIndex = 0; 
        this.currentGlobalAngle = this.idlePoints[this.currentWaypointIndex]; 
        let nextIndex = (this.currentWaypointIndex + 1) % this.idlePoints.length;
        this.targetGlobalAngle = this.idlePoints[nextIndex];
        
        // --- State Orbit Miring ---
        this.moveAxis = [0, 1, 0];
        this.moveCenter = [0, -1.0, 0]; 
        this.tempMatrix = LIBS.get_I4();
        this.setGlobalRotation(this.moveAxis, this.moveCenter);
        
        // --- [MODIFIKASI] State Animasi Idle ---
        this.idleAnimActive = false;
        this.idleAnimScale = 0.0;
        
        // [BARU] Definisikan posisi spawn orb
        this.idleAnimStartPos = [0.0, 0.4, 0.2]; // Posisi spawn (relatif ke body)
        this.idleAnimPos = [0, 2.7, 0]; // Selalu mulai dari sini

        this.idleAnimDuration = 0.3; // Durasi scaling (0.3 detik)
        this.idleAnimMoveSpeed = 7; 
        this.idleAnimGradient = VEC.normalize([0.3, -0.5, 1.0]);

        // [BARU] Variabel untuk 3 Fase Animasi
        // 0 = Tidak aktif
        // 1 = Tangan Berputar
        // 2 = Orb Scaling
        // 3 = Orb Bergerak
        this.idleAnimPhase = 0;
        this.idleArmRotFactor = 0.0; // Progres rotasi tangan (0.0 - 1.0)
        this.idleArmRotDuration = 0.5; // Durasi rotasi tangan (0.3 detik)
        
        // [BARU] Simpan tinggi lengan
        this.armTopHeight = 0.5; // (Diambil dari const ArmLeftTopHeight)
        
        // --- Store parameters as instance properties without redeclaring ---
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._Mmatrix = _Mmatrix;
        this._normal = _normal;
        // --- Store common parameters in an array for cleaner calls ---
        // GL_PARAMS: [GL, SHADER_PROGRAM, _position, _normal, _Mmatrix]
        const GL_PARAMS = [this.GL, this.SHADER_PROGRAM, this._position, this._Mmatrix, this._normal];

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
        this.pinkBlade = new BSplineExtruded(...GL_PARAMS, bladeControlPoints, 0.05, 30, RED);
        LIBS.scale(this.pinkBlade.POSITION_MATRIX, 0.3, 0.3, 0.35)
        LIBS.rotateY(this.pinkBlade.MOVE_MATRIX, LIBS.degToRad(-90))
        LIBS.rotateX(this.pinkBlade.MOVE_MATRIX, LIBS.degToRad(-90))
        LIBS.translateY(this.pinkBlade.POSITION_MATRIX, 0.15)
        LIBS.translateZ(this.pinkBlade.POSITION_MATRIX, 0.16)
        this.body.childs.push(this.pinkBlade);

        //Leher
        this.neck = new Cylinder(...GL_PARAMS, 0.035, 0.2, 30, WHITE);
        LIBS.translateY(this.neck.POSITION_MATRIX, 0.5);
        this.body.childs.push(this.neck);

        // Kepala
        // Kepala Putih
        const headRadiusWhite = 0.18;
        this.head = new Ellipsoid(...GL_PARAMS, headRadiusWhite+0.01, headRadiusWhite, headRadiusWhite+0.03, 30, 30, 360, WHITE);
        LIBS.translateY(this.head.POSITION_MATRIX, 0.73);
        this.body.childs.push(this.head);

        //Tanduk
        this.horn = this.braid1 = new Crescent(
            ...GL_PARAMS,
            0.15,   // majorRadius (7)
            -0.17,// minorRadius (8)
            90,     // startAngDeg (9)
            270,    // endAngDeg (10)
            32,         // majorSegments (11)
            32,         // minorSegments (12)
            GREEN       // color (13)
        );
        LIBS.translateZ(this.horn.POSITION_MATRIX, 0.06)
        LIBS.translateY(this.horn.POSITION_MATRIX, -0.12)
        LIBS.rotateZ(this.horn.POSITION_MATRIX, LIBS.degToRad(-90))
        this.head.childs.push(this.horn)

        // Kepala Hijau
        const headGreen1Radius = 0.198;
        this.headGreen1 = new Ellipsoid(
            ...GL_PARAMS,
            headGreen1Radius, headGreen1Radius, headGreen1Radius,
            30, 30, 150, GREEN
        );
        LIBS.translateY(this.headGreen1.POSITION_MATRIX, 0.01);
        LIBS.rotateZ(this.headGreen1.POSITION_MATRIX, Math.PI / 2);
        this.head.childs.push(this.headGreen1);

        const headGreen3Radius = 0.2;
        this.headGreen3 = new Ellipsoid(
            ...GL_PARAMS,
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
            ...GL_PARAMS,
            headGreen4Radius, headGreen4Radius, headGreen4Radius,
            30, 30, 90, GREEN
        );
        LIBS.translateY(this.headGreen4.POSITION_MATRIX, 0.01);
        LIBS.translateZ(this.headGreen4.POSITION_MATRIX, 0.02);
        LIBS.rotateZ(this.headGreen4.POSITION_MATRIX, Math.PI / 1.57);
        LIBS.rotateX(this.headGreen4.POSITION_MATRIX, Math.PI / 7);
        this.head.childs.push(this.headGreen4);

        const headRadiusGreen = 0.18;
        this.headGreen = new Ellipsoid(...GL_PARAMS, headRadiusGreen+0.01, headRadiusGreen, headRadiusGreen+0.03, 30, 30, 360, GREEN);
        LIBS.translateZ(this.headGreen.POSITION_MATRIX, -0.005);
        this.head.childs.push(this.headGreen);

        //Right Whisker
        this.rightWhisker1 = new Cone(
            ...GL_PARAMS,
            0.9, 0, 360, 0, 0, 2.5, 30, WHITE
        );
        LIBS.scale(this.rightWhisker1.POSITION_MATRIX, 0.05, 0.05, 0.05)
        LIBS.translateX(this.rightWhisker1.POSITION_MATRIX, -0.2)
        LIBS.translateY(this.rightWhisker1.POSITION_MATRIX, 0.04)
        LIBS.rotateZ(this.rightWhisker1.POSITION_MATRIX, LIBS.degToRad(70))
        LIBS.rotateY(this.rightWhisker1.POSITION_MATRIX, LIBS.degToRad(-30))
        this.head.childs.push(this.rightWhisker1);

        this.rightWhisker2 = new Cone(
            ...GL_PARAMS,
            0.7, 0, 360, 0, 0, 2, 30, WHITE
        );
        LIBS.scale(this.rightWhisker2.POSITION_MATRIX, 0.05, 0.05, 0.05)
        LIBS.translateX(this.rightWhisker2.POSITION_MATRIX, -0.2)
        LIBS.translateY(this.rightWhisker2.POSITION_MATRIX, -0.04)
        LIBS.rotateZ(this.rightWhisker2.POSITION_MATRIX, LIBS.degToRad(100))
        LIBS.rotateY(this.rightWhisker2.POSITION_MATRIX, LIBS.degToRad(-30))
        this.head.childs.push(this.rightWhisker2);

        this.rightWhisker3 = new Cone(
            ...GL_PARAMS,
            1, 0, 360, 0, 0, 1.5, 30, WHITE
        );
        LIBS.scale(this.rightWhisker3.POSITION_MATRIX, 0.05, 0.05, 0.05)
        LIBS.translateX(this.rightWhisker3.POSITION_MATRIX, -0.16)
        LIBS.translateY(this.rightWhisker3.POSITION_MATRIX, -0.1)
        LIBS.rotateZ(this.rightWhisker3.POSITION_MATRIX, LIBS.degToRad(120))
        LIBS.rotateY(this.rightWhisker3.POSITION_MATRIX, LIBS.degToRad(-30))
        this.head.childs.push(this.rightWhisker3);

        //Left Whisker
        this.leftWhisker1 = new Cone(
            ...GL_PARAMS,
            0.9, 0, 360, 0, 0, 2.5, 30, WHITE
        );
        LIBS.scale(this.leftWhisker1.POSITION_MATRIX, 0.05, 0.05, 0.05)
        LIBS.translateX(this.leftWhisker1.POSITION_MATRIX, 0.2)
        LIBS.translateY(this.leftWhisker1.POSITION_MATRIX, 0.04)
        LIBS.rotateZ(this.leftWhisker1.POSITION_MATRIX, LIBS.degToRad(-70))
        LIBS.rotateY(this.leftWhisker1.POSITION_MATRIX, LIBS.degToRad(30))
        this.head.childs.push(this.leftWhisker1);

        this.leftWhisker2 = new Cone(
            ...GL_PARAMS,
            0.7, 0, 360, 0, 0, 2, 30, WHITE
        );
        LIBS.scale(this.leftWhisker2.POSITION_MATRIX, 0.05, 0.05, 0.05)
        LIBS.translateX(this.leftWhisker2.POSITION_MATRIX, 0.2)
        LIBS.translateY(this.leftWhisker2.POSITION_MATRIX, -0.04)
        LIBS.rotateZ(this.leftWhisker2.POSITION_MATRIX, LIBS.degToRad(-100))
        LIBS.rotateY(this.leftWhisker2.POSITION_MATRIX, LIBS.degToRad(30))
        this.head.childs.push(this.leftWhisker2);

        this.leftWhisker3 = new Cone(
            ...GL_PARAMS,
            1, 0, 360, 0, 0, 1.5, 30, WHITE
        );
        LIBS.scale(this.leftWhisker3.POSITION_MATRIX, 0.05, 0.05, 0.05)
        LIBS.translateX(this.leftWhisker3.POSITION_MATRIX, 0.16)
        LIBS.translateY(this.leftWhisker3.POSITION_MATRIX, -0.1)
        LIBS.rotateZ(this.leftWhisker3.POSITION_MATRIX, LIBS.degToRad(-120))
        LIBS.rotateY(this.leftWhisker3.POSITION_MATRIX, LIBS.degToRad(30))
        this.head.childs.push(this.leftWhisker3);

        //Left Eye
        this.leftEyeB = new ModifiedEllipsoid(
            ...GL_PARAMS,
            0.18,
            0.18,
            0.18,
            30,
            30,
            360,
            25,
            90,
            BLACK
        )
        LIBS.translateZ(this.leftEyeB.POSITION_MATRIX, 0.03)
        LIBS.rotateX(this.leftEyeB.POSITION_MATRIX, LIBS.degToRad(13))
        LIBS.rotateY(this.leftEyeB.POSITION_MATRIX, LIBS.degToRad(-35))
        this.head.childs.push(this.leftEyeB)

        this.leftEyeW = new ModifiedEllipsoid(
            ...GL_PARAMS,
            0.18,
            0.18,
            0.18,
            30,
            30,
            360,
            23,
            90,
            WHITE
        )
        LIBS.translateZ(this.leftEyeW.POSITION_MATRIX, 0.00001)
        this.leftEyeB.childs.push(this.leftEyeW)

        this.leftEyeB2 = new ModifiedEllipsoid(
            ...GL_PARAMS,
            0.18,
            0.18,
            0.18,
            30,
            30,
            360,
            18,
            90,
            BLACK
        )
        LIBS.translateZ(this.leftEyeB2.POSITION_MATRIX, 0.0001)
        LIBS.rotateX(this.leftEyeB2.POSITION_MATRIX, LIBS.degToRad(4))
        LIBS.rotateY(this.leftEyeB2.POSITION_MATRIX, LIBS.degToRad(4))
        this.leftEyeB.childs.push(this.leftEyeB2)

        this.leftEyeR = new ModifiedEllipsoid(
            ...GL_PARAMS,
            0.18,
            0.18,
            0.18,
            30,
            30,
            360,
            16,
            90,
            RED
        )
        LIBS.translateZ(this.leftEyeR.POSITION_MATRIX, 0.0002)
        LIBS.rotateX(this.leftEyeR.POSITION_MATRIX, LIBS.degToRad(4))
        LIBS.rotateY(this.leftEyeR.POSITION_MATRIX, LIBS.degToRad(4))
        this.leftEyeB.childs.push(this.leftEyeR)

        this.leftEyeB3 = new ModifiedEllipsoid(
            ...GL_PARAMS,
            0.18,
            0.18,
            0.18,
            30,
            30,
            360,
            12,
            90,
            BLACK
        )
        LIBS.scale(this.leftEyeB3.POSITION_MATRIX, 0.3, 0.5, 1)
        LIBS.translateZ(this.leftEyeB3.POSITION_MATRIX, 0.003)
        LIBS.rotateX(this.leftEyeB3.POSITION_MATRIX, LIBS.degToRad(5))
        LIBS.rotateY(this.leftEyeB3.POSITION_MATRIX, LIBS.degToRad(5))
        this.leftEyeB.childs.push(this.leftEyeB3)

        //Right Eye
        this.rightEyeB = new ModifiedEllipsoid(
            ...GL_PARAMS,
            0.18,
            0.18,
            0.18,
            30,
            30,
            360,
            25,
            90,
            BLACK
        )
        LIBS.translateZ(this.rightEyeB.POSITION_MATRIX, 0.03)
        LIBS.rotateX(this.rightEyeB.POSITION_MATRIX, LIBS.degToRad(13))
        LIBS.rotateY(this.rightEyeB.POSITION_MATRIX, LIBS.degToRad(35))
        this.head.childs.push(this.rightEyeB)

        this.rightEyeW = new ModifiedEllipsoid(
            ...GL_PARAMS,
            0.18,
            0.18,
            0.18,
            30,
            30,
            360,
            23,
            90,
            WHITE
        )
        LIBS.translateZ(this.rightEyeW.POSITION_MATRIX, 0.00001)
        this.rightEyeB.childs.push(this.rightEyeW)

        this.rightEyeB2 = new ModifiedEllipsoid(
            ...GL_PARAMS,
            0.18,
            0.18,
            0.18,
            30,
            30,
            360,
            18,
            90,
            BLACK
        )
        LIBS.translateZ(this.rightEyeB2.POSITION_MATRIX, 0.0001)
        LIBS.rotateX(this.rightEyeB2.POSITION_MATRIX, LIBS.degToRad(4))
        LIBS.rotateY(this.rightEyeB2.POSITION_MATRIX, LIBS.degToRad(-4))
        this.rightEyeB.childs.push(this.rightEyeB2)

        this.rightEyeR = new ModifiedEllipsoid(
            ...GL_PARAMS,
            0.18,
            0.18,
            0.18,
            30,
            30,
            360,
            16,
            90,
            RED
        )
        LIBS.translateZ(this.rightEyeR.POSITION_MATRIX, 0.0002)
        LIBS.rotateX(this.rightEyeR.POSITION_MATRIX, LIBS.degToRad(4))
        LIBS.rotateY(this.rightEyeR.POSITION_MATRIX, LIBS.degToRad(-4))
        this.rightEyeB.childs.push(this.rightEyeR)

        this.rightEyeB3 = new ModifiedEllipsoid(
            ...GL_PARAMS,
            0.18,
            0.18,
            0.18,
            30,
            30,
            360,
            12,
            90,
            BLACK
        )
        LIBS.scale(this.rightEyeB3.POSITION_MATRIX, 0.3, 0.5, 1)
        LIBS.translateZ(this.rightEyeB3.POSITION_MATRIX, 0.003)
        LIBS.rotateX(this.rightEyeB3.POSITION_MATRIX, LIBS.degToRad(5))
        LIBS.rotateY(this.rightEyeB3.POSITION_MATRIX, LIBS.degToRad(-5))
        this.rightEyeB.childs.push(this.rightEyeB3)

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
            [0.7, 0.94, 0.8]            // color (13)
        );

        LIBS.translateY(this.braid1.POSITION_MATRIX, -0.04);
        LIBS.translateZ(this.braid1.POSITION_MATRIX, 0.11);
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
            [0.7, 0.94, 0.8]            // color (13)
        );

        LIBS.translateY(this.braid2.POSITION_MATRIX, -0.04);
        LIBS.translateZ(this.braid2.POSITION_MATRIX, 0.11);
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
        this.ArmLeftTop = new Cylinder(...GL_PARAMS, ArmLeftTopRadius, ArmLeftTopHeight, 30, GREEN);
        LIBS.rotateZ(this.ArmLeftTop.POSITION_MATRIX, -Math.PI / 2);
        LIBS.translateY(this.ArmLeftTop.POSITION_MATRIX, 0.32);
        LIBS.translateX(this.ArmLeftTop.POSITION_MATRIX, -0.2);
        LIBS.rotateZ(this.ArmLeftTop.POSITION_MATRIX, LIBS.degToRad(40));
        this.body.childs.push(this.ArmLeftTop);

        const ArmLeftBottomRadius = 0.15;
        this.ArmLeftBottom = new Ellipsoid(...GL_PARAMS, ArmLeftBottomRadius-0.075, ArmLeftBottomRadius+0.15, ArmLeftBottomRadius-0.075, 30, 30, 360, GREEN);
        LIBS.translateY(this.ArmLeftBottom.POSITION_MATRIX, -0.4);
        this.ArmLeftTop.childs.push(this.ArmLeftBottom);

        //Tangan Kanan
        const ArmRightTopRadius = 0.05;
        const ArmRightTopHeight = 0.5;
        this.ArmRightTop = new Cylinder(...GL_PARAMS, ArmRightTopRadius, ArmRightTopHeight, 30, GREEN);
        LIBS.rotateZ(this.ArmRightTop.POSITION_MATRIX, -Math.PI / 2);
        LIBS.translateY(this.ArmRightTop.POSITION_MATRIX, 0.32);
        LIBS.translateX(this.ArmRightTop.POSITION_MATRIX, 0.2);
        LIBS.rotateZ(this.ArmRightTop.POSITION_MATRIX, LIBS.degToRad(-40));
        this.body.childs.push(this.ArmRightTop);

        const ArmRightBottomRadius = 0.15;
        this.ArmRightBottom = new Ellipsoid(...GL_PARAMS, ArmRightBottomRadius-0.075, ArmRightBottomRadius+0.15, ArmRightBottomRadius-0.075, 30, 30, 360, GREEN);
        LIBS.translateY(this.ArmRightBottom.POSITION_MATRIX, 0.4);
        this.ArmRightTop.childs.push(this.ArmRightBottom);

        // Kaki Kiri
        const legLeftTopRadius = 0.04;
        const legLeftTopHeight = 1.1;
        this.legLeftTop = new Cylinder(...GL_PARAMS, legLeftTopRadius, legLeftTopHeight, 30, GREEN);
        LIBS.translateY(this.legLeftTop.POSITION_MATRIX, -0.3);
        LIBS.translateX(this.legLeftTop.POSITION_MATRIX, -0.06);
        this.body.childs.push(this.legLeftTop);
        
        const legLeftBottomRadius = 0.15;
        this.legLeftBottom = new Ellipsoid(...GL_PARAMS, legLeftBottomRadius-0.075, legLeftBottomRadius+0.1, legLeftBottomRadius-0.075, 30, 30, 360, GREEN);
        LIBS.translateY(this.legLeftBottom.POSITION_MATRIX, -0.55);
        this.legLeftTop.childs.push(this.legLeftBottom);
    
        // Kaki Kanan
        const legRightTopRadius = 0.04;
        const legRightTopHeight = 1.1;
        this.legRightTop = new Cylinder(...GL_PARAMS, legRightTopRadius, legRightTopHeight, 30, GREEN);
        LIBS.translateY(this.legRightTop.POSITION_MATRIX, -0.3);
        LIBS.translateX(this.legRightTop.POSITION_MATRIX, 0.06);
        this.body.childs.push(this.legRightTop);
        
        const legRightBottomRadius = 0.15;
        this.legRightBottom = new Ellipsoid(...GL_PARAMS, legRightBottomRadius-0.075, legRightBottomRadius+0.1, legRightBottomRadius-0.075, 30, 30, 360, GREEN);
        LIBS.translateY(this.legRightBottom.POSITION_MATRIX, -0.55)
        this.legRightTop.childs.push(this.legRightBottom)

        this.spellOrb = new Ellipsoid(
            ...GL_PARAMS,
            0.15, 0.15, 0.15, // radius x, y, z
            20, 20, 360,     // segments
            [0.9, 0.4, 0.8]  // Warna (misal: Pink/Ungu)
        );
        LIBS.scale(this.spellOrb.POSITION_MATRIX, 0, 0, 0); 
        this.body.childs.push(this.spellOrb);

        // Simpan objek utama (root)
        this.allObjects = [this.body];

    }

    // Metode untuk setup semua buffer
    setup() {
        this.allObjects.forEach(obj => obj.setup());
    }

    applyWalkingAnimation(time, factor) {
        // ... (Tidak ada perubahan di fungsi ini) ...
        // Kecepatan animasi
        const speed = 0.01;
        // Nilai rotasi leg (max +/- 20 derajat)
        const legMaxRot = 20 * factor;
        // Nilai rotasi/geser skirt (max +/- 15 derajat / 0.15)
        const skirtRot = 15 * factor;
        const skirtTransZ = -0.12 *factor;

        // --- Variabel Animasi Tangan (Hanya Tangan yang Bergerak Dinamis) ---
        const armMinRot = 30; // Rotasi minimum (paling mundur)
        const armMaxRot = 45; // Rotasi maksimum (paling maju)
        const armTopHeight = 0.5
        // Amplitudo ayunan: (Max - Min) / 2 = 7.5
        const armAmplitude = (armMaxRot - armMinRot) / 2;
        // Nilai tengah (offset) yang akan membuat ayunan berpusat di (30 + 45) / 2 = 37.5
        const armOffset = armMinRot + armAmplitude; // 37.5 derajat
        const sinValue = Math.sin(time * speed);    
        // Rotasi dinamis penuh: (sin * ampl) + offset
        const fullDynamicRotation = (sinValue * armAmplitude) + armOffset;

        // Rotasi yang diinterpolasi: (faktor * rotasi dinamis penuh) + (1 - faktor) * rotasi statis
        // Posisi statis lengan adalah 0 derajat (jika rotasi statis sudah di reset)
        const dynamicRotation = 0 + (fullDynamicRotation - 0) * factor; 
        // Karena rotasi Anda adalah 30-45 derajat, kita bisa langsung menggunakan dynamicRotation * factor

        // ------------------------------------
        // --- IMPLEMENTASI ANIMASI TANGAN ---
        // ------------------------------------
        let l_id = LIBS.get_I4();
        LIBS.set_I4(this.ArmLeftTop.MOVE_MATRIX);
        LIBS.translateY(l_id, -armTopHeight / 2);
        let l_id2 = LIBS.get_I4();
        LIBS.rotateX(l_id2, LIBS.degToRad(dynamicRotation))
        l_id = LIBS.multiply(l_id, l_id2);
        LIBS.translateY(l_id, armTopHeight / 2);
        this.ArmLeftTop.MOVE_MATRIX = LIBS.multiply(this.ArmLeftTop.MOVE_MATRIX, l_id)

        let r_id = LIBS.get_I4();
        LIBS.set_I4(this.ArmRightTop.MOVE_MATRIX);
        LIBS.translateY(r_id, armTopHeight / 2);
        let r_id2 = LIBS.get_I4();
        LIBS.rotateX(r_id2, LIBS.degToRad(-dynamicRotation))
        r_id = LIBS.multiply(r_id, r_id2);
        LIBS.translateY(r_id, -armTopHeight / 2);
        this.ArmRightTop.MOVE_MATRIX = LIBS.multiply(this.ArmRightTop.MOVE_MATRIX, r_id)

        // --- Animasi Kaki (Legs) ---
        LIBS.set_I4(this.legLeftTop.MOVE_MATRIX);
        LIBS.rotateX(this.legLeftTop.MOVE_MATRIX, LIBS.degToRad(legMaxRot));
        LIBS.translateZ(this.legLeftTop.MOVE_MATRIX, -0.17 * factor)

        // Reset dan Terapkan Kaki Kanan
        LIBS.set_I4(this.legRightTop.MOVE_MATRIX);
        LIBS.rotateX(this.legRightTop.MOVE_MATRIX, LIBS.degToRad(legMaxRot));
        LIBS.translateZ(this.legRightTop.MOVE_MATRIX, -0.17 * factor)

        // --- Animasi Gaun (Skirts) ---
        // Gaun Depan-Kanan (skirt1) - 
        LIBS.set_I4(this.skirt1.MOVE_MATRIX);
        LIBS.rotateX(this.skirt1.MOVE_MATRIX, LIBS.degToRad(skirtRot));
        LIBS.translateZ(this.skirt1.MOVE_MATRIX, skirtTransZ * factor);

        // Gaun Belakang-Kanan (skirt2) 
        LIBS.set_I4(this.skirt2.MOVE_MATRIX);
        LIBS.rotateX(this.skirt2.MOVE_MATRIX, LIBS.degToRad(skirtRot));
        LIBS.translateZ(this.skirt2.MOVE_MATRIX, skirtTransZ * factor);

        // Gaun Belakang-Kiri (skirt3) - Bergerak bersama kaki kiri (berlawanan skirt2)
        LIBS.set_I4(this.skirt3.MOVE_MATRIX);
        LIBS.rotateX(this.skirt3.MOVE_MATRIX, LIBS.degToRad(skirtRot));
        LIBS.translateZ(this.skirt3.MOVE_MATRIX, skirtTransZ * factor);

        // Gaun Depan-Kiri (skirt4) - Bergerak berlawanan dengan kaki kiri (berlawanan skirt1)
        LIBS.set_I4(this.skirt4.MOVE_MATRIX);
        LIBS.rotateX(this.skirt4.MOVE_MATRIX, LIBS.degToRad(skirtRot));
        LIBS.translateZ(this.skirt4.MOVE_MATRIX, skirtTransZ * factor);
    }

    /**
     * Mengatur ulang semua matriks ke posisi statis (seperti di constructor).
     */
    resetWalkingAnimation(factor) {
        // ... (Tidak ada perubahan di fungsi ini) ...
        const armTopHeight = 0.5;
        const dynamicRotation = 0 + (45 - 0) * factor;
        
        // --- Tangan Kiri ---
        let l_id = LIBS.get_I4();
        LIBS.set_I4(this.ArmLeftTop.MOVE_MATRIX);
        LIBS.translateY(l_id, -armTopHeight / 2);
        let l_id2 = LIBS.get_I4();
        LIBS.rotateX(l_id2, LIBS.degToRad(dynamicRotation))
        l_id = LIBS.multiply(l_id, l_id2);
        LIBS.translateY(l_id, armTopHeight / 2);
        this.ArmLeftTop.MOVE_MATRIX = LIBS.multiply(this.ArmLeftTop.MOVE_MATRIX, l_id)

        // --- Tangan Kanan ---
        let r_id = LIBS.get_I4();
        LIBS.set_I4(this.ArmRightTop.MOVE_MATRIX);
        LIBS.translateY(r_id, armTopHeight / 2);
        let r_id2 = LIBS.get_I4();
        LIBS.rotateX(r_id2, LIBS.degToRad(-dynamicRotation))
        r_id = LIBS.multiply(r_id, r_id2);
        LIBS.translateY(r_id, -armTopHeight / 2);
        this.ArmRightTop.MOVE_MATRIX = LIBS.multiply(this.ArmRightTop.MOVE_MATRIX, r_id)

        // --- Kaki Kiri ---
        LIBS.set_I4(this.legLeftTop.MOVE_MATRIX); 
        // Interpolasi Rotasi X (Rotasi statis 20 deg kembali ke 0)
        LIBS.rotateX(this.legLeftTop.MOVE_MATRIX, LIBS.degToRad(20 * factor)); 
        // Interpolasi Translasi Z (Translasi statis -0.17 kembali ke 0)
        LIBS.translateZ(this.legLeftTop.MOVE_MATRIX, -0.17 * factor);

        // Kaki Kanan
        LIBS.set_I4(this.legRightTop.MOVE_MATRIX); 
        // Interpolasi Rotasi X
        LIBS.rotateX(this.legRightTop.MOVE_MATRIX, LIBS.degToRad(20 * factor)); 
        // Interpolasi Translasi Z
        LIBS.translateZ(this.legRightTop.MOVE_MATRIX, -0.17 * factor);

        // Skirt1 (depan-kanan)
        LIBS.set_I4(this.skirt1.MOVE_MATRIX);
        LIBS.rotateX(this.skirt1.MOVE_MATRIX, LIBS.degToRad(15 * factor));
        LIBS.translateZ(this.skirt1.MOVE_MATRIX, -0.12 * factor);

        // Skirt2 (belakang-kanan)
        LIBS.set_I4(this.skirt2.MOVE_MATRIX);
        LIBS.rotateX(this.skirt2.MOVE_MATRIX, LIBS.degToRad(15 * factor));
        LIBS.translateZ(this.skirt2.MOVE_MATRIX, -0.12 * factor);

        // Skirt3 (belakang-kiri)
        LIBS.set_I4(this.skirt3.MOVE_MATRIX);
        LIBS.rotateX(this.skirt3.MOVE_MATRIX, LIBS.degToRad(15 * factor));
        LIBS.translateZ(this.skirt3.MOVE_MATRIX, -0.12 * factor);

        // Skirt4 (depan-kiri)
        LIBS.set_I4(this.skirt4.MOVE_MATRIX);
        LIBS.rotateX(this.skirt4.MOVE_MATRIX, LIBS.degToRad(15 * factor));
        LIBS.translateZ(this.skirt4.MOVE_MATRIX, -0.12 * factor);
    }

    /**
     * Mengatur bidang dan pusat rotasi global.
     */
    setGlobalRotation(axis, center) {
        this.moveCenter = center || [0, 0, 0];
        
        // 1. Normalisasi dan simpan sumbu rotasi
        this.moveAxis = VEC.normalize(axis);
        
        // 2. Cari vektor 'helper' yang tidak paralel dengan sumbu
        let helper = [1.0, 0.0, 0.0];
        const dot = VEC.dot(this.moveAxis, helper);
        if (Math.abs(dot) > 0.99) {
            helper = [0.0, 1.0, 0.0]; // Ganti jika paralel
        }

        // 3. Buat dua vektor ortogonal (basis) untuk bidang rotasi
        //    Gunakan cross product untuk menemukan dua vektor
        //    yang tegak lurus dengan sumbu.
        
        // v1 = 'right' (atau 'forward' awal)
        const v1 = VEC.normalize(VEC.cross(helper, this.moveAxis));
        // v2 = 'up' (atau 'right' awal)
        const v2 = VEC.normalize(VEC.cross(this.moveAxis, v1));
        
        this.radiusVec1 = VEC.scale(v1, this.moveRadius);
        this.radiusVec2 = VEC.scale(v2, this.moveRadius);
    }

    /**
     * Mengupdate status state, rotasi global, dan translasi karakter.
     * @param {number} dt - Delta time (waktu yang berlalu dalam detik).
     * @param {array} modelMatrix - Matriks Model global Gardevoir yang akan dimodifikasi.
     */
    updateGlobalMovement(dt, modelMatrix) {
        // --- 1. Update State (LOGIKA BARU BERBASIS SUDUT) ---
        this.globalTimeAcc += dt; 

        if (this.isIdle) {
            // ... (kode transisi faktor) ...
            this.transitionFactor -= dt * 5.0; 
            if (this.transitionFactor < 0.0) this.transitionFactor = 0.0;
            
            // Cek di mana kita idle
            if (this.idleAnimActive) {
                // --- IDLE DENGAN ANIMASI SPELL (DI 270) ---
                this.updateIdleAnimation(dt); // Jalankan animasi
    
                // Cek jika animasi SUDAH SELESAI
                if (!this.idleAnimActive) {
                    // Animasi baru saja selesai, kita boleh bergerak
                    this.isIdle = false;
                    
                    // Tentukan target BERIKUTNYA (ke 90)
                    this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.idlePoints.length;
                    let nextTargetAngle = this.idlePoints[this.currentWaypointIndex];
                    
                    if (nextTargetAngle <= this.currentGlobalAngle) {
                        this.targetGlobalAngle = nextTargetAngle + LIBS.degToRad(360) * Math.ceil((this.currentGlobalAngle - nextTargetAngle) / LIBS.degToRad(360));
                    } else {
                        this.targetGlobalAngle = nextTargetAngle;
                    }
                }
            } else {
                // --- IDLE BIASA (DI 90) ---
                // Cek jika durasi idle selesai
                if (this.globalTimeAcc - this.idleStartTime >= this.idleDuration) {
                    this.isIdle = false; // Mulai bergerak
                    
                    // Tentukan target BERIKUTNYA (ke 270)
                    this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.idlePoints.length;
                    let nextTargetAngle = this.idlePoints[this.currentWaypointIndex];
                    
                    if (nextTargetAngle <= this.currentGlobalAngle) {
                        this.targetGlobalAngle = nextTargetAngle + LIBS.degToRad(360) * Math.ceil((this.currentGlobalAngle - nextTargetAngle) / LIBS.degToRad(360));
                    } else {
                        this.targetGlobalAngle = nextTargetAngle;
                    }
                }
            }
        } else { 
            // --- LOGIKA BERGERAK ---
            // ... (kode transisi faktor) ...
            this.transitionFactor += dt * 5.0; 
            if (this.transitionFactor > 1.0) this.transitionFactor = 1.0;
    
            this.currentGlobalAngle += this.moveSpeed * dt;
    
            // Cek jika kita sudah mencapai atau melewati target
            if (this.currentGlobalAngle >= this.targetGlobalAngle) {
                this.currentGlobalAngle = this.targetGlobalAngle; 
                this.isIdle = true; 
                this.idleStartTime = this.globalTimeAcc; 
                
                const angle270 = LIBS.degToRad(270);
                const epsilon = 0.001; 
                const wrappedAngle = this.currentGlobalAngle % LIBS.degToRad(360);
    
                // [MODIFIKASI TRIGGER]
                if (Math.abs(wrappedAngle - angle270) < epsilon) {
                    if (!this.idleAnimActive) {
                        this.idleAnimActive = true;
                        
                        // [BARU] Mulai dari Fase 1
                        this.idleAnimPhase = 1; 
                        
                        // Reset semua state
                        this.idleArmRotFactor = 0.0; // Reset progres rotasi tangan
                        this.idleAnimScale = 0.0; 
                        this.idleAnimPos = [0, 2.7, 0]; // Reset posisi
                    }
                }
            }
        }
        
        // --- 2. Hitung Posisi ---
        // Gunakan modulo (%) untuk wrapping jika angle > 360
        const wrappedAngle = this.currentGlobalAngle % LIBS.degToRad(360);
        
        const c = Math.cos(wrappedAngle);
        const s = Math.sin(wrappedAngle);
        const C = this.moveCenter;
        
        const v1 = this.radiusVec1;
        const v2 = this.radiusVec2;
        
        const pos = [
            C[0] + (v1[0] * c) + (v2[0] * s),
            C[1] + (v1[1] * c) + (v2[1] * s),
            C[2] + (v1[2] * c) + (v2[2] * s)
        ];
    
        // --- 3. Hitung Orientasi ---
        let R, U, F; 
        const c_wrap = Math.cos(wrappedAngle);
        const s_wrap = Math.sin(wrappedAngle);

        const v1_xz = [v1[0], 0, v1[2]];
        const v2_xz = [v2[0], 0, v2[2]];
        
        const tangent_x = (-v1_xz[0] * s_wrap) + (v2_xz[0] * c_wrap);
        const tangent_z = (-v1_xz[2] * s_wrap) + (v2_xz[2] * c_wrap);
        
        const facingAngleY = Math.atan2(tangent_x, tangent_z);
        
        const s_face = Math.sin(facingAngleY);
        const c_face = Math.cos(facingAngleY);
    
        U = [0, 1, 0];
        F = [s_face, 0, c_face];
        R = [c_face, 0, -s_face];
    
        // --- 4. Tulis Basis ke Model Matrix ---
        modelMatrix[0] = R[0]; modelMatrix[1] = R[1]; modelMatrix[2] = R[2]; modelMatrix[3] = 0.0;
        modelMatrix[4] = U[0]; modelMatrix[5] = U[1]; modelMatrix[6] = U[2]; modelMatrix[7] = 0.0;
        modelMatrix[8] = F[0]; modelMatrix[9] = F[1]; modelMatrix[10] = F[2]; modelMatrix[11] = 0.0;
        modelMatrix[12] = pos[0]; modelMatrix[13] = pos[1]; modelMatrix[14] = pos[2]; modelMatrix[15] = 1.0;
    }

    updateIdleAnimation(dt) {
        const M_orb = this.spellOrb.POSITION_MATRIX;
        const armTopHeight = this.armTopHeight; 

        // --- Logika State Machine ---
        if (!this.idleAnimActive) {
            LIBS.set_I4(M_orb);
            LIBS.scale(M_orb, 0, 0, 0);
            // Biarkan render() yang mengurus reset tangan
            return;
        }

        let currentScale = this.idleAnimScale;
        let currentArmRot = 0; // Sudut target untuk frame ini (0 -> 180)

        // --- FASE 1: Tangan Berputar ---
        if (this.idleAnimPhase === 1) {
            this.idleArmRotFactor += (dt / this.idleArmRotDuration);
            if (this.idleArmRotFactor >= 1.0) {
                this.idleArmRotFactor = 1.0;
                this.idleAnimPhase = 2; 
            }
            currentArmRot = this.idleArmRotFactor * 90.0;
            // Sembunyikan orb
            LIBS.set_I4(M_orb);
            LIBS.scale(M_orb, 0, 0, 0);
        } 
        // --- FASE 2: Scaling Orb ---
        else if (this.idleAnimPhase === 2) {
            currentArmRot = 90.0; // Tahan di 180
            this.idleAnimScale += (dt / this.idleAnimDuration);
            if (this.idleAnimScale > 10.0) { 
                this.idleAnimScale = 10.0;
                this.idleAnimPhase = 3; 
            }
            currentScale = this.idleAnimScale;
            // Tulis matriks orb (di start pos)
            LIBS.set_I4(M_orb);
            M_orb[0] = currentScale; M_orb[5] = currentScale; M_orb[10] = currentScale;
            M_orb[12] = this.idleAnimPos[0]; M_orb[13] = this.idleAnimPos[1]; M_orb[14] = this.idleAnimPos[2];
        } 
        // --- FASE 3: Moving Orb ---
        else if (this.idleAnimPhase === 3) {
            currentArmRot = 90.0; // Tahan di 180
            currentScale = 10.0; 
            const dir = this.idleAnimGradient;
            const speed = this.idleAnimMoveSpeed;
            this.idleAnimPos[0] += dir[0] * speed * dt;
            this.idleAnimPos[1] += dir[1] * speed * dt;
            this.idleAnimPos[2] += dir[2] * speed * dt;
            // Tulis matriks orb (di pos baru)
            LIBS.set_I4(M_orb);
            M_orb[0] = currentScale; M_orb[5] = currentScale; M_orb[10] = currentScale;
            M_orb[12] = this.idleAnimPos[0]; M_orb[13] = this.idleAnimPos[1]; M_orb[14] = this.idleAnimPos[2];
            
            // Cek selesai
            if (this.idleAnimPos[1] <= -1.0) {
                this.idleAnimPhase = 4;
                this.idleArmRotFactor = 1.0; // Mulai turun dari 1.0 (90 deg)
                this.idleAnimScale = 0.0; 
                
                LIBS.set_I4(M_orb); // Sembunyikan orb
                LIBS.scale(M_orb, 0, 0, 0);
                return; 
            }
        }else if (this.idleAnimPhase === 4) {
            // Turunkan faktor dari 1.0 ke 0.0
            this.idleArmRotFactor -= (dt / this.idleArmRotDuration); 
            
            if (this.idleArmRotFactor <= 0.0) {
                this.idleArmRotFactor = 0.0;
                this.idleAnimActive = false; // Izinkan Gardevoir bergerak lagi
                this.idleAnimPhase = 0;
                currentArmRot = 0.0; // Pastikan tangan kembali ke 0
            } else {
                 // Interpolasi rotasi dari 90 (faktor=1) ke 0 (faktor=0)
                currentArmRot = this.idleArmRotFactor * 90.0;
            }

            // Orb tetap tersembunyi
            LIBS.set_I4(M_orb);
            LIBS.scale(M_orb, 0, 0, 0);
        }

        // --- Tulis Matriks Tangan (Pivot Rotation yang Benar) ---
        
        // --- Tangan Kiri ---
        let l_pivot_rot = LIBS.get_I4(); // Hasil T_inv * R * T
        let l_temp_Tinv = LIBS.get_I4(); // Matriks T_inv
        let l_temp_R = LIBS.get_I4();    // Matriks R
        let l_temp_T = LIBS.get_I4();    // Matriks T
        
        // 1. Buat matriks komponen
        LIBS.set_I4(l_temp_Tinv); // Pastikan mulai dari identitas
        LIBS.translateY(l_temp_Tinv, -armTopHeight / 2);      // T_inv
        LIBS.set_I4(l_temp_R);    // Pastikan mulai dari identitas
        LIBS.rotateZ(l_temp_R, LIBS.degToRad(-currentArmRot)); // R
        LIBS.set_I4(l_temp_T);    // Pastikan mulai dari identitas
        LIBS.translateY(l_temp_T, armTopHeight / 2);       // T
        
        // 2. Hitung T_inv * R * T
        l_pivot_rot = LIBS.multiply(l_temp_Tinv, l_temp_R); // T_inv * R
        l_pivot_rot = LIBS.multiply(l_pivot_rot, l_temp_T); // (T_inv * R) * T
        
        // 3. Salin hasilnya ke matriks tangan kiri (mengganti total)
        for (let i = 0; i < 16; i++) {
            this.ArmLeftTop.MOVE_MATRIX[i] = l_pivot_rot[i];
        }

        // --- Tangan Kanan ---
        let r_pivot_rot = LIBS.get_I4(); // Hasil T_inv * R * T
        let r_temp_Tinv = LIBS.get_I4(); // Matriks T_inv
        let r_temp_R = LIBS.get_I4();    // Matriks R
        let r_temp_T = LIBS.get_I4();    // Matriks T

        // 1. Buat matriks komponen (gunakan pivot tangan kanan)
        LIBS.set_I4(r_temp_Tinv);
        LIBS.translateY(r_temp_Tinv, armTopHeight / 2);      // T_inv (kanan)
        LIBS.set_I4(r_temp_R);
        LIBS.rotateZ(r_temp_R, LIBS.degToRad(currentArmRot)); // R (kanan)
        LIBS.set_I4(r_temp_T);
        LIBS.translateY(r_temp_T, -armTopHeight / 2);      // T (kanan)

        // 2. Hitung T_inv * R * T
        r_pivot_rot = LIBS.multiply(r_temp_Tinv, r_temp_R); // T_inv * R
        r_pivot_rot = LIBS.multiply(r_pivot_rot, r_temp_T); // (T_inv * R) * T

        // 3. Salin hasilnya ke matriks tangan kanan (mengganti total)
        for (let i = 0; i < 16; i++) {
            this.ArmRightTop.MOVE_MATRIX[i] = r_pivot_rot[i];
        }
    }

    /**
     * Metode untuk merender semua objek. Ini yang dipanggil dari main.js.
     * @param {array} parentMatrix - Matriks global yang masuk (rotasi mouse * posisi global).
     */
    render(parentMatrix, currentTime) {
        if (!this.idleAnimActive) {
            this.applyWalkingAnimation(currentTime, this.transitionFactor);
        }
        
        // Render objek root dan seluruh hierarkinya
        this.allObjects.forEach(obj => obj.render(parentMatrix));
    }
}