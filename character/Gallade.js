import { EllipticParaboloid } from "../object/EllipticParaboloid.js";
import { Ellipsoid } from "../object/Ellipsoid.js";
import { Cone } from "../object/Cone.js";
import { BSplineExtruded } from "../object/BSplineExtruded.js";
import { Cylinder } from "../object/Cylinder.js";

export class Gallade {
    GL = null;
    SHADER_PROGRAM = null;
    _position = null;
    _MMatrix = null;
    MODEL_MATRIX = LIBS.get_I4();

    // Bagian-bagian Gallade
    kepalaHijau = null;
    telingaKiri = null;
    telingaKanan = null;
    kepalaPutih = null;
    badanBiru = null; // Silinder putih di tubuh
    badanMerah = null; // Armor merah di dada
    pinggang = null; // Ellipsoid putih di pinggang (Root)
    lenganKiri = null; // Paraboloid
    lenganKanan = null; // Paraboloid
    kakiKiri = null; // Cone (celana)
    kakiKanan = null; // Cone (celana)
    pipiKanan = null; // Cone
    pipiKiri = null; // Cone
    bahuKiri = null;
    bahuKanan = null;
    kumisKanan = null;
    kumisKiri = null;
    kumisKananBawah = null;
    kumisKiriBawah = null;
    telingaKiri2 = null;
    headGreen5 = null;


    // Warna-warna
    COLOR_HIJAU = [0.15, 0.6, 0.4];
    COLOR_PUTIH = [0.9, 0.95, 0.95];
    COLOR_MERAH = [0.8, 0.1, 0.2];
    COLOR_CYAN = [0.33, 0.78, 0.77]; // Untuk tanduk di kepala
    COLOR_MATA = [0.9, 0.1, 0.1]; // Mata

    // Simpan objek root untuk setup dan render
    rootObject = null;

    // === Logika Patrol & State (Pindahan dari main.js) ===
    WALK_SPEED = 1.0;
    MAX_FORWARD = 0.0;
    MAX_BACKWARD = 2.0;
    ROTATION_DURATION = 1.0;
    DELAY_DURATION = 1.0; // Durasi salto
    SHOWCASE_DURATION = 3.0; // Total durasi (1.0s jongkok, 1.0s salto, 1.0s pose)
    CROUCH_DURATION = 1.0;
    SALTO_DURATION = 1.0;
    POSE_DURATION = 1.0;
    
    // Posisi Dasar (di-set dari main.js)
    baseX = 0.0;
    baseY = 0.0;
    baseZ = 0.0;

    // Variabel State Internal
    patrolZ_offset = 0.0;     // Offset Z relatif dari baseZ
    patrolRotY = 0.0;         // Rotasi Y saat ini
    direction = -1;           // -1 = mundur (+Z), 1 = maju (-Z)
    state = 'WALKING';
    delayStartTime = 0;
    rotationStartTime = 0;
    startRotY = 0;
    targetRotY = 0.0;
    // =======================================

    // Variabel penyimpanan pose awal
    _initial_pinggang = null;
    _initial_bahuKiri = null;
    _initial_bahuKanan = null;
    _initial_lenganKiri = null;
    _initial_lenganKanan = null;
    _initial_kakiKiri = null;
    _initial_kakiKanan = null;

    // Parameter ayunan
    walkPhase = 0;
    walkSpeed = 0.1; 
    MAX_LEG_ANGLE = LIBS.degToRad(25);
    MAX_ARM_ANGLE = LIBS.degToRad(10);


    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, _normal) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this._normal = _normal;
        const LIGHT_PINK = [1.0, 0.467, 0.486];
        const BLACK = [0.0, 0.0, 0.0];
        const eyeRadiusWhite = 0.05;
        
        // --- DATA KURVA UNTUK B-SPLINE ---
        // Profil untuk kepala hijau (kurva yang diputar) - (X, Y)
        const curveKepalaHijau = [
            [0.0, 0.0], 
            [0.3, 0.3],
            [0.5, 0.8],
            [0.4, 1.2]
        ];

        // Profil untuk bagian dada merah (ekstrusi) - (X, Y)
        const curveBadanMerah = [
            [0.0, -0.2],   // Bawah
            [0.4, -0.1],
            [0.4, 0.0],    // Tengah
            [0.4, 0.1],
            [0.0, 0.2]    // Atas
        ];

        const curveCrest = [
            [0.0, 0.0],
            [0.5, 0.2], // Titik kontrol tengah-bawah yang menarik keluar
            [0.5, 0.8], // Titik kontrol tengah-atas yang menarik keluar
            [0.0, 1.0]  // Titik akhir
        ];
        
        const GLOBAL_SCALE_FACTOR = 0.9; 

        // =============================================================
        //              A. PINGGANG (ROOT)
        // =============================================================
        
        // Pinggang/Pelvis (Ellipsoid putih) sebagai root
        this.pinggang = new Ellipsoid(GL, SHADER_PROGRAM, _position, _MMatrix, _normal, 0.3, 0.2, 0.2, 30, 30, 360, this.COLOR_PUTIH);
        this.rootObject = this.pinggang;
        LIBS.translateY(this.pinggang.POSITION_MATRIX, 0.6)
        LIBS.scale(this.pinggang.POSITION_MATRIX, GLOBAL_SCALE_FACTOR, GLOBAL_SCALE_FACTOR, GLOBAL_SCALE_FACTOR);
        
        // =============================================================
        //              B. BADAN (Anak dari Pinggang)
        // =============================================================

        // 1. Badan Utama (Cylinder putih)
        this.badanBiru = new Cylinder(GL, SHADER_PROGRAM, _position, _MMatrix, _normal, 0.15, 0.75, 30, this.COLOR_PUTIH);
        LIBS.translateY(this.badanBiru.POSITION_MATRIX, 0.3); // Posisikan di atas pinggang

        // 2. Armor Merah (ExtrudedShape) - Diletakkan di depan badan silinder
        this.badanMerah = new BSplineExtruded(GL, SHADER_PROGRAM, _position, _MMatrix, _normal, curveBadanMerah, 0.05, 25, this.COLOR_MERAH);
        LIBS.scale(this.badanMerah.POSITION_MATRIX, 0.5, 3.0, 1.0);
        LIBS.translateY(this.badanMerah.POSITION_MATRIX, 0.5);
        LIBS.translateZ(this.badanMerah.POSITION_MATRIX, 0.02);
        LIBS.rotateX(this.badanMerah.POSITION_MATRIX, LIBS.degToRad(90))
        LIBS.rotateZ(this.badanMerah.POSITION_MATRIX, LIBS.degToRad(270))
        
        this.pinggang.childs.push(this.badanBiru, this.badanMerah);

        // =============================================================
        //              C. KEPALA (Anak dari Badan Utama)
        // =============================================================
        
        // Kepala Putih (Ellipsoid) - Basis wajah
        this.kepalaPutih = new Ellipsoid(GL, SHADER_PROGRAM, _position, _MMatrix, _normal, 0.23, 0.23, 0.23, 20, 20, 360, this.COLOR_PUTIH);
        LIBS.translateY(this.kepalaPutih.POSITION_MATRIX, 0.5);

        // 1. Mata Kiri (Bagian Putih/Pink)
        // const eyeRadiusWhite = 0.05; // <-- Dihapus karena sudah dideklarasi di atas
        const leftEye = new Ellipsoid(GL, SHADER_PROGRAM, this._position, this._MMatrix, _normal, eyeRadiusWhite, eyeRadiusWhite+0.03, eyeRadiusWhite, 30, 30, 360, LIGHT_PINK);
        LIBS.translateY(leftEye.POSITION_MATRIX, -0.035); // Posisi Y relatif ke kepalaPutih (0.5)
        LIBS.translateX(leftEye.POSITION_MATRIX, -0.11); // Geser ke kiri
        LIBS.translateZ(leftEye.POSITION_MATRIX, 0.16); // Geser ke depan (Z positif)
        LIBS.rotateX(leftEye.POSITION_MATRIX, Math.PI / 15);
        LIBS.rotateY(leftEye.POSITION_MATRIX, -Math.PI / 7);
        this.kepalaPutih.childs.push(leftEye); // Mata adalah anak dari kepalaPutih

        // 2. Mata Kanan (Bagian Putih/Pink)
        const RightEye = new Ellipsoid(GL, SHADER_PROGRAM, this._position, this._MMatrix, _normal, eyeRadiusWhite, eyeRadiusWhite+0.03, eyeRadiusWhite, 30, 30, 360, LIGHT_PINK);
        LIBS.translateY(RightEye.POSITION_MATRIX, -0.035); // Posisi Y relatif ke kepalaPutih (0.5)
        LIBS.translateX(RightEye.POSITION_MATRIX, 0.11); // Geser ke kanan
        LIBS.translateZ(RightEye.POSITION_MATRIX, 0.16);  // Geser ke depan (Z positif)
        LIBS.rotateX(RightEye.POSITION_MATRIX, Math.PI / 15);
        LIBS.rotateY(RightEye.POSITION_MATRIX, Math.PI / 7);
        this.kepalaPutih.childs.push(RightEye); // Mata adalah anak dari kepalaPutih

        // 3. Pupil Kiri (Anak dari Mata Kiri)
        const pupilRadius = 0.01;
        const leftPupil = new Ellipsoid(GL, SHADER_PROGRAM, this._position, this._MMatrix, _normal, pupilRadius+0.005, pupilRadius+0.022, pupilRadius, 30, 30, 360, BLACK);
        LIBS.translateY(leftPupil.POSITION_MATRIX, -0.02); // Posisi Y relatif ke leftEye
        LIBS.translateZ(leftPupil.POSITION_MATRIX, 0.04); // Posisi Z relatif ke leftEye
        LIBS.rotateX(leftPupil.POSITION_MATRIX, Math.PI / 15);
        leftEye.childs.push(leftPupil); // Pupil adalah anak dari leftEye

        // 4. Pupil Kanan (Anak dari Mata Kanan)
        const rightPupil = new Ellipsoid(GL, SHADER_PROGRAM, this._position, this._MMatrix, _normal, pupilRadius+0.005, pupilRadius+0.022, pupilRadius, 30, 30, 360, BLACK);
        LIBS.translateY(rightPupil.POSITION_MATRIX, -0.02); // Posisi Y relatif ke RightEye
        LIBS.translateZ(rightPupil.POSITION_MATRIX, 0.04); // Posisi Z relatif ke RightEye
        LIBS.rotateX(rightPupil.POSITION_MATRIX, Math.PI / 15);
        RightEye.childs.push(rightPupil); // Pupil adalah anak dari RightEye
        
        // =============================================================
        //              KUMIS (dua duri pipi menghadap depan)
        // =============================================================
        const MUSTACHE_BASE_R = 0.12;   // radius pangkal (sebelum scaling)
        const MUSTACHE_LEN     = 0.275;  // panjang (height) cone
        const MUSTACHE_Y       = 0.075; // sedikit di bawah garis mata
        const MUSTACHE_Z       = -0.05;  // menonjol ke depan
        const MUSTACHE_X_OFF   = 0.225; // offset kiri/kanan dari tengah
        const MUSTACHE_YAW     = LIBS.degToRad(50); // sedikit keluar dari wajah

        // Kanan (di sumbu +X)
        this.kumisKanan = new Cone(
        GL, SHADER_PROGRAM, _position, _MMatrix, _normal,
        MUSTACHE_BASE_R, 0, 360, 0, 0, MUSTACHE_LEN, 30, this.COLOR_PUTIH
        );
        // arahkan ke depan (sumbu Z)
        LIBS.rotateX(this.kumisKanan.POSITION_MATRIX, LIBS.degToRad(300));
        // sedikit yaw keluar
        LIBS.rotateY(this.kumisKanan.POSITION_MATRIX, -MUSTACHE_YAW + LIBS.degToRad(-1));
        // sedikit gepeng (lebih tajam & tipis)
        LIBS.scale(this.kumisKanan.POSITION_MATRIX, 0.05, 1.2, 0.25);
        // posisikan relatif ke kepala putih
        LIBS.translateX(this.kumisKanan.POSITION_MATRIX,  MUSTACHE_X_OFF + 0.035);
        LIBS.translateY(this.kumisKanan.POSITION_MATRIX,  MUSTACHE_Y - 0.02);
        LIBS.translateZ(this.kumisKanan.POSITION_MATRIX,  MUSTACHE_Z + 0.03);

        // Kiri (mirror di sumbu -X)
        this.kumisKiri = new Cone(
        GL, SHADER_PROGRAM, _position, _MMatrix, _normal,
        MUSTACHE_BASE_R, 0, 360, 0, 0, MUSTACHE_LEN, 30, this.COLOR_PUTIH
        );
        LIBS.rotateX(this.kumisKiri.POSITION_MATRIX, LIBS.degToRad(300));
        LIBS.rotateY(this.kumisKiri.POSITION_MATRIX, MUSTACHE_YAW + LIBS.degToRad(-1));
        LIBS.scale(this.kumisKiri.POSITION_MATRIX, 0.05, 1.2, 0.2);
        LIBS.translateX(this.kumisKiri.POSITION_MATRIX,  -MUSTACHE_X_OFF - 0.035);
        LIBS.translateY(this.kumisKiri.POSITION_MATRIX,  MUSTACHE_Y - 0.02);
        LIBS.translateZ(this.kumisKiri.POSITION_MATRIX,  MUSTACHE_Z + 0.045);

        // tempel ke kepala biar ikut gerak
        this.kepalaPutih.childs.push(this.kumisKanan, this.kumisKiri);

        const MUSTACHE_LEN_SMALL = MUSTACHE_LEN * 0.7;      // lebih pendek
        const MUSTACHE_Y_SMALL   = MUSTACHE_Y - 0.22;       // lebih ke bawah
        const MUSTACHE_Z_SMALL   = MUSTACHE_Z + 0.075;      // agak lebih maju
        const MUSTACHE_DOWN_ANGLE = LIBS.degToRad(225);     // arahkan turun

        // Kanan bawah
        this.kumisKananBawah = new Cone(
        GL, SHADER_PROGRAM, _position, _MMatrix, _normal,
        MUSTACHE_BASE_R * 0.65, 0, 360, 0, 0, MUSTACHE_LEN_SMALL, 30, this.COLOR_PUTIH
        );
        LIBS.rotateX(this.kumisKananBawah.POSITION_MATRIX, MUSTACHE_DOWN_ANGLE);
        LIBS.rotateY(this.kumisKananBawah.POSITION_MATRIX, -MUSTACHE_YAW + LIBS.degToRad(-1));
        LIBS.scale(this.kumisKananBawah.POSITION_MATRIX, 0.035, 1.0, 0.18);
        LIBS.translateX(this.kumisKananBawah.POSITION_MATRIX, MUSTACHE_X_OFF + 0.015);
        LIBS.translateY(this.kumisKananBawah.POSITION_MATRIX, MUSTACHE_Y_SMALL);
        LIBS.translateZ(this.kumisKananBawah.POSITION_MATRIX, MUSTACHE_Z_SMALL - 0.022);

        // Kiri bawah
        this.kumisKiriBawah = new Cone(
        GL, SHADER_PROGRAM, _position, _MMatrix, _normal,
        MUSTACHE_BASE_R * 0.65, 0, 360, 0, 0, MUSTACHE_LEN_SMALL, 30, this.COLOR_PUTIH
        );
        LIBS.rotateX(this.kumisKiriBawah.POSITION_MATRIX, MUSTACHE_DOWN_ANGLE);
        LIBS.rotateY(this.kumisKiriBawah.POSITION_MATRIX, MUSTACHE_YAW + LIBS.degToRad(-1));
        LIBS.scale(this.kumisKiriBawah.POSITION_MATRIX, 0.035, 1.0, 0.18);
        LIBS.translateX(this.kumisKiriBawah.POSITION_MATRIX, -MUSTACHE_X_OFF - 0.015);
        LIBS.translateY(this.kumisKiriBawah.POSITION_MATRIX, MUSTACHE_Y_SMALL + 0.01);
        LIBS.translateZ(this.kumisKiriBawah.POSITION_MATRIX, MUSTACHE_Z_SMALL);

        // tempel ke kepala juga
        this.kepalaPutih.childs.push(this.kumisKananBawah, this.kumisKiriBawah);

        // Telinga Kiri (Ellipsoid Oval - Mirip Telinga Bundar Asli Anda)
        this.telingaKiri = new Ellipsoid(
            this.GL, this.SHADER_PROGRAM, this._position, this._MMatrix, _normal, 
            0.0, 0.4, 0.15,
            10, 10, 
            180, 
            this.COLOR_CYAN
        );

        LIBS.scale(this.telingaKiri.POSITION_MATRIX, 0.5, 0.75, 1.5); 
        LIBS.translateY(this.telingaKiri.POSITION_MATRIX, 0.15);
        LIBS.translateX(this.telingaKiri.POSITION_MATRIX, 0.0);
        LIBS.translateZ(this.telingaKiri.POSITION_MATRIX, -0.15);

         // Telinga Kiri (Ellipsoid Oval - Mirip Telinga Bundar Asli Anda)
        this.telingaKiri2 = new Ellipsoid(
            this.GL, this.SHADER_PROGRAM, this._position, this._MMatrix, _normal, 
            0.1, 0.36, 0.15,
            10, 10, 
            330,
            this.COLOR_CYAN
        );

        LIBS.scale(this.telingaKiri2.POSITION_MATRIX, 0.5, 0.9, 1.5); 
        LIBS.translateY(this.telingaKiri2.POSITION_MATRIX, 0.05);
        LIBS.translateX(this.telingaKiri2.POSITION_MATRIX, 0.0);
        LIBS.translateZ(this.telingaKiri2.POSITION_MATRIX, 0.025);
        LIBS.rotateX(this.telingaKiri2.POSITION_MATRIX, Math.PI / 2);

        this.kepalaPutih.childs.push(this.telingaKiri);
        this.kepalaPutih.childs.push(this.telingaKiri2);

        const LIGHT_PASTEL_GREEN = this.COLOR_HIJAU;
        const bodyHeight = 0.75; 
        const HEAD_RADIUS = 0.23;

        const headGreen1Radius = 0.228;
        const headGreen1 = new Ellipsoid(
            GL, SHADER_PROGRAM, _position, _MMatrix, _normal,
            headGreen1Radius, headGreen1Radius, headGreen1Radius,
            30, 30, 150, LIGHT_PASTEL_GREEN
        );
        LIBS.translateY(headGreen1.POSITION_MATRIX, 0.01);
        LIBS.rotateZ(headGreen1.POSITION_MATRIX, Math.PI / 2);
        this.kepalaPutih.childs.push(headGreen1); // Tambahkan ke kepalaPutih

        const headGreen2Radius = 0.23;
        const headGreen2 = new Ellipsoid(
            GL, SHADER_PROGRAM, _position, _MMatrix, _normal,
            headGreen2Radius, headGreen2Radius, headGreen2Radius,
            30, 30, 90, LIGHT_PASTEL_GREEN
        );
        LIBS.translateY(headGreen2.POSITION_MATRIX, 0.01);
        LIBS.translateZ(headGreen2.POSITION_MATRIX, 0.02);
        LIBS.rotateZ(headGreen2.POSITION_MATRIX, Math.PI / 2);
        LIBS.rotateX(headGreen2.POSITION_MATRIX, Math.PI / 4);
        this.kepalaPutih.childs.push(headGreen2); // Tambahkan ke kepalaPutih

        const headGreen3Radius = 0.23;
        const headGreen3 = new Ellipsoid(
            GL, SHADER_PROGRAM, _position, _MMatrix, _normal,
            headGreen3Radius, headGreen3Radius, headGreen3Radius,
            30, 30, 90, LIGHT_PASTEL_GREEN
        );
        LIBS.translateY(headGreen3.POSITION_MATRIX, 0.01);
        LIBS.translateZ(headGreen3.POSITION_MATRIX, 0.02);
        LIBS.rotateZ(headGreen3.POSITION_MATRIX, Math.PI / 2.6);
        LIBS.rotateX(headGreen3.POSITION_MATRIX, Math.PI / 7);
        this.kepalaPutih.childs.push(headGreen3); // Tambahkan ke kepalaPutih

        const headGreen4Radius = 0.23;
        const headGreen4 = new Ellipsoid(
            GL, SHADER_PROGRAM, _position, _MMatrix, _normal,
            headGreen4Radius, headGreen4Radius, headGreen4Radius,
            30, 30, 90, LIGHT_PASTEL_GREEN
        );
        LIBS.translateY(headGreen4.POSITION_MATRIX, 0.01);
        LIBS.translateZ(headGreen4.POSITION_MATRIX, 0.02);
        LIBS.rotateZ(headGreen4.POSITION_MATRIX, Math.PI / 1.57);
        LIBS.rotateX(headGreen4.POSITION_MATRIX, Math.PI / 7);
        this.kepalaPutih.childs.push(headGreen4); // Tambahkan ke kepalaPutih
        
        const headGreen5Radius = HEAD_RADIUS + 0.001; // Sedikit lebih besar dari kepala putih
        this.headGreen5 = new Ellipsoid(
            GL, SHADER_PROGRAM, _position, _MMatrix, _normal,
            headGreen5Radius, headGreen5Radius, headGreen5Radius,
            30, 30, 180, // Dipotong setengah (180 derajat)
            LIGHT_PASTEL_GREEN
        );
        // Geser ke belakang (Z negatif) dan putar agar bagian yang dipotong menghadap depan
        LIBS.translateY(this.headGreen5.POSITION_MATRIX, 0.0); // Posisi Y kepala
        LIBS.rotateY(this.headGreen5.POSITION_MATRIX, 359.75); // Putar 180 derajat pada Y
        LIBS.translateZ(this.headGreen5.POSITION_MATRIX, 0.0005); // Geser maju sedikit setelah rotasi
        this.kepalaPutih.childs.push(this.headGreen5);
        
        // Kepala Hijau Utama/Leher/Penghubung (Tetap)
        const headRadiusGreen = 0.18;
        this.kepalaHijau = new Ellipsoid(GL, SHADER_PROGRAM, _position, _MMatrix, _normal, headRadiusGreen+0.04, headRadiusGreen, headRadiusGreen+0.06, 30, 30, 360, LIGHT_PASTEL_GREEN);
        const headGreenPositionY = (bodyHeight / 2) + headRadiusGreen - 0.05;
        LIBS.translateY(this.kepalaHijau.POSITION_MATRIX, headGreenPositionY);
        LIBS.translateZ(this.kepalaHijau.POSITION_MATRIX, -0.0001);
        
        // PENTING: Sambungkan kepalaPutih ke badan, dan kepalaHijau ke badan/pinggang
        this.badanBiru.childs.push(this.kepalaPutih); // Kepala Putih sebagai anak badan
        this.badanBiru.childs.push(this.kepalaHijau);

        // =============================================================
        //              OBJEK PIPI RUNCING (CONE)
        // =============================================================
        const CHEEK_RADIUS = 0.5; // Radius dibuat besar
        const CHEEK_HEIGHT = 1.0; // Tinggi dibuat besar
        const CHEEK_OFFSET_Y = 0.05; // Sedikit lebih tinggi dari pusat kepala
        const CHEEK_OFFSET_X = 0.25; // Lebih jauh ke samping
        const CHEEK_OFFSET_Z = 0.0; // Di tengah Z

        // 1. Pipi Kanan (menonjol ke X positif)
        this.pipiKanan = new Cone(GL, SHADER_PROGRAM, _position, _MMatrix, _normal, CHEEK_RADIUS, 0, 360, 0, 0, 15, this.COLOR_PUTIH);

        // Menggunakan skala untuk: 
        // X: Membuat panjang (1.0)
        // Y: Membuat sangat tipis/pipih vertikal (0.1)
        // Z: Membuat sangat tipis/pipih horizontal (0.3)
        LIBS.scale(this.pipiKanan.POSITION_MATRIX, 1.0, 0.1, 0.3);

        // Posisikan
        LIBS.translateX(this.pipiKanan.POSITION_MATRIX, CHEEK_OFFSET_X);
        LIBS.translateY(this.pipiKanan.POSITION_MATRIX, CHEEK_OFFSET_Y);
        LIBS.translateZ(this.pipiKanan.POSITION_MATRIX, CHEEK_OFFSET_Z);

        // Rotasi 90 derajat pada sumbu Z agar Cone (yang tadinya vertikal) menunjuk ke KANAN
        LIBS.rotateZ(this.pipiKanan.POSITION_MATRIX, LIBS.degToRad(270)); 


        // 2. Pipi Kiri (menonjol ke X negatif)
        this.pipiKiri = new Cone(GL, SHADER_PROGRAM, _position, _MMatrix, _normal, CHEEK_RADIUS, 0, 360, 0, 0, 15, this.COLOR_PUTIH);

        // Skala yang sama
        LIBS.scale(this.pipiKiri.POSITION_MATRIX, 1.0, 0.1, 0.3);

        // Posisikan (negatif X)
        LIBS.translateX(this.pipiKiri.POSITION_MATRIX, -CHEEK_OFFSET_X);
        LIBS.translateY(this.pipiKiri.POSITION_MATRIX, CHEEK_OFFSET_Y);
        LIBS.translateZ(this.pipiKiri.POSITION_MATRIX, CHEEK_OFFSET_Z);

        // Rotasi 90 derajat pada sumbu Z agar Cone menunjuk ke KIRI
        LIBS.rotateZ(this.pipiKiri.POSITION_MATRIX, LIBS.degToRad(90)); 

        // Tambahkan ke kepala
        this.kepalaPutih.childs.push(this.pipiKanan);
        this.kepalaPutih.childs.push(this.pipiKiri);

        // =============================================================
        //              D. LENGAN (Anak dari Badan Utama)
        // =============================================================
        
        const paraboloidScale = 0.5;
        const BAHU_RADIUS = 0.05;
        const BAHU_HEIGHT = 0.05;
        const ARM_START_Y = 0.2;
        const ARM_OFFSET_X = 0.25;
        const BAHU_LENGTH_FACTOR = 7.05;

        this.bahuKiri = new Cylinder(GL, SHADER_PROGRAM, _position, _MMatrix, _normal, BAHU_RADIUS, BAHU_HEIGHT, 15, this.COLOR_HIJAU);
        LIBS.scale(this.bahuKiri.POSITION_MATRIX, 1.0, BAHU_LENGTH_FACTOR, 1.0);
        LIBS.translateY(this.bahuKiri.POSITION_MATRIX, ARM_START_Y);
        LIBS.translateX(this.bahuKiri.POSITION_MATRIX, ARM_OFFSET_X);
        LIBS.rotateZ(this.bahuKiri.POSITION_MATRIX, LIBS.degToRad(90)); 
        this.badanBiru.childs.push(this.bahuKiri);
        
        // Lengan Kiri (Elliptic Paraboloid - Pedang)
        this.lenganKiri = new EllipticParaboloid(GL, SHADER_PROGRAM, _position, _MMatrix, _normal, 0.3, 0.05, 1.0, 30, 30, this.COLOR_HIJAU);
        LIBS.translateY(this.lenganKiri.POSITION_MATRIX, 0.4);
        LIBS.translateX(this.lenganKiri.POSITION_MATRIX, 0.43);
        LIBS.rotateZ(this.lenganKiri.POSITION_MATRIX, LIBS.degToRad(140)); // Angkat dan putar seperti pose
        LIBS.rotateX(this.lenganKiri.POSITION_MATRIX, LIBS.degToRad(90));
        LIBS.scale(this.lenganKiri.POSITION_MATRIX, paraboloidScale, paraboloidScale, paraboloidScale);
        
        // Bahu Kanan
        this.bahuKanan = new Cylinder(GL, SHADER_PROGRAM, _position, _MMatrix, _normal, BAHU_RADIUS, BAHU_HEIGHT, 15, this.COLOR_HIJAU);
        LIBS.scale(this.bahuKanan.POSITION_MATRIX, 1.0, BAHU_LENGTH_FACTOR, 1.0); 
        LIBS.translateY(this.bahuKanan.POSITION_MATRIX, ARM_START_Y);
        LIBS.translateX(this.bahuKanan.POSITION_MATRIX, -ARM_OFFSET_X); 
        LIBS.rotateZ(this.bahuKanan.POSITION_MATRIX, LIBS.degToRad(90)); 

        this.badanBiru.childs.push(this.bahuKanan);

        // Lengan Kanan (Elliptic Paraboloid - Pedang)
        this.lenganKanan = new EllipticParaboloid(GL, SHADER_PROGRAM, _position, _MMatrix, _normal, 0.3, 0.05, 1.0, 30, 30, this.COLOR_HIJAU);
        LIBS.translateY(this.lenganKanan.POSITION_MATRIX, 0.4);
        LIBS.translateX(this.lenganKanan.POSITION_MATRIX, -0.43);
        LIBS.rotateZ(this.lenganKanan.POSITION_MATRIX, LIBS.degToRad(40)); // Angkat dan putar
        LIBS.rotateX(this.lenganKanan.POSITION_MATRIX, LIBS.degToRad(90));
        LIBS.scale(this.lenganKanan.POSITION_MATRIX, paraboloidScale, paraboloidScale, paraboloidScale);

        this.badanBiru.childs.push(this.lenganKiri, this.lenganKanan);
        
        // =============================================================
        //              E. KAKI (Anak dari Pinggang)
        // =============================================================

        // Kaki Kiri (Cone - Celana)
        this.kakiKiri = new Cone(GL, SHADER_PROGRAM, _position, _MMatrix, _normal, 0.2, 0, 360, 0, 0, 0.4, 30, this.COLOR_PUTIH);
        LIBS.translateY(this.kakiKiri.POSITION_MATRIX, -0.4);
        LIBS.translateX(this.kakiKiri.POSITION_MATRIX, 0.12);
        LIBS.scale(this.kakiKiri.POSITION_MATRIX, 0.5, 3, 0.5); 
        
        // Kaki Kanan (Cone - Celana)
        this.kakiKanan = new Cone(GL, SHADER_PROGRAM, _position, _MMatrix, _normal, 0.2, 0, 360, 0, 0, 0.4, 30, this.COLOR_PUTIH);
        LIBS.translateY(this.kakiKanan.POSITION_MATRIX, -0.4);
        LIBS.translateX(this.kakiKanan.POSITION_MATRIX, -0.12);
        LIBS.scale(this.kakiKanan.POSITION_MATRIX, 0.5, 3, 0.5); 

        this.pinggang.childs.push(this.kakiKiri, this.kakiKanan);

        // Simpan pose awal
        try {
            this._initial_pinggang  = this.pinggang.POSITION_MATRIX.slice(0); 
            this._initial_bahuKiri   = this.bahuKiri.POSITION_MATRIX.slice(0);
            this._initial_bahuKanan  = this.bahuKanan.POSITION_MATRIX.slice(0);
            this._initial_lenganKiri = this.lenganKiri.POSITION_MATRIX.slice(0);
            this._initial_lenganKanan= this.lenganKanan.POSITION_MATRIX.slice(0);
            this._initial_kakiKiri   = this.kakiKiri.POSITION_MATRIX.slice(0);
            this._initial_kakiKanan  = this.kakiKanan.POSITION_MATRIX.slice(0);
        } catch(e) {
            this._initial_pinggang  = new Float32Array(this.pinggang.POSITION_MATRIX);
            this._initial_bahuKiri   = new Float32Array(this.bahuKiri.POSITION_MATRIX);
            this._initial_bahuKanan  = new Float32Array(this.bahuKanan.POSITION_MATRIX);
            this._initial_lenganKiri = new Float32Array(this.lenganKiri.POSITION_MATRIX);
            this._initial_lenganKanan= new Float32Array(this.lenganKanan.POSITION_MATRIX);
            this._initial_kakiKiri   = new Float32Array(this.kakiKiri.POSITION_MATRIX);
            this._initial_kakiKanan  = new Float32Array(this.kakiKanan.POSITION_MATRIX);
        }

        // Inisialisasi state patrol
        this.patrolZ_offset = 0.0;
        this.patrolRotY = 0.0;
        this.direction = -1; // Mulai dengan mundur (+Z)
        this.state = 'WALKING';
    }

    /**
     * Menetapkan posisi dasar (titik tengah patroli) untuk Gallade.
     */
    setBasePosition(x, y, z) {
        this.baseX = x;
        this.baseY = y;
        this.baseZ = z;
        // Z awal patroli adalah 0.0 relatif terhadap baseZ
        this.patrolZ_offset = 0.0; 
    }

    /**
     * Menghitung dan mengembalikan Model Matrix terakhir Gallade
     * berdasarkan posisi dasar dan state patrolinya.
     */
    getModelMatrix() {
        const m = LIBS.get_I4();
        LIBS.translateX(m, this.baseX);
        LIBS.translateY(m, this.baseY);
        // Terapkan offset Z dari patroli
        LIBS.translateZ(m, this.baseZ + this.patrolZ_offset); 
        // Terapkan rotasi Y dari U-turn
        LIBS.rotateY(m, this.patrolRotY);
        return m;
    }

    /**
     * Fungsi update utama untuk Gallade.
     * Mengelola state machine (WALKING, DELAYING, ROTATING).
     * Dipanggil setiap frame dari main.js.
     */
    update(elapsed, globalTime) {
        
        // 1. STATE: WALKING
        if (this.state === 'WALKING') {
            const dz = this.WALK_SPEED * elapsed * -this.direction;
            this.patrolZ_offset += dz;
            this.resetRootPose(); // Pastikan badan tegak
            this.updateWalk();    // Goyang lengan/kaki

            // Cek Batas Depan (MAX_FORWARD)
            if (this.direction === 1 && this.patrolZ_offset <= this.MAX_FORWARD) {
                this.patrolZ_offset = this.MAX_FORWARD;
                this.state = 'DELAYING';
                this.delayStartTime = globalTime;
                this.direction = -1; // Siapkan arah balik
                this.resetArmLegPose();
            }
            // Cek Batas Belakang (MAX_BACKWARD)
            else if (this.direction === -1 && this.patrolZ_offset >= this.MAX_BACKWARD) {
                this.patrolZ_offset = this.MAX_BACKWARD;
                this.state = 'DELAYING';
                this.delayStartTime = globalTime;
                this.direction = 1; // Siapkan arah balik
                this.resetArmLegPose();
            }
        }

        // 2. STATE: DELAYING (Salto)
        else if (this.state === 'DELAYING') {
            this.resetArmLegPose(); // Lengan/kaki diam
            const saltoProgress = Math.min((globalTime - this.delayStartTime) / this.DELAY_DURATION, 1.0);
            this.updateSalto(saltoProgress); // Lakukan salto

            // Cek jika salto/delay selesai
            if (globalTime - this.delayStartTime >= this.DELAY_DURATION) {
                this.state = 'ROTATING';
                this.rotationStartTime = globalTime;
                this.startRotY = this.patrolRotY;
                this.targetRotY = this.startRotY + Math.PI; // Target rotasi 180 derajat
            }
        }

        // 3. STATE: ROTATING (U-Turn)
        else if (this.state === 'ROTATING') {
            this.resetArmLegPose(); // Lengan/kaki diam
            this.resetRootPose();   // Tegakkan badan setelah salto

            // Hitung progres rotasi U-turn
            const t = Math.min((globalTime - this.rotationStartTime) / this.ROTATION_DURATION, 1.0);
            const eased = t * (2 - t); // ease-out
            this.patrolRotY = this.startRotY + eased * (this.targetRotY - this.startRotY);

            // Cek jika rotasi selesai
            if (t >= 1.0) {
                this.state = 'WALKING';
                this.patrolRotY = this.targetRotY; // Kunci rotasi ke target
            }
        }
    }
    
    setup() {
        if (this.rootObject) {
            this.rootObject.setup();
        }
    }
    
    render(PARENT_MATRIX = LIBS.get_I4()) {
        if (this.rootObject) {
            this.rootObject.render(PARENT_MATRIX);
        }
    }

    resetArmLegPose() {
        const copy = (dst, src) => { for (let i=0;i<src.length;i++) dst[i]=src[i]; };

        if (this._initial_bahuKiri)   copy(this.bahuKiri.POSITION_MATRIX,   this._initial_bahuKiri);
        if (this._initial_bahuKanan)  copy(this.bahuKanan.POSITION_MATRIX,  this._initial_bahuKanan);
        if (this._initial_lenganKiri) copy(this.lenganKiri.POSITION_MATRIX, this._initial_lenganKiri);
        if (this._initial_lenganKanan)copy(this.lenganKanan.POSITION_MATRIX,this._initial_lenganKanan);

        if (this._initial_kakiKiri) {
            LIBS.set_I4(this.kakiKiri.POSITION_MATRIX);
            for (let i=0;i<this._initial_kakiKiri.length;i++) {
            this.kakiKiri.POSITION_MATRIX[i] = this._initial_kakiKiri[i];
            }
        }
        if (this._initial_kakiKanan) {
            LIBS.set_I4(this.kakiKanan.POSITION_MATRIX);
            for (let i=0;i<this._initial_kakiKanan.length;i++) {
            this.kakiKanan.POSITION_MATRIX[i] = this._initial_kakiKanan[i];
            }
        }
    }

    /**
     * Mengembalikan root (pinggang) ke rotasi/posisi awalnya.
     */
    resetRootPose() {
        const copy = (dst, src) => { for (let i=0;i<src.length;i++) dst[i]=src[i]; };
        if (this._initial_pinggang) {
            copy(this.pinggang.POSITION_MATRIX, this._initial_pinggang);
        }
    }

    /**
     * Mengaplikasikan rotasi salto (forward flip) ke root (pinggang).
     * @param {number} progress Nilai 0.0 (awal) hingga 1.0 (akhir salto)
     */
    updateSalto(progress) {
        const copy = (dst, src) => { for (let i=0;i<src.length;i++) dst[i]=src[i]; };
        if (!this._initial_pinggang) return;

        // 1. Reset ke pose root awal
        copy(this.pinggang.POSITION_MATRIX, this._initial_pinggang);
        
        // 2. Hitung sudut salto (360 derajat = 2 * PI radian)
        const angle = progress * 2.0 * Math.PI;
        
        // 3. Terapkan rotasi X (salto ke depan)
        LIBS.rotateX(this.pinggang.POSITION_MATRIX, angle);
    }

    updateWalk() {
        const copy = (dst, src) => { for (let i=0;i<src.length;i++) dst[i]=src[i]; };

        this.walkPhase += this.walkSpeed;
        if (this.walkPhase > Math.PI*2) this.walkPhase -= Math.PI*2;

        const legAngle = this.MAX_LEG_ANGLE * Math.sin(this.walkPhase);
        const armAngle = this.MAX_ARM_ANGLE * Math.sin(this.walkPhase);

        // kaki: ayun berlawanan
        if (this._initial_kakiKiri) {
            copy(this.kakiKiri.POSITION_MATRIX, this._initial_kakiKiri);
            LIBS.rotateX(this.kakiKiri.POSITION_MATRIX,  legAngle);
        }
        if (this._initial_kakiKanan) {
            copy(this.kakiKanan.POSITION_MATRIX, this._initial_kakiKanan);
            LIBS.rotateX(this.kakiKanan.POSITION_MATRIX, -legAngle);
        }

        // bahu + lengan: ayun berlawanan dgn kaki
        if (this._initial_bahuKiri) {
            copy(this.bahuKiri.POSITION_MATRIX, this._initial_bahuKiri);
            LIBS.rotateX(this.bahuKiri.POSITION_MATRIX, -armAngle);
        }
        if (this._initial_lenganKiri) {
            copy(this.lenganKiri.POSITION_MATRIX, this._initial_lenganKiri);
            LIBS.rotateX(this.lenganKiri.POSITION_MATRIX, -armAngle);
        }

        if (this._initial_bahuKanan) {
            copy(this.bahuKanan.POSITION_MATRIX, this._initial_bahuKanan);
            LIBS.rotateX(this.bahuKanan.POSITION_MATRIX, armAngle);
        }
        if (this._initial_lenganKanan) {
            copy(this.lenganKanan.POSITION_MATRIX, this._initial_lenganKanan);
            LIBS.rotateX(this.lenganKanan.POSITION_MATRIX, armAngle);
        }
    }
}