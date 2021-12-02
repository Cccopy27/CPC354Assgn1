class TVIdent {
    constructor(vertices, colorChosen){
        this.positions = [];
        this.colors=[];
        this.vertices = vertices;
        this.colorChosen = colorChosen;
        // original matrix
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
    // multiple matrix b with matrix a
    multiply(a, b){
        const result = [];
        for(let i = 0 ; i < 4; i++){
            for(let j = 0; j < 4; j++){
                result[i*4 + j] = 
                (b[i*4 + 0] * a[0*4 + j])+
                (b[i*4 + 1] * a[1*4 + j])+
                (b[i*4 + 2] * a[2*4 + j])+  
                (b[i*4 + 3] * a[3*4 + j]);  
            }
        };
        return result;
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