import { Ellipsoid, Cylinder, Cone, EllipticParaboloid, Trapezoid, SurfaceOfRevolution, ExtrudedShape, ModifiedEllipsoid } from "./GalladeObject.js";


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
    
    // Warna-warna
    COLOR_HIJAU = [0.15, 0.6, 0.4];
    COLOR_PUTIH = [0.9, 0.95, 0.95];
    COLOR_MERAH = [0.8, 0.1, 0.2];
    COLOR_CYAN = [0.33, 0.78, 0.77]; // Untuk tanduk di kepala
    COLOR_MATA = [0.9, 0.1, 0.1]; // Mata

    // Simpan objek root untuk setup dan render
    rootObject = null;


    constructor(GL, SHADER_PROGRAM, _position, _MMatrix) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        
        // --- DATA KURVA UNTUK B-SPLINE ---
        // Profil untuk kepala hijau (kurva yang diputar) - (X, Y)
        const curveKepalaHijau = [
            0.0, 0.0, 
            0.3, 0.3,
            0.5, 0.8,
            0.4, 1.2
        ];

        // Profil untuk bagian dada merah (ekstrusi) - (X, Y)
        const curveBadanMerah = [
            0.0, -0.2,   // Bawah
            0.4, -0.1,
            0.4, 0.0,    // Tengah
            0.4, 0.1,
            0.0, 0.2     // Atas
        ];

        const curveCrest = [
            0.0, 0.0,
            0.5, 0.2, // Titik kontrol tengah-bawah yang menarik keluar
            0.5, 0.8, // Titik kontrol tengah-atas yang menarik keluar
            0.0, 1.0  // Titik akhir
        ];
        
        const GLOBAL_SCALE_FACTOR = 0.75; 

        // =============================================================
        //              A. PINGGANG (ROOT)
        // =============================================================
        
        // Pinggang/Pelvis (Ellipsoid putih) sebagai root
        this.pinggang = new Ellipsoid(GL, SHADER_PROGRAM, _position, _MMatrix, 0.3, 0.2, 0.2, 30, 30, this.COLOR_PUTIH);
        this.rootObject = this.pinggang;
        LIBS.scale(this.pinggang.POSITION_MATRIX, GLOBAL_SCALE_FACTOR, GLOBAL_SCALE_FACTOR, GLOBAL_SCALE_FACTOR);
        
        // =============================================================
        //              B. BADAN (Anak dari Pinggang)
        // =============================================================

        // 1. Badan Utama (Cylinder putih)
        this.badanBiru = new Cylinder(GL, SHADER_PROGRAM, _position, _MMatrix, 0.1, 0.75, 30, this.COLOR_PUTIH);
        LIBS.translateY(this.badanBiru.POSITION_MATRIX, 0.3); // Posisikan di atas pinggang

        // 2. Armor Merah (ExtrudedShape) - Diletakkan di depan badan silinder
        this.badanMerah = new ExtrudedShape(GL, SHADER_PROGRAM, _position, _MMatrix, curveBadanMerah, 25, 2, 0.05, this.COLOR_MERAH);
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
        this.kepalaPutih = new Ellipsoid(GL, SHADER_PROGRAM, _position, _MMatrix, 0.23, 0.23, 0.23, 20, 20, this.COLOR_PUTIH);
        LIBS.translateY(this.kepalaPutih.POSITION_MATRIX, 0.5);
        
        // Telinga Kiri (Ellipsoid Oval - Mirip Telinga Bundar Asli Anda)
        this.telingaKiri = new ModifiedEllipsoid(
            this.GL, this.SHADER_PROGRAM, this._position, this._MMatrix, 
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
        this.telingaKiri2 = new ModifiedEllipsoid(
            this.GL, this.SHADER_PROGRAM, this._position, this._MMatrix, 
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
        const headGreen1 = new ModifiedEllipsoid(
            GL, SHADER_PROGRAM, _position, _MMatrix,
            headGreen1Radius, headGreen1Radius, headGreen1Radius,
            30, 30, 150, LIGHT_PASTEL_GREEN
        );
        LIBS.translateY(headGreen1.POSITION_MATRIX, 0.01);
        LIBS.rotateZ(headGreen1.POSITION_MATRIX, Math.PI / 2);
        this.kepalaPutih.childs.push(headGreen1); // Tambahkan ke kepalaPutih

        const headGreen2Radius = 0.23;
        const headGreen2 = new ModifiedEllipsoid(
            GL, SHADER_PROGRAM, _position, _MMatrix,
            headGreen2Radius, headGreen2Radius, headGreen2Radius,
            30, 30, 90, LIGHT_PASTEL_GREEN
        );
        LIBS.translateY(headGreen2.POSITION_MATRIX, 0.01);
        LIBS.translateZ(headGreen2.POSITION_MATRIX, 0.02);
        LIBS.rotateZ(headGreen2.POSITION_MATRIX, Math.PI / 2);
        LIBS.rotateX(headGreen2.POSITION_MATRIX, Math.PI / 4);
        this.kepalaPutih.childs.push(headGreen2); // Tambahkan ke kepalaPutih

        const headGreen3Radius = 0.23;
        const headGreen3 = new ModifiedEllipsoid(
            GL, SHADER_PROGRAM, _position, _MMatrix,
            headGreen3Radius, headGreen3Radius, headGreen3Radius,
            30, 30, 90, LIGHT_PASTEL_GREEN
        );
        LIBS.translateY(headGreen3.POSITION_MATRIX, 0.01);
        LIBS.translateZ(headGreen3.POSITION_MATRIX, 0.02);
        LIBS.rotateZ(headGreen3.POSITION_MATRIX, Math.PI / 2.6);
        LIBS.rotateX(headGreen3.POSITION_MATRIX, Math.PI / 7);
        this.kepalaPutih.childs.push(headGreen3); // Tambahkan ke kepalaPutih

        const headGreen4Radius = 0.23;
        const headGreen4 = new ModifiedEllipsoid(
            GL, SHADER_PROGRAM, _position, _MMatrix,
            headGreen4Radius, headGreen4Radius, headGreen4Radius,
            30, 30, 90, LIGHT_PASTEL_GREEN
        );
        LIBS.translateY(headGreen4.POSITION_MATRIX, 0.01);
        LIBS.translateZ(headGreen4.POSITION_MATRIX, 0.02);
        LIBS.rotateZ(headGreen4.POSITION_MATRIX, Math.PI / 1.57);
        LIBS.rotateX(headGreen4.POSITION_MATRIX, Math.PI / 7);
        this.kepalaPutih.childs.push(headGreen4); // Tambahkan ke kepalaPutih
        
        const headGreen5Radius = HEAD_RADIUS + 0.001; // Sedikit lebih besar dari kepala putih
        this.headGreen5 = new ModifiedEllipsoid(
            GL, SHADER_PROGRAM, _position, _MMatrix,
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
        this.kepalaHijau = new Ellipsoid(GL, SHADER_PROGRAM, _position, _MMatrix, headRadiusGreen+0.04, headRadiusGreen, headRadiusGreen+0.06, 30, 30, LIGHT_PASTEL_GREEN);
        const headGreenPositionY = (bodyHeight / 2) + headRadiusGreen - 0.05;
        LIBS.translateY(this.kepalaHijau.POSITION_MATRIX, headGreenPositionY);
        LIBS.translateZ(this.kepalaHijau.POSITION_MATRIX, -0.0001);
        
        // PENTING: Sambungkan kepalaPutih ke badan, dan kepalaHijau ke badan/pinggang
        this.badanBiru.childs.push(this.kepalaPutih); // Kepala Putih sebagai anak badan
        this.badanBiru.childs.push(this.kepalaHijau);

        // =============================================================
        //              OBJEK PIPI RUNCING (CONE)
        // =============================================================
        const CHEEK_RADIUS = 0.5; // Radius dibuat besar
        const CHEEK_HEIGHT = 1.0; // Tinggi dibuat besar
        const CHEEK_OFFSET_Y = 0.05; // Sedikit lebih tinggi dari pusat kepala
        const CHEEK_OFFSET_X = 0.25; // Lebih jauh ke samping
        const CHEEK_OFFSET_Z = 0.0; // Di tengah Z

        // 1. Pipi Kanan (menonjol ke X positif)
        this.pipiKanan = new Cone(GL, SHADER_PROGRAM, _position, _MMatrix, CHEEK_RADIUS, CHEEK_HEIGHT, 15, this.COLOR_PUTIH);

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
        this.pipiKiri = new Cone(GL, SHADER_PROGRAM, _position, _MMatrix, CHEEK_RADIUS, CHEEK_HEIGHT, 15, this.COLOR_PUTIH);

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
        //              D. LENGAN (Anak dari Badan Utama)
        // =============================================================
        
        const paraboloidScale = 0.5;
        const BAHU_RADIUS = 0.05;
        const BAHU_HEIGHT = 0.05;
        const ARM_START_Y = 0.2;
        const ARM_OFFSET_X = 0.25;
        const BAHU_LENGTH_FACTOR = 7.05;

        this.bahuKiri = new Cylinder(GL, SHADER_PROGRAM, _position, _MMatrix, BAHU_RADIUS, BAHU_HEIGHT, 15, this.COLOR_HIJAU);
        LIBS.scale(this.bahuKiri.POSITION_MATRIX, 1.0, BAHU_LENGTH_FACTOR, 1.0);
        LIBS.translateY(this.bahuKiri.POSITION_MATRIX, ARM_START_Y);
        LIBS.translateX(this.bahuKiri.POSITION_MATRIX, ARM_OFFSET_X);
        LIBS.rotateZ(this.bahuKiri.POSITION_MATRIX, LIBS.degToRad(90)); 
        this.badanBiru.childs.push(this.bahuKiri);
        
        // Lengan Kiri (Elliptic Paraboloid - Pedang)
        this.lenganKiri = new EllipticParaboloid(GL, SHADER_PROGRAM, _position, _MMatrix, 0.3, 0.05, 1.0, 30, 30, this.COLOR_HIJAU);
        LIBS.translateY(this.lenganKiri.POSITION_MATRIX, 0.4);
        LIBS.translateX(this.lenganKiri.POSITION_MATRIX, 0.43);
        LIBS.rotateZ(this.lenganKiri.POSITION_MATRIX, LIBS.degToRad(140)); // Angkat dan putar seperti pose
        LIBS.rotateX(this.lenganKiri.POSITION_MATRIX, LIBS.degToRad(90));
        LIBS.scale(this.lenganKiri.POSITION_MATRIX, paraboloidScale, paraboloidScale, paraboloidScale);
        
        // Bahu Kanan
        this.bahuKanan = new Cylinder(GL, SHADER_PROGRAM, _position, _MMatrix, BAHU_RADIUS, BAHU_HEIGHT, 15, this.COLOR_HIJAU);
        LIBS.scale(this.bahuKanan.POSITION_MATRIX, 1.0, BAHU_LENGTH_FACTOR, 1.0); 
        LIBS.translateY(this.bahuKanan.POSITION_MATRIX, ARM_START_Y);
        LIBS.translateX(this.bahuKanan.POSITION_MATRIX, -ARM_OFFSET_X); 
        LIBS.rotateZ(this.bahuKanan.POSITION_MATRIX, LIBS.degToRad(90)); 

        this.badanBiru.childs.push(this.bahuKanan);

        // Lengan Kanan (Elliptic Paraboloid - Pedang)
        this.lenganKanan = new EllipticParaboloid(GL, SHADER_PROGRAM, _position, _MMatrix, 0.3, 0.05, 1.0, 30, 30, this.COLOR_HIJAU);
        LIBS.translateY(this.lenganKanan.POSITION_MATRIX, 0.4);
        LIBS.translateX(this.lenganKanan.POSITION_MATRIX, -0.43);
        LIBS.rotateZ(this.lenganKanan.POSITION_MATRIX, LIBS.degToRad(40)); // Angkat dan putar
        LIBS.rotateX(this.lenganKanan.POSITION_MATRIX, LIBS.degToRad(90));
        LIBS.scale(this.lenganKanan.POSITION_MATRIX, paraboloidScale, paraboloidScale, paraboloidScale);

        this.badanBiru.childs.push(this.lenganKiri, this.lenganKanan);
        
        // =============================================================
        //              E. KAKI (Anak dari Pinggang)
        // =============================================================

        // Kaki Kiri (Cone - Celana)
        this.kakiKiri = new Cone(GL, SHADER_PROGRAM, _position, _MMatrix, 0.2, 0.4, 0.4, 30, this.COLOR_PUTIH);
        LIBS.translateY(this.kakiKiri.POSITION_MATRIX, -0.4);
        LIBS.translateX(this.kakiKiri.POSITION_MATRIX, 0.1);
        LIBS.scale(this.kakiKiri.POSITION_MATRIX, 0.5, 3, 0.5); 
        
        // Kaki Kanan (Cone - Celana)
        this.kakiKanan = new Cone(GL, SHADER_PROGRAM, _position, _MMatrix, 0.2, 0.4, 0.4, 30, this.COLOR_PUTIH);
        LIBS.translateY(this.kakiKanan.POSITION_MATRIX, -0.4);
        LIBS.translateX(this.kakiKanan.POSITION_MATRIX, -0.1);
        LIBS.scale(this.kakiKanan.POSITION_MATRIX, 0.5, 3, 0.5); 

        this.pinggang.childs.push(this.kakiKiri, this.kakiKanan);
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
}