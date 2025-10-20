// Kirlia.js (Kode yang telah diperbaiki & ditambah sequencer otomatis)
import { Cylinder } from "../object/Cylinder.js";
import { Ellipsoid } from "../object/Ellipsoid.js";
import { Trapezoid } from "../object/Trapezoid.js";
import { BSplineExtruded } from "../object/BSplineExtruded.js";
import { Cone } from "../object/Cone.js";

// Definisikan state animasi pergerakan Z
const MOVEMENT_STATE = {
    IDLE: 0,
    WALK_FRONT: 1,
    WALK_BACK: 2,
    BOWING: 3 // State untuk Bowing
};

// Buat kelas untuk Pokémon Kirlia
export class Kirlia {
    constructor(GL, SHADER_PROGRAM, _position, _Mmatrix) {
        // Mendefinisikan warna-warna yang digunakan
        const WHITE = [1.0, 1.0, 1.0];
        const LIGHT_PASTEL_GREEN = [0.733, 0.984, 0.741];
        const LIGHT_PINK = [1.0, 0.667, 0.686];
        const BLACK = [0.0, 0.0, 0.0];

        // --- Animation State Variables (Bowing) ---
        this.bowStartTime = 0;
        this.bowDuration = 2000; // 2 seconds in milliseconds
        this.maxBowAngle = 90 * Math.PI / 180; // 90 degrees in radians
        this.currentBowAngle = 0;

        // --- Animation State Variables (Movement) ---
        this.currentMovementState = MOVEMENT_STATE.IDLE;
        this.movementStartTime = 0;
        this.movementDuration = 2000; // 2 detik untuk maju/mundur
        this.delayDuration = 500;    // 1 detik delay (BARU)
        this.targetZ = 3.0; // Jarak translasi Z
        this.currentZ = 0.0; // Posisi Z saat ini
        
        // Tambahkan variabel floating state di constructor
        this.isFloating = true;
        this.floatAmplitude = 0.07; // Jarak naik-turun (misalnya 5cm)
        this.floatSpeed = 0.002;
        
        // Membuat semua bagian tubuh Kirlia... 
        const bodyGreenRadius = 0.1;
        this.bodyGreen = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, bodyGreenRadius-0.01, bodyGreenRadius-0.03, bodyGreenRadius-0.01, 30, 30, 360, LIGHT_PASTEL_GREEN);
        
        // SIMPAN POSISI Y AWAL bodyGreen (Pivot untuk rotasi)
        this.bodyGreenInitialY = -0.14; 
        LIBS.translateY(this.bodyGreen.POSITION_MATRIX, this.bodyGreenInitialY);

        const bodyRadius = 0.026;
        const bodyHeight = 0.38;
        this.body = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, bodyRadius, bodyHeight, 30, WHITE);
        LIBS.translateY(this.body.POSITION_MATRIX, 0.14);
        this.bodyGreen.childs.push(this.body)
        
        const middleBodyRadius = 0.1;
        const middleBodyHeight = 0.28;
        const radius = middleBodyRadius - 0.01;
        const height = middleBodyHeight - 0.01;
        const middleBody = new Cone(
            GL, SHADER_PROGRAM, _position, _Mmatrix, 
            radius, 0, 360, 0, 0, height, 30, WHITE
        );
        LIBS.translateY(middleBody.POSITION_MATRIX, 0.035);
        this.body.childs.push(middleBody);
        
        this.legRoot = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, bodyGreenRadius-0.01, bodyGreenRadius-0.03, bodyGreenRadius-0.01, 30, 30, 360, LIGHT_PASTEL_GREEN);
        LIBS.translateY(this.legRoot.POSITION_MATRIX, -0.14);

        const legLeftTopRadius = 0.018;
        const legLeftTopHeight = 0.27;
        const legLeftTop = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, legLeftTopRadius, legLeftTopHeight, 30, LIGHT_PASTEL_GREEN);
        LIBS.translateY(legLeftTop.POSITION_MATRIX, -0.16);
        LIBS.translateX(legLeftTop.POSITION_MATRIX, -0.06);
        this.legRoot.childs.push(legLeftTop);
        
        const legLeftBottomRadius = 0.1;
        const legLeftBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, legLeftBottomRadius-0.075, legLeftBottomRadius+0.01, legLeftBottomRadius-0.075, 30, 30, 360, LIGHT_PASTEL_GREEN);
        LIBS.translateY(legLeftBottom.POSITION_MATRIX, -0.18);
        legLeftTop.childs.push(legLeftBottom);
        
        const legRightTopRadius = 0.018;
        const legRightTopHeight = 0.27;
        const legRightTop = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, legRightTopRadius, legRightTopHeight, 30, LIGHT_PASTEL_GREEN);
        LIBS.translateY(legRightTop.POSITION_MATRIX, -0.16);
        LIBS.translateX(legRightTop.POSITION_MATRIX, 0.06);
        this.legRoot.childs.push(legRightTop);
        
        const legRightBottomRadius = 0.1;
        const legRightBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, legRightBottomRadius-0.075, legRightBottomRadius+0.01, legRightBottomRadius-0.075, 30, 30, 360, LIGHT_PASTEL_GREEN);
        LIBS.translateY(legRightBottom.POSITION_MATRIX, -0.18);
        legRightTop.childs.push(legRightBottom);
        
        const ArmLeftTopRadius = 0.016;
        const ArmLeftTopHeight = 0.26;
        const ArmLeftTop = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, ArmLeftTopRadius, ArmLeftTopHeight, 30, WHITE);
        LIBS.rotateZ(ArmLeftTop.POSITION_MATRIX, -Math.PI / 2);
        LIBS.rotateY(ArmLeftTop.POSITION_MATRIX, Math.PI / 5);
        LIBS.rotateX(ArmLeftTop.POSITION_MATRIX, Math.PI / 8);
        LIBS.translateY(ArmLeftTop.POSITION_MATRIX, 0.04);
        LIBS.translateX(ArmLeftTop.POSITION_MATRIX, -0.1);
        LIBS.translateZ(ArmLeftTop.POSITION_MATRIX, 0.07);
        this.body.childs.push(ArmLeftTop);
        
        const ArmLeftBottomRadius = 0.1;
        const ArmLeftBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, ArmLeftBottomRadius-0.075, ArmLeftBottomRadius+0.01, ArmLeftBottomRadius-0.075, 30, 30, 360, WHITE);
        LIBS.translateZ(ArmLeftBottom.POSITION_MATRIX, 0.08);
        LIBS.translateY(ArmLeftBottom.POSITION_MATRIX, -0.08);
        LIBS.rotateX(ArmLeftBottom.POSITION_MATRIX, Math.PI / 3);
        ArmLeftTop.childs.push(ArmLeftBottom);
        
        const ArmRightTopRadius = 0.016;
        const ArmRightTopHeight = 0.26;
        const ArmRightTop = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, ArmRightTopRadius, ArmRightTopHeight, 30, WHITE);
        LIBS.rotateZ(ArmRightTop.POSITION_MATRIX, Math.PI / 2);
        LIBS.rotateY(ArmRightTop.POSITION_MATRIX, -Math.PI / 5);
        LIBS.rotateX(ArmRightTop.POSITION_MATRIX, Math.PI / 8);
        LIBS.translateY(ArmRightTop.POSITION_MATRIX, 0.04);
        LIBS.translateX(ArmRightTop.POSITION_MATRIX, 0.1);
        LIBS.translateZ(ArmRightTop.POSITION_MATRIX, 0.07);
        this.body.childs.push(ArmRightTop);
        
        const ArmRightBottomRadius = 0.1;
        const ArmRightBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, ArmRightBottomRadius-0.075, ArmRightBottomRadius+0.01, ArmRightBottomRadius-0.075, 30, 30, 360, WHITE);
        LIBS.translateZ(ArmRightBottom.POSITION_MATRIX, 0.08);
        LIBS.translateY(ArmRightBottom.POSITION_MATRIX, -0.08);
        LIBS.rotateX(ArmRightBottom.POSITION_MATRIX, Math.PI / 3);
        ArmRightTop.childs.push(ArmRightBottom);

        
        const headRadiusWhite = 0.18;
        this.head = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, headRadiusWhite+0.01, headRadiusWhite, headRadiusWhite+0.03, 30, 30, 360, WHITE);
        const headPositionY = (bodyHeight / 2) + headRadiusWhite-0.05;
        LIBS.translateY(this.head.POSITION_MATRIX, headPositionY);
        this.body.childs.push(this.head);
        
        const headGreen1Radius = 0.198;
        const headGreen1 = new Ellipsoid(
            GL, SHADER_PROGRAM, _position, _Mmatrix,
            headGreen1Radius, headGreen1Radius, headGreen1Radius,
            30, 30, 150, LIGHT_PASTEL_GREEN
        );
        LIBS.translateY(headGreen1.POSITION_MATRIX, 0.01);
        LIBS.rotateZ(headGreen1.POSITION_MATRIX, Math.PI / 2);
        this.head.childs.push(headGreen1);
        
        const headGreen2Radius = 0.2;
        const headGreen2 = new Ellipsoid(
            GL, SHADER_PROGRAM, _position, _Mmatrix,
            headGreen2Radius, headGreen2Radius, headGreen2Radius,
            30, 30, 90, LIGHT_PASTEL_GREEN
        );
        LIBS.translateY(headGreen2.POSITION_MATRIX, 0.01);
        LIBS.translateZ(headGreen2.POSITION_MATRIX, 0.02);
        LIBS.rotateZ(headGreen2.POSITION_MATRIX, Math.PI / 2);
        LIBS.rotateX(headGreen2.POSITION_MATRIX, Math.PI / 4);
        this.head.childs.push(headGreen2);
        
        const headGreen3Radius = 0.2;
        const headGreen3 = new Ellipsoid(
            GL, SHADER_PROGRAM, _position, _Mmatrix,
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
            GL, SHADER_PROGRAM, _position, _Mmatrix,
            headGreen4Radius, headGreen4Radius, headGreen4Radius,
            30, 30, 90, LIGHT_PASTEL_GREEN
        );
        LIBS.translateY(headGreen4.POSITION_MATRIX, 0.01);
        LIBS.translateZ(headGreen4.POSITION_MATRIX, 0.02);
        LIBS.rotateZ(headGreen4.POSITION_MATRIX, Math.PI / 1.57);
        LIBS.rotateX(headGreen4.POSITION_MATRIX, Math.PI / 7);
        this.head.childs.push(headGreen4);
        
        const headRadiusGreen = 0.18;
        const headGreen = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, headRadiusGreen+0.01, headRadiusGreen, headRadiusGreen+0.03, 30, 30, 360, LIGHT_PASTEL_GREEN);
        const headGreenPositionY = (bodyHeight / 2) + headRadiusGreen-0.05;
        LIBS.translateY(headGreen.POSITION_MATRIX, headGreenPositionY);
        LIBS.translateZ(headGreen.POSITION_MATRIX, -0.0001);
        this.body.childs.push(headGreen);

        const eyeRadiusWhite = 0.05;
        const leftEye = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, eyeRadiusWhite+0.02, eyeRadiusWhite+0.03, eyeRadiusWhite, 30, 30, 360, LIGHT_PINK);
        LIBS.translateY(leftEye.POSITION_MATRIX, -0.035);
        LIBS.translateX(leftEye.POSITION_MATRIX, -0.065);
        LIBS.translateZ(leftEye.POSITION_MATRIX, 0.14);
        LIBS.rotateX(leftEye.POSITION_MATRIX, Math.PI / 15);
        LIBS.rotateY(leftEye.POSITION_MATRIX, -Math.PI / 7);
        this.head.childs.push(leftEye);

        const RightEye = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, eyeRadiusWhite+0.02, eyeRadiusWhite+0.03, eyeRadiusWhite, 30, 30, 360, LIGHT_PINK);
        LIBS.translateY(RightEye.POSITION_MATRIX, -0.035);
        LIBS.translateX(RightEye.POSITION_MATRIX, 0.065);
        LIBS.translateZ(RightEye.POSITION_MATRIX, 0.14);
        LIBS.rotateX(RightEye.POSITION_MATRIX, Math.PI / 15);
        LIBS.rotateY(RightEye.POSITION_MATRIX, Math.PI / 7);
        this.head.childs.push(RightEye);


        const pupilRadius = 0.01;
        const leftPupil = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, pupilRadius+0.005, pupilRadius+0.022, pupilRadius, 30, 30, 360, BLACK);
        LIBS.translateY(leftPupil.POSITION_MATRIX, -0.02);
        LIBS.translateZ(leftPupil.POSITION_MATRIX, 0.04);
        LIBS.rotateX(leftPupil.POSITION_MATRIX, Math.PI / 15);
        leftEye.childs.push(leftPupil);

        const rightPupil = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, pupilRadius+0.005, pupilRadius+0.022, pupilRadius, 30, 30, 360, BLACK);
        LIBS.translateY(rightPupil.POSITION_MATRIX, -0.02);
        LIBS.translateZ(rightPupil.POSITION_MATRIX, 0.04);
        LIBS.rotateX(rightPupil.POSITION_MATRIX, Math.PI / 15);
        RightEye.childs.push(rightPupil);
        
        const hairBaseA = 0.15;
        const hairBaseB = 0.25;
        const hairHeight = 0.43;
        const hairDepth = 0.02;
        const hairRight = new Trapezoid(GL, SHADER_PROGRAM, _position, _Mmatrix, hairBaseA, hairBaseB, hairHeight, hairDepth, LIGHT_PASTEL_GREEN);
        LIBS.rotateX(hairRight.POSITION_MATRIX, -Math.PI / 15);
        LIBS.rotateY(hairRight.POSITION_MATRIX, Math.PI / 2);
        LIBS.translateY(hairRight.POSITION_MATRIX, -0.12);
        LIBS.translateX(hairRight.POSITION_MATRIX, 0.215);
        this.head.childs.push(hairRight);
        
        const hairLeft = new Trapezoid(GL, SHADER_PROGRAM, _position, _Mmatrix, hairBaseA, hairBaseB, hairHeight, hairDepth, LIGHT_PASTEL_GREEN);
        LIBS.rotateX(hairLeft.POSITION_MATRIX, Math.PI / 15);
        LIBS.rotateY(hairLeft.POSITION_MATRIX, Math.PI / 2);
        LIBS.translateY(hairLeft.POSITION_MATRIX, -0.12);
        LIBS.translateX(hairLeft.POSITION_MATRIX, -0.215);
        this.head.childs.push(hairLeft);
        
        const trapBaseA = 0.1;
        const trapBaseB = 0.2;
        const trapHeight = 0.38;
        const trapDepth = 0.01;
        const skirtRightMiddle = new Trapezoid(GL, SHADER_PROGRAM, _position, _Mmatrix, trapBaseA, trapBaseB, trapHeight, trapDepth, WHITE);
        LIBS.rotateX(skirtRightMiddle.POSITION_MATRIX, -Math.PI / 4);
        LIBS.rotateY(skirtRightMiddle.POSITION_MATRIX, Math.PI / 2);
        LIBS.translateY(skirtRightMiddle.POSITION_MATRIX, -0.2);
        LIBS.translateX(skirtRightMiddle.POSITION_MATRIX, 0.18);
        this.body.childs.push(skirtRightMiddle);
        
        const trapBaseA1 = 0.1;
        const trapBaseB1 = 0.18;
        const trapHeight1 = 0.38;
        const trapDepth1 = 0.01;
        const skirtRightLeft = new Trapezoid(GL, SHADER_PROGRAM, _position, _Mmatrix, trapBaseA1, trapBaseB1, trapHeight1, trapDepth1, WHITE);
        LIBS.rotateX(skirtRightLeft.POSITION_MATRIX, -Math.PI / 4);
        LIBS.rotateY(skirtRightLeft.POSITION_MATRIX, Math.PI / 4);
        LIBS.translateY(skirtRightLeft.POSITION_MATRIX, -0.18);
        LIBS.translateX(skirtRightLeft.POSITION_MATRIX, 0.1);
        LIBS.translateZ(skirtRightLeft.POSITION_MATRIX, 0.115);
        this.body.childs.push(skirtRightLeft);
        
        const skirtRightRight = new Trapezoid(GL, SHADER_PROGRAM, _position, _Mmatrix, trapBaseA1, trapBaseB1, trapHeight1, trapDepth1, WHITE);
        LIBS.rotateX(skirtRightRight.POSITION_MATRIX, Math.PI / 4);
        LIBS.rotateY(skirtRightRight.POSITION_MATRIX, -Math.PI / 4);
        LIBS.translateY(skirtRightRight.POSITION_MATRIX, -0.18);
        LIBS.translateX(skirtRightRight.POSITION_MATRIX, 0.1);
        LIBS.translateZ(skirtRightRight.POSITION_MATRIX, -0.115);
        this.body.childs.push(skirtRightRight);
        
        const skirtLeftMiddle = new Trapezoid(GL, SHADER_PROGRAM, _position, _Mmatrix, trapBaseA, trapBaseB, trapHeight, trapDepth, WHITE);
        LIBS.rotateX(skirtLeftMiddle.POSITION_MATRIX, Math.PI / 4);
        LIBS.rotateY(skirtLeftMiddle.POSITION_MATRIX, Math.PI / 2);
        LIBS.translateY(skirtLeftMiddle.POSITION_MATRIX, -0.2);
        LIBS.translateX(skirtLeftMiddle.POSITION_MATRIX, -0.18);
        this.body.childs.push(skirtLeftMiddle);
        
        const skirtLeftRight = new Trapezoid(GL, SHADER_PROGRAM, _position, _Mmatrix, trapBaseA1, trapBaseB1, trapHeight1, trapDepth1, WHITE);
        LIBS.rotateX(skirtLeftRight.POSITION_MATRIX, -Math.PI / 4);
        LIBS.rotateY(skirtLeftRight.POSITION_MATRIX, -Math.PI / 4);
        LIBS.translateY(skirtLeftRight.POSITION_MATRIX, -0.18);
        LIBS.translateX(skirtLeftRight.POSITION_MATRIX, -0.1);
        LIBS.translateZ(skirtLeftRight.POSITION_MATRIX, 0.115);
        this.body.childs.push(skirtLeftRight);
        
        const skirtLeftLeft = new Trapezoid(GL, SHADER_PROGRAM, _position, _Mmatrix, trapBaseA1, trapBaseB1, trapHeight1, trapDepth1, WHITE);
        LIBS.rotateX(skirtLeftLeft.POSITION_MATRIX, Math.PI / 4);
        LIBS.rotateY(skirtLeftLeft.POSITION_MATRIX, Math.PI / 4);
        LIBS.translateY(skirtLeftLeft.POSITION_MATRIX, -0.18);
        LIBS.translateX(skirtLeftLeft.POSITION_MATRIX, -0.1);
        LIBS.translateZ(skirtLeftLeft.POSITION_MATRIX, -0.115);
        this.body.childs.push(skirtLeftLeft);
        
        const custom_controlPoints = [ 
            [-0.1, 0.0], [-0.05, 0.3], [0.2, 0.1], [0.0, -0.2]
        ];
        const headHornLeft = new BSplineExtruded(
            GL, SHADER_PROGRAM, _position, _Mmatrix,
            custom_controlPoints, 0.01, 30,  LIGHT_PINK
        );
        LIBS.translateY(headHornLeft.POSITION_MATRIX, 0.4);
        LIBS.translateX(headHornLeft.POSITION_MATRIX, -0.15);
        LIBS.rotateY(headHornLeft.POSITION_MATRIX, -Math.PI / 2.6);
        LIBS.rotateZ(headHornLeft.POSITION_MATRIX, Math.PI / 4);
        LIBS.rotateY(headHornLeft.POSITION_MATRIX, -Math.PI / 6);
        this.body.childs.push(headHornLeft);
        
        const headHornRight = new BSplineExtruded(
            GL, SHADER_PROGRAM, _position, _Mmatrix,
            custom_controlPoints, 0.01, 30, LIGHT_PINK
        );
        LIBS.translateY(headHornRight.POSITION_MATRIX, 0.4);
        LIBS.translateX(headHornRight.POSITION_MATRIX, 0.15);
        LIBS.rotateY(headHornRight.POSITION_MATRIX, -Math.PI / 1.6);
        LIBS.rotateZ(headHornRight.POSITION_MATRIX, -Math.PI / 4);
        LIBS.rotateY(headHornRight.POSITION_MATRIX, Math.PI / 6);
        this.body.childs.push(headHornRight);
        
        // Simpan objek utama (root) ke dalam array
        this.allObjects = [this.bodyGreen, this.legRoot];
    }
    
    // Metode untuk setup semua buffer
    setup() {
        this.allObjects.forEach(obj => obj.setup());
    }
    
    // =======================================================
    // --- FUNGSI ANIMASI PENGENDALI ---
    // =======================================================
    
    /**
     * FUNGSI BARU: Memulai urutan animasi walkFront -> bowing -> walkBack.
     */
    runAnimation() {
        if (this.currentMovementState === MOVEMENT_STATE.IDLE) {
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
            this.currentMovementState = MOVEMENT_STATE.WALK_BACK;
            this.movementStartTime = performance.now();
        }
    }

    // Metode untuk render semua objek
    render(parentMatrix, time) {
        
        let currentBowAngle = 0;
        let targetZ = this.currentZ;
        
        // --- 1. Update Logika Pergerakan/Bowing berdasarkan State Machine ---
        if (this.currentMovementState !== MOVEMENT_STATE.IDLE) {
            const elapsedTime = time - this.movementStartTime;
            
            // Durasi total setiap fase (Animasi + Delay)
            const totalWalkTimeNeeded = this.movementDuration + this.delayDuration; // 2000ms + 1000ms
            const totalBowTimeNeeded = this.bowDuration + this.delayDuration;       // 2000ms + 1000ms
            
            if (this.currentMovementState === MOVEMENT_STATE.BOWING) {
                // Waktu yang dihabiskan HANYA untuk animasi bowing (tanpa delay)
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
                    // Animasi Bowing Selesai. Cek apakah delay sudah terpenuhi.
                    if (elapsedTime >= totalBowTimeNeeded) {
                        // Delay selesai, transisi ke fase berikutnya
                        this.currentMovementState = MOVEMENT_STATE.WALK_BACK;
                        this.movementStartTime = performance.now(); // Reset waktu untuk WALK_BACK
                    }
                    // JIKA delay belum terpenuhi, state tetap BOWING, currentBowAngle=0, menahan posisi.
                }
                
            } else { 
                // Logika WALK_FRONT atau WALK_BACK
                
                // Waktu yang dihabiskan HANYA untuk animasi jalan (tanpa delay)
                const walkElapsedTime = Math.min(elapsedTime, this.movementDuration);
                let progress = walkElapsedTime / this.movementDuration;

                if (walkElapsedTime < this.movementDuration) {
                    // Animasi sedang berjalan
                    if (this.currentMovementState === MOVEMENT_STATE.WALK_FRONT) {
                        targetZ = this.targetZ * progress;
                    } else if (this.currentMovementState === MOVEMENT_STATE.WALK_BACK) {
                        const startZ = this.targetZ; 
                        targetZ = startZ * (1 - progress); 
                    }
                } else {
                    // Animasi Maju/Mundur selesai (Progress >= 1.0). Cek apakah delay sudah terpenuhi.
                    if (elapsedTime >= totalWalkTimeNeeded) {
                        // Delay Selesai, transisi ke fase berikutnya
                        
                        if (this.currentMovementState === MOVEMENT_STATE.WALK_FRONT) {
                            targetZ = this.targetZ; // Tetap di posisi depan
                            // TRANSISI OTOMATIS: Maju -> BOWING
                            this.currentMovementState = MOVEMENT_STATE.BOWING;
                            this.movementStartTime = performance.now(); // Reset waktu untuk BOWING
                            
                        } else if (this.currentMovementState === MOVEMENT_STATE.WALK_BACK) {
                            targetZ = 0.0; // Akhir dari Mundur
                            this.currentMovementState = MOVEMENT_STATE.IDLE;
                        }
                    } else {
                        // Animasi selesai, sedang dalam fase delay. Tahan posisi Z.
                        if (this.currentMovementState === MOVEMENT_STATE.WALK_FRONT) {
                            targetZ = this.targetZ; 
                        } else if (this.currentMovementState === MOVEMENT_STATE.WALK_BACK) {
                            targetZ = 0.0; 
                        }
                    }
                }
            }
        } 
        
        // Catatan: Kondisi transisi Bowing -> WalkBack yang lama di luar if(this.currentMovementState) 
        // sudah dihapus/dipindahkan ke dalam logika BOWING di atas.
        
        this.currentZ = targetZ; // Update posisi Z
        
        // --- 2. Floating Logic ---
        let floatOffsetMatrix = LIBS.get_I4();
        if (this.isFloating) {
            const floatY = Math.sin(time * this.floatSpeed) * this.floatAmplitude;
            LIBS.translateY(floatOffsetMatrix, floatY);
        }

        // --- 3. Gabungkan Global Transform (Z-Move + Floating) ---
        let globalTransformMatrix = LIBS.get_I4();
        
        // Terapkan translasi Z (posisi Kirlia di dunia)
        LIBS.translateZ(globalTransformMatrix, this.currentZ);

        // Gabungkan floating ke matriks global
        globalTransformMatrix = LIBS.multiply(globalTransformMatrix, floatOffsetMatrix);

        // Gabungkan matriks global Kirlia dengan matriks World/View
        const combinedMatrix = LIBS.multiply(parentMatrix, globalTransformMatrix);


        // --- 4. Terapkan Rotasi Bowing pada Body Green (Sub-root) ---
        this.bodyGreen.POSITION_MATRIX = LIBS.get_I4();
        // Terapkan Rotasi Bowing (currentBowAngle)
        LIBS.rotateX(this.bodyGreen.POSITION_MATRIX, currentBowAngle);
        // Terapkan Translasi Y awal
        LIBS.translateY(this.bodyGreen.POSITION_MATRIX, this.bodyGreenInitialY); 
        
        // Render DUA root
        this.allObjects.forEach(obj => obj.render(combinedMatrix));
    }
}