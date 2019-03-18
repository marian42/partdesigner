class MeshGenerator {
    protected triangles: Triangle[] = [];

    getMesh(): Mesh {
        return new Mesh(this.triangles);
    }

    createQuad(v1: Vector3, v2: Vector3, v3: Vector3, v4: Vector3, flipped = false) {
        if (!flipped) {
            this.triangles.push(new Triangle(v1, v2, v4));
            this.triangles.push(new Triangle(v2, v3, v4));
        } else {
            this.triangles.push(new Triangle(v4, v2, v1));
            this.triangles.push(new Triangle(v4, v3, v2));
        }
    }

    createQuadWithNormals(v1: Vector3, v2: Vector3, v3: Vector3, v4: Vector3, n1: Vector3, n2: Vector3, n3: Vector3, n4: Vector3, flipped = false) {
        if (!flipped) {
            this.triangles.push(new TriangleWithNormals(v1, v2, v4, n1, n2, n4));
            this.triangles.push(new TriangleWithNormals(v2, v3, v4, n2, n3, n4));
        } else {
            this.triangles.push(new TriangleWithNormals(v4, v2, v1, n4.times(-1), n2.times(-1), n1.times(-1)));
            this.triangles.push(new TriangleWithNormals(v4, v3, v2, n4.times(-1), n3.times(-1), n2.times(-1)));
        }
    }

    createCircleWithHole(block: TinyBlock, innerRadius: number, outerRadius: number, offset: number, inverted = false, square = false) {
        let center = block.getCylinderOrigin().plus(block.forward().times(offset));

        for (var i = 0; i < SUBDIVISIONS; i++) {
            let i1 = block.getOnCircle(Math.PI / 2 * i / SUBDIVISIONS);
            let i2 = block.getOnCircle(Math.PI / 2 * (i + 1) / SUBDIVISIONS);
            var o1 = i1;
            var o2 = i2;

            if (square) {
                if (Math.abs(o1.dot(block.right())) > Math.abs(o1.dot(block.up()))) {
                    o1 = o1.times(1 / Math.abs(o1.dot(block.right())));
                } else {
                    o1 = o1.times(1 / Math.abs(o1.dot(block.up())));
                }
                if (Math.abs(o2.dot(block.right())) > Math.abs(o2.dot(block.up()))) {
                    o2 = o2.times(1 / Math.abs(o2.dot(block.right())));
                } else {
                    o2 = o2.times(1 / Math.abs(o2.dot(block.up())));
                }
            }

            this.createQuad(
                i1.times(innerRadius).plus(center),
                i2.times(innerRadius).plus(center),
                o2.times(outerRadius).plus(center),
                o1.times(outerRadius).plus(center),
                inverted);
        }
    }

    createCircle(block: TinyBlock, radius: number, offset: number, inverted = false) {
        let center = block.getCylinderOrigin().plus(block.forward().times(offset));

        for (var i = 0; i < SUBDIVISIONS; i++) {
            let p1 = block.getOnCircle(Math.PI / 2 * i / SUBDIVISIONS, radius);
            let p2 = block.getOnCircle(Math.PI / 2 * (i + 1) / SUBDIVISIONS, radius);

            if (inverted) {
                this.triangles.push(new Triangle(center.plus(p1), center, center.plus(p2)));
            } else {
                this.triangles.push(new Triangle(center, center.plus(p1), center.plus(p2)));
            }            
        }
    }

    createCylinder(block: TinyBlock, offset: number, radius: number, distance: number, inverted = false) {
        let center = block.getCylinderOrigin().plus(block.forward().times(offset));

        for (var i = 0; i < SUBDIVISIONS; i++) {
            let v1 = block.getOnCircle(Math.PI / 2 * i / SUBDIVISIONS);
            let v2 = block.getOnCircle(Math.PI / 2 * (i + 1) / SUBDIVISIONS);
            this.createQuadWithNormals(
                center.plus(v1.times(radius)),
                center.plus(v2.times(radius)),
                center.plus(v2.times(radius)).plus(block.forward().times(distance)),
                center.plus(v1.times(radius)).plus(block.forward().times(distance)),
                v1, v2, v2, v1,
                !inverted);
        }
    }
}