// Kirlia.js
import { Ellipsoid, Cylinder, Cone, Trapezoid, SurfaceOfRevolution, ExtrudedShape, ModifiedEllipsoid } from "./KirliaObject.js";

// Buat kelas untuk Pokémon Kirlia
export class Kirlia {
    constructor(GL, SHADER_PROGRAM, _position, _Mmatrix) {
        // Mendefinisikan warna-warna yang digunakan
        const WHITE = [1.0, 1.0, 1.0];
        const LIGHT_PASTEL_GREEN = [0.733, 0.984, 0.741];
        const LIGHT_PINK = [1.0, 0.667, 0.686];
        
        // Membuat semua bagian tubuh Kirlia dan mengaturnya sebagai child dari objek utama
        // Badan utama (sebagai root dari hierarki)
        const bodyRadius = 0.026;
        const bodyHeight = 0.38;
        this.body = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, bodyRadius, bodyHeight, 30, WHITE);
        
        // Badan tengah (kerucut)
        const middleBodyRadius = 0.1;
        const middleBodyHeight = 0.28;
        const middleBody = new Cone(GL, SHADER_PROGRAM, _position, _Mmatrix, middleBodyRadius-0.01, middleBodyRadius-0.01, middleBodyHeight-0.01, 30, WHITE);
        LIBS.translateY(middleBody.POSITION_MATRIX, 0.035);
        this.body.childs.push(middleBody);
        
        // Badan bawah (hijau)
        const bodyGreenRadius = 0.1;
        const bodyGreen = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, bodyGreenRadius-0.01, bodyGreenRadius-0.03, bodyGreenRadius-0.01, 30, 30, LIGHT_PASTEL_GREEN);
        LIBS.translateY(bodyGreen.POSITION_MATRIX, -0.14);
        this.body.childs.push(bodyGreen);
        
        // Kaki Kiri
        const legLeftTopRadius = 0.018;
        const legLeftTopHeight = 0.27;
        const legLeftTop = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, legLeftTopRadius, legLeftTopHeight, 30, LIGHT_PASTEL_GREEN);
        LIBS.translateY(legLeftTop.POSITION_MATRIX, -0.16);
        LIBS.translateX(legLeftTop.POSITION_MATRIX, -0.06);
        bodyGreen.childs.push(legLeftTop);
        
        const legLeftBottomRadius = 0.1;
        const legLeftBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, legLeftBottomRadius-0.075, legLeftBottomRadius+0.01, legLeftBottomRadius-0.075, 30, 30, LIGHT_PASTEL_GREEN);
        LIBS.translateY(legLeftBottom.POSITION_MATRIX, -0.18);
        legLeftTop.childs.push(legLeftBottom);
        
        // Kaki Kanan
        const legRightTopRadius = 0.018;
        const legRightTopHeight = 0.27;
        const legRightTop = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, legRightTopRadius, legRightTopHeight, 30, LIGHT_PASTEL_GREEN);
        LIBS.translateY(legRightTop.POSITION_MATRIX, -0.16);
        LIBS.translateX(legRightTop.POSITION_MATRIX, 0.06);
        bodyGreen.childs.push(legRightTop);
        
        const legRightBottomRadius = 0.1;
        const legRightBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, legRightBottomRadius-0.075, legRightBottomRadius+0.01, legRightBottomRadius-0.075, 30, 30, LIGHT_PASTEL_GREEN);
        LIBS.translateY(legRightBottom.POSITION_MATRIX, -0.18);
        legRightTop.childs.push(legRightBottom);
        
        // Tangan Kiri
        const ArmLeftTopRadius = 0.016;
        const ArmLeftTopHeight = 0.26;
        const ArmLeftTop = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, ArmLeftTopRadius, ArmLeftTopHeight, 30, WHITE);
        LIBS.rotateZ(ArmLeftTop.POSITION_MATRIX, -Math.PI / 2);
        LIBS.translateY(ArmLeftTop.POSITION_MATRIX, 0.07);
        LIBS.translateX(ArmLeftTop.POSITION_MATRIX, -0.15);
        this.body.childs.push(ArmLeftTop);
        
        const ArmLeftBottomRadius = 0.1;
        const ArmLeftBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, ArmLeftBottomRadius-0.075, ArmLeftBottomRadius+0.01, ArmLeftBottomRadius-0.075, 30, 30, WHITE);
        LIBS.translateY(ArmLeftBottom.POSITION_MATRIX, -0.2);
        ArmLeftTop.childs.push(ArmLeftBottom);
        
        // Tangan Kanan
        const ArmRightTopRadius = 0.016;
        const ArmRightTopHeight = 0.26;
        const ArmRightTop = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, ArmRightTopRadius, ArmRightTopHeight, 30, WHITE);
        LIBS.rotateZ(ArmRightTop.POSITION_MATRIX, Math.PI / 2);
        LIBS.translateY(ArmRightTop.POSITION_MATRIX, 0.07);
        LIBS.translateX(ArmRightTop.POSITION_MATRIX, 0.15);
        this.body.childs.push(ArmRightTop);
        
        const ArmRightBottomRadius = 0.1;
        const ArmRightBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, ArmRightBottomRadius-0.075, ArmRightBottomRadius+0.01, ArmRightBottomRadius-0.075, 30, 30, WHITE);
        LIBS.translateY(ArmRightBottom.POSITION_MATRIX, -0.2);
        ArmRightTop.childs.push(ArmRightBottom);
        
        // Kepala Putih
        const headRadiusWhite = 0.18;
        this.head = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, headRadiusWhite+0.01, headRadiusWhite, headRadiusWhite+0.03, 30, 30, WHITE);
        const headPositionY = (bodyHeight / 2) + headRadiusWhite-0.05;
        LIBS.translateY(this.head.POSITION_MATRIX, headPositionY);
        this.body.childs.push(this.head);
        
        // Kepala Hijau
        const headGreen1Radius = 0.198;
        const headGreen1 = new ModifiedEllipsoid(
            GL, SHADER_PROGRAM, _position, _Mmatrix,
            headGreen1Radius, headGreen1Radius, headGreen1Radius,
            30, 30, 150, LIGHT_PASTEL_GREEN
        );
        LIBS.translateY(headGreen1.POSITION_MATRIX, 0.01);
        LIBS.rotateZ(headGreen1.POSITION_MATRIX, Math.PI / 2);
        this.head.childs.push(headGreen1);
        
        const headGreen2Radius = 0.2;
        const headGreen2 = new ModifiedEllipsoid(
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
        const headGreen3 = new ModifiedEllipsoid(
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
        const headGreen4 = new ModifiedEllipsoid(
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
        const headGreen = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, headRadiusGreen+0.01, headRadiusGreen, headRadiusGreen+0.03, 30, 30, LIGHT_PASTEL_GREEN);
        const headGreenPositionY = (bodyHeight / 2) + headRadiusGreen-0.05;
        LIBS.translateY(headGreen.POSITION_MATRIX, headGreenPositionY);
        LIBS.translateZ(headGreen.POSITION_MATRIX, -0.0001);
        this.body.childs.push(headGreen);
        
        // Rambut kanan
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
        
        // Rambut kiri
        const hairLeft = new Trapezoid(GL, SHADER_PROGRAM, _position, _Mmatrix, hairBaseA, hairBaseB, hairHeight, hairDepth, LIGHT_PASTEL_GREEN);
        LIBS.rotateX(hairLeft.POSITION_MATRIX, Math.PI / 15);
        LIBS.rotateY(hairLeft.POSITION_MATRIX, Math.PI / 2);
        LIBS.translateY(hairLeft.POSITION_MATRIX, -0.12);
        LIBS.translateX(hairLeft.POSITION_MATRIX, -0.215);
        this.head.childs.push(hairLeft);
        
        // Rok kanan tengah
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
        
        // Rok kanan kiri
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
        
        // Rok kanan kanan
        const skirtRightRight = new Trapezoid(GL, SHADER_PROGRAM, _position, _Mmatrix, trapBaseA1, trapBaseB1, trapHeight1, trapDepth1, WHITE);
        LIBS.rotateX(skirtRightRight.POSITION_MATRIX, Math.PI / 4);
        LIBS.rotateY(skirtRightRight.POSITION_MATRIX, -Math.PI / 4);
        LIBS.translateY(skirtRightRight.POSITION_MATRIX, -0.18);
        LIBS.translateX(skirtRightRight.POSITION_MATRIX, 0.1);
        LIBS.translateZ(skirtRightRight.POSITION_MATRIX, -0.115);
        this.body.childs.push(skirtRightRight);
        
        // Rok kiri tengah
        const skirtLeftMiddle = new Trapezoid(GL, SHADER_PROGRAM, _position, _Mmatrix, trapBaseA, trapBaseB, trapHeight, trapDepth, WHITE);
        LIBS.rotateX(skirtLeftMiddle.POSITION_MATRIX, Math.PI / 4);
        LIBS.rotateY(skirtLeftMiddle.POSITION_MATRIX, Math.PI / 2);
        LIBS.translateY(skirtLeftMiddle.POSITION_MATRIX, -0.2);
        LIBS.translateX(skirtLeftMiddle.POSITION_MATRIX, -0.18);
        this.body.childs.push(skirtLeftMiddle);
        
        // Rok kiri kanan
        const skirtLeftRight = new Trapezoid(GL, SHADER_PROGRAM, _position, _Mmatrix, trapBaseA1, trapBaseB1, trapHeight1, trapDepth1, WHITE);
        LIBS.rotateX(skirtLeftRight.POSITION_MATRIX, -Math.PI / 4);
        LIBS.rotateY(skirtLeftRight.POSITION_MATRIX, -Math.PI / 4);
        LIBS.translateY(skirtLeftRight.POSITION_MATRIX, -0.18);
        LIBS.translateX(skirtLeftRight.POSITION_MATRIX, -0.1);
        LIBS.translateZ(skirtLeftRight.POSITION_MATRIX, 0.115);
        this.body.childs.push(skirtLeftRight);
        
        // Rok kiri kiri
        const skirtLeftLeft = new Trapezoid(GL, SHADER_PROGRAM, _position, _Mmatrix, trapBaseA1, trapBaseB1, trapHeight1, trapDepth1, WHITE);
        LIBS.rotateX(skirtLeftLeft.POSITION_MATRIX, Math.PI / 4);
        LIBS.rotateY(skirtLeftLeft.POSITION_MATRIX, Math.PI / 4);
        LIBS.translateY(skirtLeftLeft.POSITION_MATRIX, -0.18);
        LIBS.translateX(skirtLeftLeft.POSITION_MATRIX, -0.1);
        LIBS.translateZ(skirtLeftLeft.POSITION_MATRIX, -0.115);
        this.body.childs.push(skirtLeftLeft);
        
        // Tanduk kepala (kiri)
        const custom_controlPoints = [ -0.1, 0.0, -0.05, 0.3, 0.2, 0.1, 0.0, -0.2 ];
        const headHornLeft = new ExtrudedShape(
            GL, SHADER_PROGRAM, _position, _Mmatrix,
            custom_controlPoints, 30, 2, 0.01, LIGHT_PINK
        );
        LIBS.translateY(headHornLeft.POSITION_MATRIX, 0.4);
        LIBS.translateX(headHornLeft.POSITION_MATRIX, -0.15);
        LIBS.rotateY(headHornLeft.POSITION_MATRIX, -Math.PI / 2.6);
        LIBS.rotateZ(headHornLeft.POSITION_MATRIX, Math.PI / 4);
        LIBS.rotateY(headHornLeft.POSITION_MATRIX, -Math.PI / 6);
        this.body.childs.push(headHornLeft);
        
        // Tanduk kepala (kanan)
        const headHornRight = new ExtrudedShape(
            GL, SHADER_PROGRAM, _position, _Mmatrix,
            custom_controlPoints, 30, 2, 0.01, LIGHT_PINK
        );
        LIBS.translateY(headHornRight.POSITION_MATRIX, 0.4);
        LIBS.translateX(headHornRight.POSITION_MATRIX, 0.15);
        LIBS.rotateY(headHornRight.POSITION_MATRIX, -Math.PI / 1.6);
        LIBS.rotateZ(headHornRight.POSITION_MATRIX, -Math.PI / 4);
        LIBS.rotateY(headHornRight.POSITION_MATRIX, Math.PI / 6);
        this.body.childs.push(headHornRight);
        
        // Simpan objek utama (root) ke dalam array
        this.allObjects = [this.body];
    }
    
    // Metode untuk setup semua buffer
    setup() {
        this.allObjects.forEach(obj => obj.setup());
    }
    
    // Metode untuk render semua objek
    render(parentMatrix) {
        this.allObjects.forEach(obj => obj.render(parentMatrix));
    }
}