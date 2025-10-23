const VERTICAL_SEGMENTS = 32;
const RADIAL_SEGMENTS = 32;

function getBezierTangent(t, p) {
    let t2 = t * t;
    let mt = 1.0 - t;
    let mt2 = mt * mt;

    // Derivative formula for cubic Bezier:
    // P'(t) = 3(1-t)^2(P1-P0) + 6(1-t)t(P2-P1) + 3t^2(P3-P2)

    let c0x = 3.0 * (p[1][0] - p[0][0]);
    let c1x = 6.0 * (p[2][0] - p[1][0]);
    let c2x = 3.0 * (p[3][0] - p[2][0]);

    let c0y = 3.0 * (p[1][1] - p[0][1]);
    let c1y = 6.0 * (p[2][1] - p[1][1]);
    let c2y = 3.0 * (p[3][1] - p[2][1]);

    let tx = mt2 * c0x + mt * t * c1x + t2 * c2x; // This is radius'(t)
    let ty = mt2 * c0y + mt * t * c1y + t2 * c2y; // This is y'(t)

    return [tx, ty];
}

function getBezierTangent(t, p) {
    let t2 = t * t;
    let mt = 1.0 - t;
    let mt2 = mt * mt;

    // Derivative formula for cubic Bezier:
    // P'(t) = 3(1-t)^2(P1-P0) + 6(1-t)t(P2-P1) + 3t^2(P3-P2)

    let c0x = 3.0 * (p[1][0] - p[0][0]);
    let c1x = 6.0 * (p[2][0] - p[1][0]);
    let c2x = 3.0 * (p[3][0] - p[2][0]);

    let c0y = 3.0 * (p[1][1] - p[0][1]);
    let c1y = 6.0 * (p[2][1] - p[1][1]);
    let c2y = 3.0 * (p[3][1] - p[2][1]);

    let tx = mt2 * c0x + mt * t * c1x + t2 * c2x; // This is radius'(t)
    let ty = mt2 * c0y + mt * t * c1y + t2 * c2y; // This is y'(t)

    return [tx, ty];
}

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
    let vertexData = []; // Interleaved: [x,y,z, nx,ny,nz, ...]
    let indices = [];

    for (let j = 0; j <= RADIAL_SEGMENTS; j++) {
        let angle = j * 2.0 * Math.PI / RADIAL_SEGMENTS;
        let cosA = Math.cos(angle);
        let sinA = Math.sin(angle);

        for (let i = 0; i <= VERTICAL_SEGMENTS; i++) {
            let t = i / VERTICAL_SEGMENTS;

            // --- Position ---
            let point = getBezierPoint(t, profilePoints);
            let radius = point[0];
            let y = point[1];
            let x = radius * cosA;
            let z = radius * sinA;
            vertexData.push(x, y, z);

            // --- Normal ---
            let tangent = getBezierTangent(t, profilePoints); // [radius'(t), y'(t)]
            let r_prime = tangent[0];
            let y_prime = tangent[1];

            // 2D Normal (perpendicular to tangent, pointing outward)
            let n2D_x = y_prime;
            let n2D_y = -r_prime;

            // Rotate 2D Normal around Y-axis
            let nx = n2D_x * cosA;
            let ny = n2D_y;
            let nz = n2D_x * sinA;

            // Normalize the 3D Normal
            const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
            if (len > 0) {
                nx /= len;
                ny /= len;
                nz /= len;
            } else {
                // Handle potential zero tangent (e.g., at cusp) or zero normal
                // Default might depend on context, e.g., pointing straight out radially or vertically
                if (Math.abs(radius) < 0.0001) { // If at the Y-axis
                   nx = 0; ny = (y_prime > 0 ? 1 : -1); nz = 0; // Point up/down along tangent
                } else { // Point radially outward if tangent is zero
                   nx = cosA; ny = 0; nz = sinA;
                }
            }
            vertexData.push(nx, ny, nz);
        }
    }

    // --- Indices --- (Logic is slightly off, needs correction)
    for (let j = 0; j < RADIAL_SEGMENTS; j++) {
        for (let i = 0; i < VERTICAL_SEGMENTS; i++) {
            // Calculate indices based on the vertex structure (verts per radial segment = VERTICAL_SEGMENTS + 1)
            const vertsPerRing = VERTICAL_SEGMENTS + 1;
            let p1 = j * vertsPerRing + i;         // Current point
            let p2 = j * vertsPerRing + (i + 1);     // Point below current
            let p3 = (j + 1) * vertsPerRing + i;     // Next point same level
            let p4 = (j + 1) * vertsPerRing + (i + 1); // Next point below

            // Triangle 1: p1, p2, p3
            indices.push(p1, p2, p3);
            // Triangle 2: p3, p2, p4
            indices.push(p3, p2, p4);
        }
    }

    return { vertexData, indices, numIndices: indices.length };
}

export class BezierSOR {
    GL = null;
    SHADER_PROGRAM = null;
    _position = null;
    _MMatrix = null;
    _normal = null; // <-- ADDED: Store normal attribute location
    OBJECT_VERTEX = null;
    OBJECT_FACES = null;
    vertexData = []; // <-- CHANGED: Combined vertex data (pos+norm)
    faces = [];
    numIndices = 0; // <-- ADDED: Store number of indices
    childs = [];
    color = [1.0, 1.0, 1.0];
    MOVE_MATRIX = LIBS.get_I4();
    POSITION_MATRIX = LIBS.get_I4();

    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, _normal, // <-- ADDED _normal
                profilePoints, color = [1.0, 1.0, 1.0]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this.profilePoints = profilePoints;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this._normal = _normal; // <-- STORE IT
        this.color = color;

        // Generate Mesh
        const meshData = generateBezierSORMesh(this.profilePoints);
        this.vertexData = meshData.vertexData; // <-- Use interleaved data
        this.faces = meshData.indices;
        this.numIndices = meshData.numIndices; // <-- Store index count
    }

    setup() {
        // --- [MODIFICATION] Create ONE buffer for interleaved data ---
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertexData), this.GL.STATIC_DRAW);

        this.OBJECT_FACES = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces), this.GL.STATIC_DRAW);

        // No need to unbind/rebind ARRAY_BUFFER here

        this.childs.forEach(child => child.setup());
    }

    render(PARENT_MATRIX) {
        // --- [MODIFICATION] Ensure correct shader program ---
        // --- [MODIFICATION] Ensure correct shader program ---
        this.GL.useProgram(this.SHADER_PROGRAM);

        // Calculate final model matrix (Combine PARENT, POSITION, MOVE)
        // Order depends on desired effect (usually Parent * Position * Move)
        let transformMatrix = LIBS.multiply(this.POSITION_MATRIX, this.MOVE_MATRIX); // Move * Pos
        transformMatrix = LIBS.multiply(transformMatrix, PARENT_MATRIX);

        this.GL.uniformMatrix4fv(this._MMatrix, false, transformMatrix);

        // Set uniform color
        const _uColor = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uColor");
        this.GL.uniform3fv(_uColor, this.color);

        // --- [MODIFICATION] Bind the single vertex buffer ---

        // --- [MODIFICATION] Bind the single vertex buffer ---
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);

        // --- [MODIFICATION] Set up attribute pointers for interleaved data ---
        const stride = 6 * Float32Array.BYTES_PER_ELEMENT; // 3 pos + 3 norm

        // Position Attribute
        this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false,
            stride, // Stride
            0       // Offset for position
        );
        this.GL.enableVertexAttribArray(this._position); // Make sure it's enabled

        // Normal Attribute
        this.GL.vertexAttribPointer(this._normal, 3, this.GL.FLOAT, false,
            stride, // Stride
            3 * Float32Array.BYTES_PER_ELEMENT // Offset for normal (after 3 position floats)
        );
        this.GL.enableVertexAttribArray(this._normal); // Make sure it's enabled


        // --- Bind index buffer and draw ---
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.drawElements(this.GL.TRIANGLES, this.numIndices, this.GL.UNSIGNED_SHORT, 0);

        // --- Render children ---
        this.childs.forEach(child => child.render(transformMatrix)); // Pass combined matrix
    }
}