class TVIdent {
    constructor(vertices, colorChosen){
        this.positions = [];
        this.colors=[];
        this.vertices = vertices;
        this.colorChosen = colorChosen;
        this.matrix = [
            1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            0,0,0,1,
        ]
    }
    getRotationYMatrix(delta){
        var c = Math.cos(delta);
        var s = Math.sin(delta);
    
        return [
          c, 0, -s, 0,
          0, 1, 0, 0,
          s, 0, c, 0,
          0, 0, 0, 1,
        ];
    }
    getScalingMatrix(width, height, depth){
        return [
          width, 0,  0,  0,
          0, height,  0,  0,
          0,  0, depth,  0,
          0,  0,  0,  1,
        ];
    }
    getTranslationMatrix(x, y, z){
        return [
           1,  0,  0,  0,
           0,  1,  0,  0,
           0,  0,  1,  0,
           x, y, z, 1,
        ];
    }
    multiply(a, b){
        var a00 = a[0 * 4 + 0];
        var a01 = a[0 * 4 + 1];
        var a02 = a[0 * 4 + 2];
        var a03 = a[0 * 4 + 3];
        var a10 = a[1 * 4 + 0];
        var a11 = a[1 * 4 + 1];
        var a12 = a[1 * 4 + 2];
        var a13 = a[1 * 4 + 3];
        var a20 = a[2 * 4 + 0];
        var a21 = a[2 * 4 + 1];
        var a22 = a[2 * 4 + 2];
        var a23 = a[2 * 4 + 3];
        var a30 = a[3 * 4 + 0];
        var a31 = a[3 * 4 + 1];
        var a32 = a[3 * 4 + 2];
        var a33 = a[3 * 4 + 3];
        var b00 = b[0 * 4 + 0];
        var b01 = b[0 * 4 + 1];
        var b02 = b[0 * 4 + 2];
        var b03 = b[0 * 4 + 3];
        var b10 = b[1 * 4 + 0];
        var b11 = b[1 * 4 + 1];
        var b12 = b[1 * 4 + 2];
        var b13 = b[1 * 4 + 3];
        var b20 = b[2 * 4 + 0];
        var b21 = b[2 * 4 + 1];
        var b22 = b[2 * 4 + 2];
        var b23 = b[2 * 4 + 3];
        var b30 = b[3 * 4 + 0];
        var b31 = b[3 * 4 + 1];
        var b32 = b[3 * 4 + 2];
        var b33 = b[3 * 4 + 3];
        return [
          b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
          b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
          b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
          b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
          b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
          b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
          b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
          b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
          b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
          b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
          b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
          b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
          b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
          b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
          b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
          b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
        ];
      }
    updateColor(color){
        this.colorChosen = color;
    }

    triangle(a,b,c,i){   
        this.colors.push(this.colorChosen[i]);
        this.positions.push(a);
        this.colors.push(this.colorChosen[i]);
        this.positions.push(b);
        this.colors.push(this.colorChosen[i]);
        this.positions.push(c);
    }

    tetra( a, b, c, d ){
        // tetrahedron with each side using
        // a different color
        this.triangle(a, c, b, 0);
        this.triangle(a, c, d, 1);
        this.triangle(a, b, d, 2);
        this.triangle(b, c, d, 3);
    }

    divideTetra(a, b, c, d, count){
        // check for end of recursion
        if (count == 0) {
            this.tetra(a, b, c, d);
        }
        else {
            // find midpoints of sides
            // divide four smaller tetrahedra
            const ab = mix(a, b, 0.5);
            const ac = mix(a, c, 0.5);
            const ad = mix(a, d, 0.5);
            const bc = mix(b, c, 0.5);
            const bd = mix(b, d, 0.5);
            const cd = mix(c, d, 0.5);

            --count;

            // three new triangles
            this.divideTetra(a, ab, ac, ad, count);
            this.divideTetra(ab,  b, bc, bd, count);
            this.divideTetra(ac, bc,  c, cd, count);
            this.divideTetra(ad, bd, cd,  d, count);
        }
    }
    createTVIdent(numTimesToSubdivide){
        this.positions = [];
        this.colors = [];
        this.divideTetra( this.vertices[0], this.vertices[1], this.vertices[2], this.vertices[3], numTimesToSubdivide);
        return {positions : this.positions, colors : this.colors, matrixOriginal: this.matrix};
    }
    
}