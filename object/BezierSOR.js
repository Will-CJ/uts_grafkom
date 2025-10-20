const VERTICAL_SEGMENTS = 32;
const RADIAL_SEGMENTS = 32;

function getBezierPoint(t, p) {
    let t2 = t * t;
    let t3 = t2 * t;
    let mt = 1.0 - t;
    let mt2 = mt * mt;
    let mt3 = mt2 * mt;

    let x = mt3 * p[0][0] + 3.0 * mt2 * t * p[1][0] + 3.0 * mt * t2 * p[2][0] + t3 * p[3][0];
    let y = mt3 * p[0][1] + 3.0 * mt2 * t * p[1][1] + 3.0 * mt * t2 * p[2][1] + t3 * p[3][1];

    return [x, y];
}

function generateBezierSORMesh(profilePoints) {
    let vertices = [];
    let normals = [];
    let indices = [];

    for (let j = 0; j <= RADIAL_SEGMENTS; j++) {
        let angle = j * 2.0 * Math.PI / RADIAL_SEGMENTS;
        let cosA = Math.cos(angle);
        let sinA = Math.sin(angle);

        for (let i = 0; i <= VERTICAL_SEGMENTS; i++) {
            let t = i / VERTICAL_SEGMENTS;
            let point = getBezierPoint(t, profilePoints);
            let radius = point[0]; 
            let y = point[1];      

            vertices.push(radius * cosA, y, radius * sinA);
            
            let len = Math.sqrt(radius * radius);
            if (len > 0) {
                normals.push(radius * cosA / len, 0, radius * sinA / len); 
            } else {
                normals.push(0, 1, 0); 
            }
        }
    }

    for (let j = 0; j < RADIAL_SEGMENTS; j++) {
        for (let i = 0; i < VERTICAL_SEGMENTS; i++) {
            let p1 = i * (RADIAL_SEGMENTS + 1) + j;
            let p2 = (i + 1) * (RADIAL_SEGMENTS + 1) + j;
            let p3 = i * (RADIAL_SEGMENTS + 1) + j + 1;
            let p4 = (i + 1) * (RADIAL_SEGMENTS + 1) + j + 1;

            indices.push(p1, p2, p3);
            indices.push(p3, p2, p4);
        }
    }

    return { vertices, normals, indices, numIndices: indices.length };
}

export class BezierSOR {
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
    MOVE_MATRIX = LIBS.get_I4();    
    POSITION_MATRIX = LIBS.get_I4();

    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, profilePoints, color = [1.0, 1.0, 1.0]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this.profilePoints = profilePoints;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this.color = color;

        // Generate Mesh
        const meshData = generateBezierSORMesh(this.profilePoints);
        this.vertex = meshData.vertices;
        this.faces = meshData.indices;
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