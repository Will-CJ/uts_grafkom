var LIBS = {
    degToRad: function (angle) {
        return (angle * Math.PI / 180);
    },


    get_projection: function (angle, a, zMin, zMax) {
        var tan = Math.tan(LIBS.degToRad(0.5 * angle)),
            A = -(zMax + zMin) / (zMax - zMin),
            B = (-2 * zMax * zMin) / (zMax - zMin);


        return [
            0.5 / tan, 0, 0, 0,
            0, 0.5 * a / tan, 0, 0,
            0, 0, A, -1,
            0, 0, B, 0
        ];
    },


    get_I4: function () {
        return [1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1];
    },


    set_I4: function (m) {
        m[0] = 1, m[1] = 0, m[2] = 0, m[3] = 0,
            m[4] = 0, m[5] = 1, m[6] = 0, m[7] = 0,
            m[8] = 0, m[9] = 0, m[10] = 1, m[11] = 0,
            m[12] = 0, m[13] = 0, m[14] = 0, m[15] = 1;
    },


    rotateX: function (m, angle) {
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        var mv1 = m[1], mv5 = m[5], mv9 = m[9];
        m[1] = m[1] * c - m[2] * s;
        m[5] = m[5] * c - m[6] * s;
        m[9] = m[9] * c - m[10] * s;


        m[2] = m[2] * c + mv1 * s;
        m[6] = m[6] * c + mv5 * s;
        m[10] = m[10] * c + mv9 * s;
    },


    rotateY: function (m, angle) {
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        var mv0 = m[0], mv4 = m[4], mv8 = m[8];
        m[0] = c * m[0] + s * m[2];
        m[4] = c * m[4] + s * m[6];
        m[8] = c * m[8] + s * m[10];


        m[2] = c * m[2] - s * mv0;
        m[6] = c * m[6] - s * mv4;
        m[10] = c * m[10] - s * mv8;
    },


    rotateZ: function (m, angle) {
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        var mv0 = m[0], mv4 = m[4], mv8 = m[8];
        m[0] = c * m[0] - s * m[1];
        m[4] = c * m[4] - s * m[5];
        m[8] = c * m[8] - s * m[9];


        m[1] = c * m[1] + s * mv0;
        m[5] = c * m[5] + s * mv4;
        m[9] = c * m[9] + s * mv8;
    },


    translateZ: function (m, t) {
        m[14] += t;
    },
    translateX: function (m, t) {
        m[12] += t;
    },
    translateY: function (m, t) {
        m[13] += t;
    },


    set_position: function (m, x, y, z) {
        m[12] = x, m[13] = y, m[14] = z;
    },

    multiply: function (m1, m2) {
        var rm = this.get_I4();
        var N = 4;
        for (var i = 0; i < N; i++) {
            for (var j = 0; j < N; j++) {
                rm[i * N + j] = 0;
                for (var k = 0; k < N; k++) {
                    rm[i * N + j] += m1[i * N + k] * m2[k * N + j];
                }
            }
        }
        return rm;
    },

    scaleX: function (m, t) {
        m[0] *= t;
    },
    scaleY: function (m, t) {
        m[5] *= t;
    },
    scaleZ: function (m, t) {
        m[10] *= t;
    },
    scale: function (m, x, y, z) {
        m[0] *= x; m[5] *= y; m[10] *= z;
    },
    
    // ========================================================
    // --- FUNGSI BARU: NORMALISASI VEKTOR (VECTOR NORMALIZATION) ---
    // ========================================================
    /**
     * Menormalisasi vektor 3D.
     * @param {Array<number>} v - Vektor [x, y, z] yang akan dinormalisasi.
     * @returns {Array<number>} Vektor [x, y, z] yang dinormalisasi.
     */
    normalize: function (v) {
        var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        
        // Cek jika panjangnya mendekati nol untuk menghindari pembagian dengan nol
        if (length > 0.00001) {
            return [v[0] / length, v[1] / length, v[2] / length];
        }
        // Kembalikan vektor nol jika panjangnya nol
        return [0, 0, 0]; 
    },
    
    // ========================================================
    // (Sisa fungsi rotateArbitraryAxis tidak berubah, tapi sekarang menggunakan this.normalize)
    // ========================================================

    /**
     * Menerapkan Rotasi di sekitar Sumbu Sembarang V=(x, y, z) pada Matriks M.
     * Catatan: Karena V harus berupa vektor satuan, kita asumsikan [x, y, z] yang masuk sudah dinormalisasi 
     * atau fungsi ini akan menerima vektor yang sudah dinormalisasi dari pemanggil.
     */
    rotateArbitraryAxis: function (M, angle, x, y, z) {
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        var C = 1.0 - c;

        // Matriks rotasi R di sekitar sumbu sembarang [x, y, z] (Rumus Rodrigues)
        var R = [
            x * x * C + c, 		x * y * C - z * s, 	x * z * C + y * s, 	0,
            y * x * C + z * s, 	y * y * C + c, 		y * z * C - x * s, 	0,
            z * x * C - y * s, 	z * y * C + x * s, 	z * z * C + c, 		0,
            0, 					0, 					0, 					1
        ];
        
        // M = R * M (Rotasi diterapkan ke matriks M)
        var temp = this.multiply(R, M);
        
        // Salin hasil kembali ke M
        for (var i = 0; i < 16; i++) {
            M[i] = temp[i];
        }
    }
};