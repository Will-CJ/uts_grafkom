import { Ellipsoid } from "../object/Ellipsoid.js";
import { Cone } from "../object/Cone.js";
import { Cylinder } from "../object/Cylinder.js";
import { BSplineExtruded } from "../object/BSplineExtruded.js";
// Buat kelas untuk Pokémon Ralts
export class Ralts {
    constructor(GL, SHADER_PROGRAM, _position, _Mmatrix) {
        // Mendefinisikan warna-warna yang digunakan
        const WHITE = [1.0, 1.0, 1.0];
        const LIGHT_PASTEL_GREEN = [0.733, 0.984, 0.741];
        const LIGHT_PINK = [1.0, 0.667, 0.686];
        const RED = [1.0, 0.0, 0.0];
        const LIGHT_GREY = [0.8, 0.8, 0.8];

        // Badan utama (sebagai root dari hierarki)
        // Gunakan Cylinder untuk badan, sesuai instruksi.
        const bodyRadius = 0.032;
        const bodyHeight = 0.35;
        this.body = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, bodyRadius, bodyHeight, 30, WHITE);

        // Kepala Hijau (Setengah Ellipsoid)
        // Gunakan ModifiedEllipsoid dengan sudut horizontal 180 derajat.
        const headGreenRadius = 0.16;
        const headGreen = new Ellipsoid(
            GL, SHADER_PROGRAM, _position, _Mmatrix,
            0.18, headGreenRadius, headGreenRadius,
            30, 30, 180, LIGHT_PASTEL_GREEN
        );
        LIBS.translateY(headGreen.POSITION_MATRIX, 0.06);
        LIBS.rotateY(headGreen.POSITION_MATRIX, Math.PI / 2);
        LIBS.rotateX(headGreen.POSITION_MATRIX, Math.PI / 2);
        this.body.childs.push(headGreen);

        // Kepala Putih (Ellipsoid)
        const headWhiteRadius = 0.13;
        const headWhite = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, headWhiteRadius, headWhiteRadius, headWhiteRadius, 30, 30, 360, WHITE);
        LIBS.translateY(headWhite.POSITION_MATRIX, 0.1);
        this.body.childs.push(headWhite);

        // Motif Merah (Kurva)
        // Gunakan ExtrudedShape untuk membuat tanduk merah.
        const redHornControlPoints = [
            [-0.1, -0.05], 
            [-0.05, 0.0], 
            [0.18, 0.1], 
            [0.0, -0.2]
        ];
        const headHornFront = new BSplineExtruded(
            GL, SHADER_PROGRAM, _position, _Mmatrix,
            redHornControlPoints, 0.01, 30, RED
        );
        LIBS.translateY(headHornFront.POSITION_MATRIX, 0.2);
        LIBS.translateZ(headHornFront.POSITION_MATRIX, 0.15);
        LIBS.rotateY(headHornFront.POSITION_MATRIX, Math.PI /2);
        LIBS.rotateX(headHornFront.POSITION_MATRIX, Math.PI/2);
        this.body.childs.push(headHornFront);
        
        const redHornBack = new BSplineExtruded(
            GL, SHADER_PROGRAM, _position, _Mmatrix,
            redHornControlPoints, 0.01, 30, RED
        );
        LIBS.translateY(redHornBack.POSITION_MATRIX, 0.23);
        LIBS.translateZ(redHornBack.POSITION_MATRIX, -0.13);
        LIBS.rotateY(redHornBack.POSITION_MATRIX, Math.PI/2);
        LIBS.rotateX(redHornBack.POSITION_MATRIX, -Math.PI/10);
        
        this.body.childs.push(redHornBack);

        // Tangan Kiri
        const ArmLeftBottomRadius = 0.1;
        const ArmLeftBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, ArmLeftBottomRadius-0.075, ArmLeftBottomRadius+0.01, ArmLeftBottomRadius-0.075, 30, 30, 360,WHITE);
        LIBS.translateY(ArmLeftBottom.POSITION_MATRIX, -0.08);
        LIBS.translateX(ArmLeftBottom.POSITION_MATRIX, 0.1);
        LIBS.rotateZ(ArmLeftBottom.POSITION_MATRIX, Math.PI/2);
        this.body.childs.push(ArmLeftBottom);

        // Tangan Kanan
        const ArmRightBottomRadius = 0.1;
        const ArmRightBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, ArmRightBottomRadius-0.075, ArmRightBottomRadius+0.01, ArmRightBottomRadius-0.075, 30, 30, 360, WHITE);
        LIBS.translateY(ArmRightBottom.POSITION_MATRIX, -0.08);
        LIBS.translateX(ArmRightBottom.POSITION_MATRIX, -0.1);
        LIBS.rotateZ(ArmRightBottom.POSITION_MATRIX, -Math.PI/2);
        this.body.childs.push(ArmRightBottom);
        
        // Kaki Kiri (Elliptic Paraboloid)
        const leftLegRadius = 0.1;
        const leftLegHeight = 0.28;
        const leftLeg = new Cone(GL, SHADER_PROGRAM, _position, _Mmatrix, leftLegRadius-0.05, 0, 360, 0, 0, leftLegHeight-0.01, 30, WHITE);
        LIBS.translateY(leftLeg.POSITION_MATRIX, -0.2);
        LIBS.translateX(leftLeg.POSITION_MATRIX, -0.02);
        LIBS.rotateZ(leftLeg.POSITION_MATRIX, -Math.PI / 10)
        this.body.childs.push(leftLeg);

        // Kaki Kanan (Elliptic Paraboloid)
        const rightLegRadius = 0.1;
        const rightLegHeight = 0.28;
        const rightLeg = new Cone(GL, SHADER_PROGRAM, _position, _Mmatrix, rightLegRadius-0.05, 0, 360, 0, 0, rightLegHeight-0.01, 30, WHITE);
        LIBS.translateY(rightLeg.POSITION_MATRIX, -0.2);
        LIBS.translateX(rightLeg.POSITION_MATRIX, 0.02);
        LIBS.rotateZ(rightLeg.POSITION_MATRIX, Math.PI / 10)
        this.body.childs.push(rightLeg);

        // Rok belakang (Surface of Revolution)
        //TO BE ADDED

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