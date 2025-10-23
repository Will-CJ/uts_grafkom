import { Ellipsoid } from "../object/Ellipsoid.js";
import { Cone } from "../object/Cone.js";
import { Cylinder } from "../object/Cylinder.js";
import { BSplineExtruded } from "../object/BSplineExtruded.js";
import { ModifiedEllipsoid } from "../object/ModifiedEllipsoid.js"

// State untuk mengontrol urutan animasi Ralts
const MOVEMENT_STATE = {
    IDLE: 0,
    WALK_FRONT: 1,
    JUMP_UP: 2,         // Fase melompat ke atas
    HOVER_WAVING: 3,    // Fase melayang 2 detik sambil melambai
    JUMP_DOWN: 4,       // Fase turun (di posisi Z saat ini)
    JUMP_BACK_RIGHT: 5, // Lompat diagonal mundur kanan (Z & X positif)
    JUMP_BACK_LEFT: 6,  // Lompat diagonal mundur kiri (Z & X kembali ke 0)
    DELAY: 7
};

export class Ralts {
    constructor(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal) {
        // --- Setup GL dan Parameter Dasar ---
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._Mmatrix = _Mmatrix;
        this._normal = _normal
        const GL_PARAMS = [this.GL, this.SHADER_PROGRAM, this._position, this._Mmatrix, _normal];
        
        // --- Definisi Warna ---
        const WHITE = [1.0, 1.0, 1.0];
        const LIGHT_PASTEL_GREEN = [0.733, 0.984, 0.741];
        const LIGHT_PINK = [1.0, 0.667, 0.686];
        const PURPLE = [0.627, 0.125, 0.941]; // Warna Orb: Ungu
        const BLACK = [0.0, 0.0, 0.0];

        // --- Variabel State Animasi Pergerakan Z ---
        this.currentMovementState = MOVEMENT_STATE.IDLE;
        this.movementStartTime = 0;
        this.movementDuration = 2000; // 2s untuk berjalan
        this.delayDuration = 1000;    // 1s delay
        this.targetZ = 1.5;           // Jarak maksimum translasi Z
        this.currentZ = 0.0;
        this.currentX = 0.0;
        
        // --- Variabel Animasi Lompat ---
        this.maxJumpHeight = 0.8;    
        this.jumpDuration = 800;     
        this.hoverWavingDuration = 2000; // 2 detik melambai
        this.backJumpDuration = 600;     
        this.backJumpOffset = 0.75;      
        this.maxJumpX = 0.5;             
        this.currentY = 0.0;         
        this.groundY = 0.0;          

        // --- Variabel Orb ---
        this.orbStartTime = 0;
        this.orbDuration = 500; // 0.5 detik
        this.orbBaseScale = 0.2; // Skala Orb saat progress = 0 (0.2 kali ukuran base object)
        this.orbMaxScale = 0.5; // DIUBAH: Delta skala Orb (0.5 kali ukuran base object)
        this.orbMaxDistance = 1.5; // Jarak maju maksimum Orb

        // --- Variabel Idle/Breathing Movement ---
        this.breatheBodyAmplitude = 0.01;
        this.breatheHeadAmplitude = 0.005;
        this.breatheSpeed = 0.005;

        // --- Model Parts Setup (Tidak Berubah) ---
        const bodyRadius = 0.032;
        const bodyHeight = 0.35;
        this.body = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, bodyRadius, bodyHeight, 30, WHITE);

        // ... (Kode model Ralts, dihilangkan untuk fokus pada Orb) ...
        const headGreenRadius = 0.18;
        const headGreen = new Ellipsoid(
            GL, SHADER_PROGRAM, _position, _Mmatrix, _normal,
            0.21, headGreenRadius, headGreenRadius,
            30, 30, 180, LIGHT_PASTEL_GREEN
        );
        LIBS.translateY(headGreen.POSITION_MATRIX, 0.06);
        LIBS.rotateY(headGreen.POSITION_MATRIX, Math.PI / 2);
        LIBS.rotateX(headGreen.POSITION_MATRIX, Math.PI / 2);
        this.body.childs.push(headGreen);

        const headWhiteRadius = 0.14;
        this.head = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, headWhiteRadius, headWhiteRadius, headWhiteRadius, 30, 30, 360, WHITE);
        LIBS.translateY(this.head.POSITION_MATRIX, 0.1);
        this.body.childs.push(this.head);

        const redHornControlPoints = [
            [-0.1, -0.05], 
            [-0.05, 0.0], 
            [0.18, 0.1], 
            [0.0, -0.2]
        ];
        const headHornFront = new BSplineExtruded(
            GL, SHADER_PROGRAM, _position, _Mmatrix, _normal,
            redHornControlPoints, 0.01, 30, LIGHT_PINK
        );
        LIBS.translateY(headHornFront.POSITION_MATRIX, 0.2);
        LIBS.translateZ(headHornFront.POSITION_MATRIX, 0.15);
        LIBS.rotateY(headHornFront.POSITION_MATRIX, Math.PI /2);
        LIBS.rotateX(headHornFront.POSITION_MATRIX, Math.PI/2);
        this.body.childs.push(headHornFront);
        
        const redHornBack = new BSplineExtruded(
            GL, SHADER_PROGRAM, _position, _Mmatrix, _normal,
            redHornControlPoints, 0.01, 30, LIGHT_PINK
        );
        LIBS.translateY(redHornBack.POSITION_MATRIX, 0.23);
        LIBS.translateZ(redHornBack.POSITION_MATRIX, -0.13);
        LIBS.rotateY(redHornBack.POSITION_MATRIX, Math.PI/2);
        LIBS.rotateX(redHornBack.POSITION_MATRIX, -Math.PI/10);
        this.body.childs.push(redHornBack);
        
        // Lengan Kiri (Root untuk Animasi)
        const ArmLeftTopRadius = 0.025;
        const ArmLeftTopHeight = 0.15;
        this.ArmLeftTop = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, ArmLeftTopRadius, ArmLeftTopHeight, 30, WHITE);
        this.ArmLeftTopHeight = ArmLeftTopHeight; // Tinggi untuk pivot
        LIBS.translateY(this.ArmLeftTop.POSITION_MATRIX, -0.09);
        LIBS.translateX(this.ArmLeftTop.POSITION_MATRIX, 0.08);
        LIBS.rotateZ(this.ArmLeftTop.POSITION_MATRIX, Math.PI/4);
        this.body.childs.push(this.ArmLeftTop);
        
        const ArmLeftBottomRadius = 0.025;
        const ArmLeftBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, ArmLeftBottomRadius, ArmLeftBottomRadius, ArmLeftBottomRadius, 30, 30, 360, WHITE);
        LIBS.translateY(ArmLeftBottom.POSITION_MATRIX, -0.08);
        this.ArmLeftTop.childs.push(ArmLeftBottom);
        
        // Lengan Kanan (Root untuk Animasi)
        const ArmRightTopRadius = 0.025;
        const ArmRightTopHeight = 0.2;
        this.ArmRightTop = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, ArmRightTopRadius, ArmRightTopHeight, 30, WHITE);
        this.ArmRightTopHeight = ArmRightTopHeight; // Tinggi untuk pivot
        LIBS.translateY(this.ArmRightTop.POSITION_MATRIX, -0.09);
        LIBS.translateX(this.ArmRightTop.POSITION_MATRIX, -0.08);
        LIBS.rotateZ(this.ArmRightTop.POSITION_MATRIX, -Math.PI/4);
        this.body.childs.push(this.ArmRightTop);
        
        const ArmRightBottomRadius = 0.025;
        const ArmRightBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, ArmRightBottomRadius, ArmRightBottomRadius, ArmRightBottomRadius, 30, 30, 360, WHITE);
        LIBS.translateY(ArmRightBottom.POSITION_MATRIX, -0.1);
        this.ArmRightTop.childs.push(ArmRightBottom);

        
        // Kaki Kiri (Root untuk Animasi)
        const leftLegRadius = 0.11;
        const leftLegHeight = 0.28;
        this.leftLeg = new Cone(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, leftLegRadius-0.05, 0, 360, 0, 0, leftLegHeight-0.01, 30, WHITE);
        this.leftLegHeight = leftLegHeight - 0.01; // Tinggi untuk pivot
        LIBS.translateY(this.leftLeg.POSITION_MATRIX, -0.2);
        LIBS.translateX(this.leftLeg.POSITION_MATRIX, -0.02);
        LIBS.rotateZ(this.leftLeg.POSITION_MATRIX, -Math.PI / 10)
        this.body.childs.push(this.leftLeg);

        // Kaki Kanan (Root untuk Animasi)
        const rightLegRadius = 0.1;
        const rightLegHeight = 0.28;
        this.rightLeg = new Cone(GL, SHADER_PROGRAM, _position, _Mmatrix, _normal, rightLegRadius-0.05, 0, 360, 0, 0, rightLegHeight-0.01, 30, WHITE);
        this.rightLegHeight = rightLegHeight - 0.01; // Tinggi untuk pivot
        LIBS.translateY(this.rightLeg.POSITION_MATRIX, -0.2);
        LIBS.translateX(this.rightLeg.POSITION_MATRIX, 0.02);
        LIBS.rotateZ(this.rightLeg.POSITION_MATRIX, Math.PI / 10)
        this.body.childs.push(this.rightLeg);

        // Mata Kiri (Eye parts)
        this.leftEyeB = new ModifiedEllipsoid(
            ...GL_PARAMS, 0.15, 0.15, 0.15, 30, 30, 360, 25, 90, BLACK
        )
        LIBS.translateZ(this.leftEyeB.POSITION_MATRIX, 0.01)
        LIBS.translateY(this.leftEyeB.POSITION_MATRIX, 0.03)
        LIBS.rotateX(this.leftEyeB.POSITION_MATRIX, LIBS.degToRad(13))
        LIBS.rotateY(this.leftEyeB.POSITION_MATRIX, LIBS.degToRad(-35))
        this.head.childs.push(this.leftEyeB)

        this.leftEyeW = new ModifiedEllipsoid(
            ...GL_PARAMS, 0.15, 0.15, 0.15, 30, 30, 360, 23, 90, WHITE
        )
        LIBS.translateZ(this.leftEyeW.POSITION_MATRIX, 0.00001)
        this.leftEyeB.childs.push(this.leftEyeW)

        this.leftEyeB2 = new ModifiedEllipsoid(
            ...GL_PARAMS, 0.15, 0.15, 0.15, 30, 30, 360, 18, 90, BLACK
        )
        LIBS.translateZ(this.leftEyeB2.POSITION_MATRIX, 0.0001)
        LIBS.rotateX(this.leftEyeB2.POSITION_MATRIX, LIBS.degToRad(4))
        LIBS.rotateY(this.leftEyeB2.POSITION_MATRIX, LIBS.degToRad(4))
        this.leftEyeB.childs.push(this.leftEyeB2)

        this.leftEyeR = new ModifiedEllipsoid(
            ...GL_PARAMS, 0.15, 0.15, 0.15, 30, 30, 360, 16, 90, LIGHT_PINK
        )
        LIBS.translateZ(this.leftEyeR.POSITION_MATRIX, 0.0002)
        LIBS.rotateX(this.leftEyeR.POSITION_MATRIX, LIBS.degToRad(4))
        LIBS.rotateY(this.leftEyeR.POSITION_MATRIX, LIBS.degToRad(4))
        this.leftEyeB.childs.push(this.leftEyeR)

        this.leftEyeB3 = new ModifiedEllipsoid(
            ...GL_PARAMS, 0.15, 0.15, 0.15, 30, 30, 360, 12, 90, BLACK
        )
        LIBS.scale(this.leftEyeB3.POSITION_MATRIX, 0.3, 0.5, 1)
        LIBS.translateZ(this.leftEyeB3.POSITION_MATRIX, 0.003)
        LIBS.rotateX(this.leftEyeB3.POSITION_MATRIX, LIBS.degToRad(5))
        LIBS.rotateY(this.leftEyeB3.POSITION_MATRIX, LIBS.degToRad(5))
        this.leftEyeB.childs.push(this.leftEyeB3)

        // Mata Kanan (Eye parts)
        this.rightEyeB = new ModifiedEllipsoid(
            ...GL_PARAMS, 0.15, 0.15, 0.15, 30, 30, 360, 25, 90, BLACK
        )
        LIBS.translateZ(this.rightEyeB.POSITION_MATRIX, 0.01)
        LIBS.translateY(this.rightEyeB.POSITION_MATRIX, 0.03)
        LIBS.rotateX(this.rightEyeB.POSITION_MATRIX, LIBS.degToRad(13))
        LIBS.rotateY(this.rightEyeB.POSITION_MATRIX, LIBS.degToRad(35))
        this.head.childs.push(this.rightEyeB)

        this.rightEyeW = new ModifiedEllipsoid(
            ...GL_PARAMS, 0.15, 0.15, 0.15, 30, 30, 360, 23, 90, WHITE
        )
        LIBS.translateZ(this.rightEyeW.POSITION_MATRIX, 0.00001)
        this.rightEyeB.childs.push(this.rightEyeW)

        this.rightEyeB2 = new ModifiedEllipsoid(
            ...GL_PARAMS, 0.15, 0.15, 0.15, 30, 30, 360, 18, 90, BLACK
        )
        LIBS.translateZ(this.rightEyeB2.POSITION_MATRIX, 0.0001)
        LIBS.rotateX(this.rightEyeB2.POSITION_MATRIX, LIBS.degToRad(4))
        LIBS.rotateY(this.rightEyeB2.POSITION_MATRIX, LIBS.degToRad(-4))
        this.rightEyeB.childs.push(this.rightEyeB2)

        this.rightEyeR = new ModifiedEllipsoid(
            ...GL_PARAMS, 0.15, 0.15, 0.15, 30, 30, 360, 16, 90, LIGHT_PINK
        )
        LIBS.translateZ(this.rightEyeR.POSITION_MATRIX, 0.0002)
        LIBS.rotateX(this.rightEyeR.POSITION_MATRIX, LIBS.degToRad(4))
        LIBS.rotateY(this.rightEyeR.POSITION_MATRIX, LIBS.degToRad(-4))
        this.rightEyeB.childs.push(this.rightEyeR)

        this.rightEyeB3 = new ModifiedEllipsoid(
            ...GL_PARAMS, 0.15, 0.15, 0.15, 30, 30, 360, 12, 90, BLACK
        )
        LIBS.scale(this.rightEyeB3.POSITION_MATRIX, 0.3, 0.5, 1)
        LIBS.translateZ(this.rightEyeB3.POSITION_MATRIX, 0.003)
        LIBS.rotateX(this.rightEyeB3.POSITION_MATRIX, LIBS.degToRad(5))
        LIBS.rotateY(this.rightEyeB3.POSITION_MATRIX, LIBS.degToRad(-5))
        this.rightEyeB.childs.push(this.rightEyeB3)


        // --- ORB OBJECTS ---
        const orbBaseRadius = 0.05;
        this.orb = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, orbBaseRadius, orbBaseRadius, orbBaseRadius, 15, 15, 360, PURPLE);
        this.orbObjects = [this.orb]; 
        
        // INISIALISASI: Sembunyikan Orb di awal
        LIBS.scale(this.orb.MOVE_MATRIX, 0, 0, 0);


        this.allObjects = [this.body];
    }

    // Metode untuk setup semua buffer
    setup() {
        this.allObjects.forEach(obj => obj.setup());
        this.orbObjects.forEach(obj => obj.setup()); 
    }

    // --- FUNGSI ANIMASI JALAN ---
    applyWalkingAnimation(time, isWaving = false) {
        const speed = 0.015; 
        const sinValue = Math.sin(time * speed);  
        
        // --- ANIMASI LENGAN KIRI (Ayunan X) ---
        const armMaxRot = 20; 
        const dynamicArmRotation = sinValue * armMaxRot; 

        let l_arm_id = LIBS.get_I4();
        LIBS.set_I4(this.ArmLeftTop.MOVE_MATRIX);
        LIBS.translateY(l_arm_id, -this.ArmLeftTopHeight / 2); 
        let l_arm_id2 = LIBS.get_I4();
        LIBS.rotateX(l_arm_id2, LIBS.degToRad(dynamicArmRotation));
        l_arm_id = LIBS.multiply(l_arm_id, l_arm_id2);
        LIBS.translateY(l_arm_id, this.ArmLeftTopHeight / 2); 
        this.ArmLeftTop.MOVE_MATRIX = LIBS.multiply(this.ArmLeftTop.MOVE_MATRIX, l_arm_id);

        // --- ANIMASI LENGAN KANAN (Hanya aktif jika TIDAK melambai) ---
        if (!isWaving) {
            let r_arm_id = LIBS.get_I4();
            LIBS.set_I4(this.ArmRightTop.MOVE_MATRIX);
            LIBS.translateY(r_arm_id, -this.ArmRightTopHeight / 2);
            let r_arm_id2 = LIBS.get_I4();
            LIBS.rotateX(r_arm_id2, LIBS.degToRad(-dynamicArmRotation));
            r_arm_id = LIBS.multiply(r_arm_id, r_arm_id2);
            LIBS.translateY(r_arm_id, this.ArmRightTopHeight / 2);
            this.ArmRightTop.MOVE_MATRIX = LIBS.multiply(this.ArmRightTop.MOVE_MATRIX, r_arm_id);
        }
        
        // --- ANIMASI KAKI ---
        const legMaxRot = 10;
        const dynamicLegRotation = sinValue * legMaxRot;

        let l_leg_id = LIBS.get_I4();
        LIBS.set_I4(this.leftLeg.MOVE_MATRIX);
        LIBS.translateY(l_leg_id, -this.leftLegHeight / 2);
        let l_leg_id2 = LIBS.get_I4();
        LIBS.rotateX(l_leg_id2, LIBS.degToRad(-dynamicLegRotation));
        l_leg_id = LIBS.multiply(l_leg_id, l_leg_id2);
        LIBS.translateY(l_leg_id, this.leftLegHeight / 2);
        this.leftLeg.MOVE_MATRIX = LIBS.multiply(this.leftLeg.MOVE_MATRIX, l_leg_id);

        let r_leg_id = LIBS.get_I4();
        LIBS.set_I4(this.rightLeg.MOVE_MATRIX);
        LIBS.translateY(r_leg_id, -this.rightLegHeight / 2);
        let r_leg_id2 = LIBS.get_I4();
        LIBS.rotateX(r_leg_id2, LIBS.degToRad(dynamicLegRotation));
        r_leg_id = LIBS.multiply(r_leg_id, r_leg_id2);
        LIBS.translateY(r_leg_id, this.rightLegHeight / 2);
        this.rightLeg.MOVE_MATRIX = LIBS.multiply(this.rightLeg.MOVE_MATRIX, r_leg_id);
    }

    // --- FUNGSI ANIMASI MELAMBAI ---
    applyWavingAnimation(time) {
        const waveSpeed = 0.015; 
        const waveMaxRot = 35; 
        const initialOffsetRot = -25; 

        const sinValue = Math.sin(time * waveSpeed);
        const dynamicWavingRotation = -sinValue * waveMaxRot; 
        
        const deltaRotation = LIBS.degToRad(initialOffsetRot + dynamicWavingRotation);

        LIBS.set_I4(this.ArmRightTop.MOVE_MATRIX);
        
        let r_arm_pivot_matrix = LIBS.get_I4();
        LIBS.translateY(r_arm_pivot_matrix, -this.ArmRightTopHeight / 2);
        
        let r_arm_delta_rot_matrix = LIBS.get_I4();
        LIBS.rotateZ(r_arm_delta_rot_matrix, deltaRotation);

        r_arm_pivot_matrix = LIBS.multiply(r_arm_pivot_matrix, r_arm_delta_rot_matrix);
        
        LIBS.translateY(r_arm_pivot_matrix, this.ArmRightTopHeight / 2);

        this.ArmRightTop.MOVE_MATRIX = r_arm_pivot_matrix;
    }
    
    // Mengatur ulang matriks pergerakan ke Matriks Identitas (posisi diam)
    resetAnimation() {
        LIBS.set_I4(this.ArmLeftTop.MOVE_MATRIX);
        LIBS.set_I4(this.ArmRightTop.MOVE_MATRIX);
        LIBS.set_I4(this.leftLeg.MOVE_MATRIX); 
        LIBS.set_I4(this.rightLeg.MOVE_MATRIX); 
    }
    
    // Metode untuk memicu animasi Ralts
    runAnimation() {
        if (this.currentMovementState === MOVEMENT_STATE.IDLE) {
            this.currentMovementState = MOVEMENT_STATE.WALK_FRONT;
            this.movementStartTime = performance.now();
        }
    }
    
    // --- FUNGSI ORB ANIMATION (Diperbarui) ---
    applyOrbAnimation(time) {
        // Orb hanya aktif di fase HOVER_WAVING
        const isActivePhase = (this.currentMovementState === MOVEMENT_STATE.HOVER_WAVING);

        if (!isActivePhase) {
            // Sembunyikan Orb jika Ralts tidak dalam fase Orb
            LIBS.scale(this.orb.MOVE_MATRIX, 0, 0, 0);
            this.orbStartTime = 0;
            return;
        }

        // Tentukan waktu awal Orb
        if (this.orbStartTime === 0) {
             this.orbStartTime = time; 
        }

        const orbElapsedTime = time - this.orbStartTime;

        // Progress animasi maju/scale (0.5 detik). Progress TIDAK di-clamp ke 1.0!
        let progress = orbElapsedTime / this.orbDuration;

        // Hitung scaling dan translation
        // Skala total = Skala Base + (Delta Skala * Progress)
        // Skala total = 0.2 + ((1.0 + 0.5 - 0.2) * progress)
        // Skala akhir: 0.2 + 0.5 = 0.7. Skala Awal: 0.2
        const currentScale = this.orbBaseScale + (this.orbMaxScale * progress); // Skala Maks = 0.2 + 0.5 = 0.7
        const currentZ = this.orbMaxDistance * progress;
        
        // Posisi Y Ralts saat ini (tinggi di udara), ditambah offset agar di atas kepala (misalnya 0.25 di atas currentY)
        const raltsY = this.currentY + 0.25; 
        
        // Orb tunggal ditempatkan di tengah (X=0)
        let O_M = LIBS.get_I4();
        
        // Menerapkan translasi agar Orb muncul di atas kepala (currentX, raltsY, currentZ Ralts)
        LIBS.translateY(O_M, raltsY); 
        LIBS.translateZ(O_M, this.currentZ + currentZ); // Orb maju dari posisi Z Ralts saat ini
        LIBS.translateX(O_M, this.currentX);
        
        LIBS.scale(O_M, currentScale, currentScale, currentScale);
        this.orb.MOVE_MATRIX = O_M;
    }


    /**
     * Metode untuk merender dan mengupdate animasi
     */
    render(parentMatrix, time) {
        
        let targetZ = this.currentZ;
        let targetY = this.currentY;
        let targetX = this.currentX; 
        let shouldAnimateLimbs = false;
        let shouldAnimateWaving = false;

        const PI = Math.PI;

        // --- 1. Logika State Machine Pergerakan Z, Y, dan X ---
        if (this.currentMovementState !== MOVEMENT_STATE.IDLE) {
            const elapsedTime = time - this.movementStartTime;
            const walkDuration = this.movementDuration;
            const backJumpDuration = this.backJumpDuration;
            
            switch(this.currentMovementState) {
                case MOVEMENT_STATE.WALK_FRONT: {
                    const walkElapsedTime = Math.min(elapsedTime, walkDuration);
                    let progress = walkElapsedTime / walkDuration;

                    if (walkElapsedTime < walkDuration) {
                        shouldAnimateLimbs = true;
                        targetZ = this.targetZ * progress;
                    } else {
                        targetZ = this.targetZ; 
                        
                        if (elapsedTime >= (walkDuration + this.delayDuration)) {
                            this.currentMovementState = MOVEMENT_STATE.JUMP_UP;
                            this.movementStartTime = time; 
                        }
                    }
                    break;
                }
                
                case MOVEMENT_STATE.JUMP_UP: {
                    shouldAnimateWaving = true;
                    const jumpElapsedTime = Math.min(elapsedTime, this.jumpDuration);
                    let progress = jumpElapsedTime / this.jumpDuration;

                    targetY = this.maxJumpHeight * Math.sin(progress * PI / 2);
                    
                    if (progress >= 1.0) {
                        targetY = this.maxJumpHeight;
                        this.currentMovementState = MOVEMENT_STATE.HOVER_WAVING;
                        this.movementStartTime = time;
                    }
                    break;
                }

                case MOVEMENT_STATE.HOVER_WAVING: {
                    shouldAnimateWaving = true;
                    targetY = this.maxJumpHeight;
                    targetZ = this.targetZ; 
                    
                    if (elapsedTime >= this.hoverWavingDuration) {
                        this.currentMovementState = MOVEMENT_STATE.JUMP_DOWN; // Lanjut ke fase turun
                        this.movementStartTime = time;
                        shouldAnimateWaving = false;
                    }
                    break;
                }

                case MOVEMENT_STATE.JUMP_DOWN: {
                    // Orb dihilangkan/direset di sini.
                    LIBS.scale(this.orb.MOVE_MATRIX, 0, 0, 0); 
                    this.orbStartTime = 0; 

                    const jumpElapsedTime = Math.min(elapsedTime, this.jumpDuration);
                    let progress = jumpElapsedTime / this.jumpDuration;

                    targetY = this.maxJumpHeight * (1 - Math.sin(progress * PI / 2));
                    targetZ = this.targetZ; // Tetap di Z=1.5
                    
                    if (progress >= 1.0) {
                        targetY = this.groundY;
                        this.currentMovementState = MOVEMENT_STATE.JUMP_BACK_RIGHT;
                        this.movementStartTime = time;
                        this.startZ = this.currentZ; // 1.5
                        this.startX = this.currentX; // 0.0
                    }
                    break;
                }

                case MOVEMENT_STATE.JUMP_BACK_RIGHT: {
                    const jumpElapsedTime = Math.min(elapsedTime, backJumpDuration);
                    let progress = jumpElapsedTime / backJumpDuration;
                    
                    targetY = this.maxJumpHeight * Math.sin(progress * PI);
                    targetZ = this.startZ - (this.backJumpOffset * progress);
                    targetX = this.startX + (this.maxJumpX * progress);

                    if (progress >= 1.0) {
                        targetY = this.groundY;
                        targetZ = this.startZ - this.backJumpOffset; // 0.75
                        targetX = this.startX + this.maxJumpX; // 0.5
                        
                        this.currentMovementState = MOVEMENT_STATE.JUMP_BACK_LEFT;
                        this.movementStartTime = time;
                        this.startZ = targetZ; // 0.75
                        this.startX = targetX; // 0.5
                    }
                    break;
                }

                case MOVEMENT_STATE.JUMP_BACK_LEFT: {
                    const jumpElapsedTime = Math.min(elapsedTime, backJumpDuration);
                    let progress = jumpElapsedTime / backJumpDuration;
                    
                    targetY = this.maxJumpHeight * Math.sin(progress * PI);
                    targetZ = this.startZ - (this.backJumpOffset * progress);
                    targetX = this.startX - (this.maxJumpX * progress);

                    if (progress >= 1.0) {
                        targetY = this.groundY;
                        targetZ = 0.0;
                        targetX = 0.0;
                        
                        this.currentMovementState = MOVEMENT_STATE.IDLE;
                    }
                    break;
                }
            }
        }
        
        this.currentZ = targetZ;
        this.currentY = targetY;
        this.currentX = targetX; 
        
        // --- 2. Logika Idle/Breathing Movement ---
        let idleYOffset = 0.0;
        let idleBodyMatrix = LIBS.get_I4();
        let idleHeadMatrix = LIBS.get_I4();
        
        const sinVal = Math.sin(time * this.breatheSpeed);
        
        const isStationary = this.currentMovementState === MOVEMENT_STATE.IDLE;
        const isHovering = this.currentMovementState === MOVEMENT_STATE.HOVER_WAVING; 
        const isJumping = this.currentMovementState >= MOVEMENT_STATE.JUMP_UP && this.currentMovementState <= MOVEMENT_STATE.JUMP_BACK_LEFT;
        
        if (isStationary || isHovering || isJumping) { 
            idleYOffset = sinVal * this.breatheBodyAmplitude;
            LIBS.translateY(idleBodyMatrix, idleYOffset);
            
            const headYOffset = -sinVal * this.breatheHeadAmplitude;
            LIBS.translateY(idleHeadMatrix, headYOffset);
        } else {
             LIBS.translateY(idleBodyMatrix, 0); 
             LIBS.translateY(idleHeadMatrix, 0); 
        }

        // --- 3. Terapkan Animasi Tangan dan Kaki ---
        if (shouldAnimateLimbs) {
            this.applyWalkingAnimation(time, shouldAnimateWaving); 
        } else {
            this.resetAnimation();
        }
        
        if (shouldAnimateWaving) {
            this.applyWavingAnimation(time);
            
            if (!shouldAnimateLimbs) {
                LIBS.set_I4(this.ArmLeftTop.MOVE_MATRIX);
                LIBS.set_I4(this.leftLeg.MOVE_MATRIX); 
                LIBS.set_I4(this.rightLeg.MOVE_MATRIX); 
            }
        }

        // --- 4. Logika Orb ---
        if (this.currentMovementState === MOVEMENT_STATE.HOVER_WAVING) {
            this.applyOrbAnimation(time);
        } 

        // --- 5. Gabungkan Global Transform (X/Y/Z-Move + Idle Y) ---
        let globalTransformMatrix = LIBS.get_I4();
        
        // Terapkan Translasi Y (Lompatan)
        LIBS.translateY(globalTransformMatrix, this.currentY);
        
        // Terapkan Translasi Z
        LIBS.translateZ(globalTransformMatrix, this.currentZ); 
        
        // Terapkan Translasi X
        LIBS.translateX(globalTransformMatrix, this.currentX);
        
        // Terapkan Idle Y (Translasi Y)
        globalTransformMatrix = LIBS.multiply(globalTransformMatrix, idleBodyMatrix);

        const combinedMatrix = LIBS.multiply(parentMatrix, globalTransformMatrix);

        // --- 6. Terapkan Idle Movement pada Kepala (Child Move Matrix) ---
        LIBS.set_I4(this.head.MOVE_MATRIX); 
        this.head.MOVE_MATRIX = LIBS.multiply(this.head.MOVE_MATRIX, idleHeadMatrix);

        // Render Ralts
        this.allObjects.forEach(obj => obj.render(combinedMatrix));
        
        // Render Orb
        this.orb.render(parentMatrix); 
    }
}