export class Cylinder {
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

    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, radius = 1, height = 2, uSegments = 30, color = [1.0, 1.0, 1.0]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this.color = color;
        this.POSITION_MATRIX = LIBS.get_I4();
        this.MOVE_MATRIX = LIBS.get_I4();
        this.vertex = [];
        this.faces = [];
        const bottomCenterIndex = 0;
        this.vertex.push(0, -height / 2, 0);
        for (let i = 0; i <= uSegments; i++) {
            let u = (i / uSegments) * 2 * Math.PI;
            this.vertex.push(radius * Math.cos(u), -height / 2, radius * Math.sin(u));
        }
        const topCenterIndex = this.vertex.length / 3;
        this.vertex.push(0, height / 2, 0);
        for (let i = 0; i <= uSegments; i++) {
            let u = (i / uSegments) * 2 * Math.PI;
            this.vertex.push(radius * Math.cos(u), height / 2, radius * Math.sin(u));
        }
        const sideStartIndex = this.vertex.length / 3;
        for (let i = 0; i <= uSegments; i++) {
            let u = (i / uSegments) * 2 * Math.PI;
            this.vertex.push(radius * Math.cos(u), -height / 2, radius * Math.sin(u));
            this.vertex.push(radius * Math.cos(u), height / 2, radius * Math.sin(u));
        }
        for (let i = 0; i < uSegments; i++) {
            this.faces.push(bottomCenterIndex, bottomCenterIndex + 1 + i, bottomCenterIndex + 1 + i + 1);
        }
        for (let i = 0; i < uSegments; i++) {
            this.faces.push(topCenterIndex, topCenterIndex + 1 + i + 1, topCenterIndex + 1 + i);
        }
        for (let i = 0; i < uSegments; i++) {
            let p1 = sideStartIndex + (i * 2);
            let p2 = p1 + 1;
            let p3 = sideStartIndex + ((i + 1) * 2);
            let p4 = p3 + 1;
            this.faces.push(p1, p2, p3);
            this.faces.push(p2, p4, p3);
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