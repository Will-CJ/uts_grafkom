import { Ellipsoid } from "../object/Ellipsoid.js";
import { Cone } from "../object/Cone.js";
import { Cylinder } from "../object/Cylinder.js";
import { BSplineExtruded } from "../object/BSplineExtruded.js";
import { ModifiedEllipsoid } from "../object/ModifiedEllipsoid.js"
// Buat kelas untuk Pokémon Ralts
export class Ralts {
    constructor(GL, SHADER_PROGRAM, _position, _Mmatrix) {
        // --- Menyimpan parameter GL (PENTING untuk mencegah error setup) ---
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._Mmatrix = _Mmatrix;
        const GL_PARAMS = [this.GL, this.SHADER_PROGRAM, this._position, this._Mmatrix];
        
        // Mendefinisikan warna-warna yang digunakan
        const WHITE = [1.0, 1.0, 1.0];
        const LIGHT_PASTEL_GREEN = [0.733, 0.984, 0.741];
        const LIGHT_PINK = [1.0, 0.667, 0.686];
        const RED = [1.0, 0.0, 0.0];
        const LIGHT_GREY = [0.8, 0.8, 0.8];
        const BLACK = [0.0, 0.0, 0.0];

        // Badan utama (sebagai root dari hierarki)
        // Gunakan Cylinder untuk badan, sesuai instruksi.
        const bodyRadius = 0.032;
        const bodyHeight = 0.35;
        this.body = new Cylinder(GL, SHADER_PROGRAM, _position, _Mmatrix, bodyRadius, bodyHeight, 30, WHITE);

        // Kepala Hijau (Setengah Ellipsoid)
        // Gunakan ModifiedEllipsoid dengan sudut horizontal 180 derajat.
        const headGreenRadius = 0.18;
        const headGreen = new Ellipsoid(
            GL, SHADER_PROGRAM, _position, _Mmatrix,
            0.21, headGreenRadius, headGreenRadius,
            30, 30, 180, LIGHT_PASTEL_GREEN
        );
        LIBS.translateY(headGreen.POSITION_MATRIX, 0.06);
        LIBS.rotateY(headGreen.POSITION_MATRIX, Math.PI / 2);
        LIBS.rotateX(headGreen.POSITION_MATRIX, Math.PI / 2);
        this.body.childs.push(headGreen);

        // Kepala Putih (Ellipsoid)
        const headWhiteRadius = 0.14;
        this.head = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, headWhiteRadius, headWhiteRadius, headWhiteRadius, 30, 30, 360, WHITE);
        LIBS.translateY(this.head.POSITION_MATRIX, 0.1);
        this.body.childs.push(this.head);

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
            redHornControlPoints, 0.01, 30, LIGHT_PINK
        );
        LIBS.translateY(headHornFront.POSITION_MATRIX, 0.2);
        LIBS.translateZ(headHornFront.POSITION_MATRIX, 0.15);
        LIBS.rotateY(headHornFront.POSITION_MATRIX, Math.PI /2);
        LIBS.rotateX(headHornFront.POSITION_MATRIX, Math.PI/2);
        this.body.childs.push(headHornFront);
        
        const redHornBack = new BSplineExtruded(
            GL, SHADER_PROGRAM, _position, _Mmatrix,
            redHornControlPoints, 0.01, 30, LIGHT_PINK
        );
        LIBS.translateY(redHornBack.POSITION_MATRIX, 0.23);
        LIBS.translateZ(redHornBack.POSITION_MATRIX, -0.13);
        LIBS.rotateY(redHornBack.POSITION_MATRIX, Math.PI/2);
        LIBS.rotateX(redHornBack.POSITION_MATRIX, -Math.PI/10);
        
        this.body.childs.push(redHornBack);

        // Tangan Kiri
        const ArmLeftBottomRadius = 0.1;
        const ArmLeftBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, ArmLeftBottomRadius-0.075, ArmLeftBottomRadius+0.01, ArmLeftBottomRadius-0.075, 30, 30, 360,WHITE);
        LIBS.translateY(ArmLeftBottom.POSITION_MATRIX, -0.13);
        LIBS.translateX(ArmLeftBottom.POSITION_MATRIX, 0.1);
        LIBS.rotateZ(ArmLeftBottom.POSITION_MATRIX, Math.PI/4);
        this.body.childs.push(ArmLeftBottom);

        // Tangan Kanan
        const ArmRightBottomRadius = 0.1;
        const ArmRightBottom = new Ellipsoid(GL, SHADER_PROGRAM, _position, _Mmatrix, ArmRightBottomRadius-0.075, ArmRightBottomRadius+0.01, ArmRightBottomRadius-0.075, 30, 30, 360, WHITE);
        LIBS.translateY(ArmRightBottom.POSITION_MATRIX, -0.13);
        LIBS.translateX(ArmRightBottom.POSITION_MATRIX, -0.1);
        LIBS.rotateZ(ArmRightBottom.POSITION_MATRIX, -Math.PI/4);
        this.body.childs.push(ArmRightBottom);
        
        // Kaki Kiri (Elliptic Paraboloid)
        const leftLegRadius = 0.11;
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

        //Left Eye
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

        //Right Eye
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