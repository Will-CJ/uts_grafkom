export class Trapezoid {
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

    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, baseA = 1, baseB = 2, height = 1, depth = 1, color = [1.0, 1.0, 1.0]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this.color = color;
        this.POSITION_MATRIX = LIBS.get_I4();
        this.MOVE_MATRIX = LIBS.get_I4();
        this.vertex = [];
        this.faces = [];

        // Define vertices for the top and bottom faces
        const h = height / 2;
        const d = depth / 2;
        const halfBaseA = baseA / 2;
        const halfBaseB = baseB / 2;

        // Top face vertices (z = d)
        this.vertex.push(halfBaseA, h, d);
        this.vertex.push(-halfBaseA, h, d);
        this.vertex.push(-halfBaseB, -h, d);
        this.vertex.push(halfBaseB, -h, d);

        // Bottom face vertices (z = -d)
        this.vertex.push(halfBaseA, h, -d);
        this.vertex.push(-halfBaseA, h, -d);
        this.vertex.push(-halfBaseB, -h, -d);
        this.vertex.push(halfBaseB, -h, -d);
        
        // Define faces
        // Front face (z = d)
        this.faces.push(0, 1, 2);
        this.faces.push(0, 2, 3);
        
        // Back face (z = -d), reversed winding for correct culling
        this.faces.push(4, 6, 5);
        this.faces.push(4, 7, 6);

        // Top face
        this.faces.push(0, 5, 4);
        this.faces.push(0, 1, 5);

        // Right side face
        this.faces.push(0, 3, 7);
        this.faces.push(0, 7, 4);

        // Left side face
        this.faces.push(1, 6, 2);
        this.faces.push(1, 5, 6);

        // Bottom face
        this.faces.push(3, 2, 6);
        this.faces.push(3, 6, 7);
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