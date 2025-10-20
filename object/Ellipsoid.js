export class Ellipsoid {
    GL = null;
    SHADER_PROGRAM = null;
    _position = null;
    _MMatrix = null;
    OBJECT_VERTEX = null;
    OBJECT_FACES = null;
    vertex = [];
    faces = [];
    childs = [];
    color = [1.0, 1.0, 1.0];

    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, a = 1, b = 1, c = 1, uSegments = 30, vSegments = 30, horizontalAngleDeg = 360, color = [1.0, 1.0, 1.0]) { // Added horizontalAngleDeg
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this.color = color;
        this.POSITION_MATRIX = LIBS.get_I4();
        this.MOVE_MATRIX = LIBS.get_I4();
        this.vertex = [];
        this.faces = [];

        // Vertical range for a complete ellipsoid (poles to pole)
        const vStart = -Math.PI / 2;
        const vEnd = Math.PI / 2;

        // Convert horizontal angle from degrees to radians
        const horizontalAngleRad = horizontalAngleDeg * Math.PI / 180;
        const uStart = -horizontalAngleRad / 2; // Start from the center of the slice
        const uEnd = horizontalAngleRad / 2;   // End at the center of the slice

        // Create vertices for the curved surface
        for (let i = 0; i <= vSegments; i++) {
            let v = vStart + (i / vSegments) * (vEnd - vStart);
            for (let j = 0; j <= uSegments; j++) {
                let u = uStart + (j / uSegments) * (uEnd - uStart); // Use limited horizontal angle
                let x = a * Math.cos(v) * Math.cos(u);
                let y = b * Math.cos(v) * Math.sin(u);
                let z = c * Math.sin(v);
                this.vertex.push(x, y, z);
            }
        }

        // Create faces for the curved surface
        for (let i = 0; i < vSegments; i++) {
            for (let j = 0; j < uSegments; j++) {
                let p1 = i * (uSegments + 1) + j;
                let p2 = p1 + (uSegments + 1);
                this.faces.push(p1, p2, p1 + 1);
                this.faces.push(p1 + 1, p2, p2 + 1);
            }
        }

        // Add flat "cut" faces if it's a slice (horizontalAngleDeg < 360)
        if (horizontalAngleDeg < 360) {
            // Face 1 (at u = uStart)
            for (let i = 0; i < vSegments; i++) {
                let p1 = i * (uSegments + 1); // First point in current v-segment
                let p2 = (i + 1) * (uSegments + 1); // First point in next v-segment
                this.faces.push(p1, p2, p1 + uSegments + 1); // This connects p1, p2, and p2's u-neighbor.
                this.faces.push(p1, p2, p1 + uSegments + 1);
                // Corrected for flat face
                 this.faces.push(p1, p2, (i + 1) * (uSegments + 1) + 0);
                 this.faces.push(p1, (i + 1) * (uSegments + 1) + 0, i * (uSegments + 1) + 0);

            }

            // Face 2 (at u = uEnd)
            for (let i = 0; i < vSegments; i++) {
                let p1 = i * (uSegments + 1) + uSegments; // Last point in current v-segment
                let p2 = (i + 1) * (uSegments + 1) + uSegments; // Last point in next v-segment
                this.faces.push(p1, p2, p1 - 1); // This connects p1, p2, and p2's u-neighbor.
                this.faces.push(p1, p2, p1 - 1);
                // Corrected for flat face
                 this.faces.push(p1, i * (uSegments + 1) + uSegments, (i + 1) * (uSegments + 1) + uSegments);
                 this.faces.push(p1, (i + 1) * (uSegments + 1) + uSegments, i * (uSegments + 1) + uSegments);
            }
        }
    }

    setup() {
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertex), this.GL.STATIC_DRAW);
        this.OBJECT_FACES = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces), this.GL.STATIC_DRAW);
        this.childs.forEach(child => child.setup());
    }

    render(PARENT_MATRIX) {
        this.MODEL_MATRIX = LIBS.multiply(this.MOVE_MATRIX, this.POSITION_MATRIX);
        this.MODEL_MATRIX = LIBS.multiply(this.MODEL_MATRIX, PARENT_MATRIX);
        this.GL.useProgram(this.SHADER_PROGRAM);
        this.GL.uniformMatrix4fv(this._MMatrix, false, this.MODEL_MATRIX);
        const _uColor = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uColor");
        this.GL.uniform3fv(_uColor, this.color);
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 0, 0);
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.drawElements(this.GL.TRIANGLES, this.faces.length, this.GL.UNSIGNED_SHORT, 0);
        this.childs.forEach(child => child.render(this.MODEL_MATRIX));
    }
}