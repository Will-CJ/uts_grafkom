// MyObject.js

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

    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, a = 1, b = 1, c = 1, uSegments = 30, vSegments = 30, color = [1.0, 1.0, 1.0]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this.color = color;
        this.POSITION_MATRIX = LIBS.get_I4();
        this.MOVE_MATRIX = LIBS.get_I4();
        this.vertex = [];
        this.faces = [];

        // Full vertical range for a complete ellipsoid
        const vStart = -Math.PI / 2;
        const vEnd = Math.PI / 2;
        const vSegmentCount = vSegments;

        for (let i = 0; i <= vSegmentCount; i++) {
            let v = vStart + (i / vSegmentCount) * (vEnd - vStart);
            for (let j = 0; j <= uSegments; j++) {
                let u = -Math.PI + (j / uSegments) * 2 * Math.PI;
                let x = a * Math.cos(v) * Math.cos(u);
                let y = b * Math.cos(v) * Math.sin(u);
                let z = c * Math.sin(v);
                this.vertex.push(x, y, z);
            }
        }

        for (let i = 0; i < vSegmentCount; i++) {
            for (let j = 0; j < uSegments; j++) {
                let p1 = i * (uSegments + 1) + j;
                let p2 = p1 + (uSegments + 1);
                this.faces.push(p1, p2, p1 + 1);
                this.faces.push(p1 + 1, p2, p2 + 1);
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

export class Cone {
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

    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, a = 1, b = 1, height = 2, uSegments = 30, color = [1.0, 1.0, 1.0]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this.color = color;
        this.POSITION_MATRIX = LIBS.get_I4();
        this.MOVE_MATRIX = LIBS.get_I4();
        this.vertex = [];
        this.faces = [];
        const tipIndex = 0;
        this.vertex.push(0, height / 2, 0);
        const baseCenterIndex = this.vertex.length / 3;
        this.vertex.push(0, -height / 2, 0);
        for (let i = 0; i <= uSegments; i++) {
            let u = (i / uSegments) * 2 * Math.PI;
            this.vertex.push(a * Math.cos(u), -height / 2, b * Math.sin(u));
        }
        for (let i = 0; i < uSegments+1; i++) {
            this.faces.push(tipIndex, (i + 1) + 1, i + 1);
        }
        for (let i = 0; i < uSegments; i++) {
            this.faces.push(baseCenterIndex, i + 2, (i + 1) % uSegments + 2);
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

export class EllipticParaboloid {
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

    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, a = 1, b = 1, c = 1, uSegments = 30, vSegments = 30, color = [1.0, 1.0, 1.0]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this.color = color;
        this.POSITION_MATRIX = LIBS.get_I4();
        this.MOVE_MATRIX = LIBS.get_I4();
        this.vertex = [];
        this.faces = [];
        for (let i = 0; i <= vSegments; i++) {
            let v = i / vSegments;
            for (let j = 0; j <= uSegments; j++) {
                let u = -Math.PI + (j / uSegments) * 2 * Math.PI;
                let x = a * v * Math.cos(u);
                let y = b * v * Math.sin(u);
                let z = c * v * v;
                this.vertex.push(x, y, z);
            }
        }
        for (let i = 0; i < vSegments; i++) {
            for (let j = 0; j < uSegments; j++) {
                let p1 = i * (uSegments + 1) + j;
                let p2 = p1 + (uSegments + 1);
                this.faces.push(p1, p2, p1 + 1);
                this.faces.push(p1 + 1, p2, p2 + 1);
            }
        }
    }
    setup() { /* ... */ }
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

export class SurfaceOfRevolution {
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

    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, controlPoints, bSplineSegments, bSplineDegree, steps, angleDeg, color = [1.0, 1.0, 1.0]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this.color = color;
        this.POSITION_MATRIX = LIBS.get_I4();
        this.MOVE_MATRIX = LIBS.get_I4();
        this.vertex = [];
        this.faces = [];

        // Generate B-Spline curve
        const curve = this.generateBSpline(controlPoints, bSplineSegments, bSplineDegree);
        
        // Generate surface from the curve
        const surfaceData = this.generateSurfaceOfRevolution(curve, steps, angleDeg);
        this.vertex = surfaceData.vertices;
        this.faces = surfaceData.indices;
    }

    generateBSpline(controlPoint, m, degree) {
        var curves = [];
        var knotVector = [];
        var n = controlPoint.length / 2;

        // Generate knot vector
        for (var i = 0; i < n + degree + 1; i++) {
            if (i < degree + 1) knotVector.push(0);
            else if (i >= n) knotVector.push(n - degree);
            else knotVector.push(i - degree);
        }

        // Basis function
        var basisFunc = function (i, j, t) {
            if (j == 0) {
                return (knotVector[i] <= t && t < knotVector[i + 1]) ? 1 : 0;
            }
            var den1 = knotVector[i + j] - knotVector[i];
            var den2 = knotVector[i + j + 1] - knotVector[i + 1];

            var term1 = 0, term2 = 0;
            if (den1 != 0 && !isNaN(den1)) {
                term1 = ((t - knotVector[i]) / den1) * basisFunc(i, j - 1, t);
            }
            if (den2 != 0 && !isNaN(den2)) {
                term2 = ((knotVector[i + j + 1] - t) / den2) * basisFunc(i + 1, j - 1, t);
            }
            return term1 + term2;
        };

        for (var t = 0; t < m; t++) {
            var x = 0, y = 0;
            var u = (t / m * (knotVector[n] - knotVector[degree])) + knotVector[degree];
            for (var key = 0; key < n; key++) {
                var C = basisFunc(key, degree, u);
                x += (controlPoint[key * 2] * C);
                y += (controlPoint[key * 2 + 1] * C);
            }
            curves.push(x);
            curves.push(y);
        }
        return curves;
    }

    generateSurfaceOfRevolution(curve, steps, angleDeg) {
        let vertices = [];
        let indices = [];
        let angleRad = angleDeg * Math.PI / 180;

        for (let i = 0; i <= steps; i++) {
            let theta = (angleRad * i) / steps;
            for (let j = 0; j < curve.length; j += 2) {
                let x = curve[j];
                let y = curve[j + 1];
                let X = x * Math.cos(theta);
                let Y = y;
                let Z = x * Math.sin(theta);
                vertices.push(X, Y, Z);
            }
        }

        let curvePoints = curve.length / 2;
        for (let i = 0; i < steps; i++) {
            for (let j = 0; j < curvePoints - 1; j++) {
                let p1 = i * curvePoints + j;
                let p2 = p1 + curvePoints;
                indices.push(p1, p2, p1 + 1);
                indices.push(p1 + 1, p2, p2 + 1);
            }
        }

        return { vertices, indices };
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

export class ExtrudedShape {
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

    constructor(GL, SHADER_PROGRAM, _position, _MMatrix, controlPoints, bSplineSegments, bSplineDegree, thickness = 0.1, color = [1.0, 1.0, 1.0]) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._MMatrix = _MMatrix;
        this.color = color;
        this.POSITION_MATRIX = LIBS.get_I4();
        this.MOVE_MATRIX = LIBS.get_I4();
        this.vertex = [];
        this.faces = [];

        // Generate smooth B-spline curve from control points
        const curvePoints = this.generateBSpline(controlPoints, bSplineSegments, bSplineDegree);

        const halfThickness = thickness / 2;
        const numPoints = curvePoints.length / 2;

        // Create vertices for the front and back faces
        for (let i = 0; i < numPoints; i++) {
            const x = curvePoints[i * 2];
            const y = curvePoints[i * 2 + 1];
            // Front face vertices (z = +halfThickness)
            this.vertex.push(x, y, halfThickness);
            // Back face vertices (z = -halfThickness)
            this.vertex.push(x, y, -halfThickness);
        }

        // Create faces for the sides
        for (let i = 0; i < numPoints; i++) {
            const currentPointFront = i * 2;
            const currentPointBack = currentPointFront + 1;
            const nextPointFront = ((i + 1) % numPoints) * 2;
            const nextPointBack = nextPointFront + 1;

            // First triangle of the side face
            this.faces.push(currentPointFront, currentPointBack, nextPointFront);
            // Second triangle of the side face
            this.faces.push(nextPointFront, currentPointBack, nextPointBack);
        }

        // Triangulate the front and back faces using a fan method
        const frontCenterIndex = this.vertex.length / 3;
        this.vertex.push(0, 0, halfThickness);
        const backCenterIndex = this.vertex.length / 3;
        this.vertex.push(0, 0, -halfThickness);

        for (let i = 0; i < numPoints; i++) {
            const p1 = i * 2;
            const p2 = ((i + 1) % numPoints) * 2;
            const p1Back = p1 + 1;
            const p2Back = p2 + 1;

            // Front face triangle
            this.faces.push(frontCenterIndex, p2, p1);
            // Back face triangle (reverse winding)
            this.faces.push(backCenterIndex, p1Back, p2Back);
        }
    }

    // Metode untuk menghasilkan kurva B-spline dari titik kontrol
    generateBSpline(controlPoint, m, degree) {
        var curves = [];
        var knotVector = [];
        var n = controlPoint.length / 2;

        // Generate knot vector
        for (var i = 0; i < n + degree + 1; i++) {
            if (i < degree + 1) knotVector.push(0);
            else if (i >= n) knotVector.push(n - degree);
            else knotVector.push(i - degree);
        }

        // Basis function
        var basisFunc = function (i, j, t) {
            if (j == 0) {
                return (knotVector[i] <= t && t < knotVector[i + 1]) ? 1 : 0;
            }
            var den1 = knotVector[i + j] - knotVector[i];
            var den2 = knotVector[i + j + 1] - knotVector[i + 1];

            var term1 = 0, term2 = 0;
            if (den1 != 0 && !isNaN(den1)) {
                term1 = ((t - knotVector[i]) / den1) * basisFunc(i, j - 1, t);
            }
            if (den2 != 0 && !isNaN(den2)) {
                term2 = ((knotVector[i + j + 1] - t) / den2) * basisFunc(i + 1, j - 1, t);
            }
            return term1 + term2;
        };

        for (var t = 0; t < m; t++) {
            var x = 0, y = 0;
            var u = (t / m * (knotVector[n] - knotVector[degree])) + knotVector[degree];
            for (var key = 0; key < n; key++) {
                var C = basisFunc(key, degree, u);
                x += (controlPoint[key * 2] * C);
                y += (controlPoint[key * 2 + 1] * C);
            }
            curves.push(x);
            curves.push(y);
        }
        return curves;
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

// MyObject.js

export class ModifiedEllipsoid {
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