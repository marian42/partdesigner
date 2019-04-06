class MeshGenerator {
    protected triangles: Triangle[] = [];
    protected measurements: Measurements;

    constructor(measurements: Measurements) {
        this.measurements = measurements;
    }

    public getMesh(): Mesh {
        return new Mesh(this.triangles);
    }

    protected createQuad(v1: Vector3, v2: Vector3, v3: Vector3, v4: Vector3, flipped = false) {
        if (!flipped) {
            this.triangles.push(new Triangle(v1, v2, v4));
            this.triangles.push(new Triangle(v2, v3, v4));
        } else {
            this.triangles.push(new Triangle(v4, v2, v1));
            this.triangles.push(new Triangle(v4, v3, v2));
        }
    }

    protected createQuadWithNormals(v1: Vector3, v2: Vector3, v3: Vector3, v4: Vector3, n1: Vector3, n2: Vector3, n3: Vector3, n4: Vector3, flipped = false) {
        if (!flipped) {
            this.triangles.push(new TriangleWithNormals(v1, v2, v4, n1, n2, n4));
            this.triangles.push(new TriangleWithNormals(v2, v3, v4, n2, n3, n4));
        } else {
            this.triangles.push(new TriangleWithNormals(v4, v2, v1, n4.times(-1), n2.times(-1), n1.times(-1)));
            this.triangles.push(new TriangleWithNormals(v4, v3, v2, n4.times(-1), n3.times(-1), n2.times(-1)));
        }
    }

    protected createCircleWithHole(block: TinyBlock, innerRadius: number, outerRadius: number, offset: number, inverted = false, square = false) {
        let center = block.getCylinderOrigin(this).plus(block.forward().times(offset));

        for (var i = 0; i < this.measurements.subdivisionsPerQuarter; i++) {
            let i1 = block.getOnCircle(Math.PI / 2 * i / this.measurements.subdivisionsPerQuarter);
            let i2 = block.getOnCircle(Math.PI / 2 * (i + 1) / this.measurements.subdivisionsPerQuarter);
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

    protected createCircle(block: TinyBlock, radius: number, offset: number, inverted = false) {
        let center = block.getCylinderOrigin(this).plus(block.forward().times(offset));

        for (var i = 0; i < this.measurements.subdivisionsPerQuarter; i++) {
            let p1 = block.getOnCircle(Math.PI / 2 * i / this.measurements.subdivisionsPerQuarter, radius);
            let p2 = block.getOnCircle(Math.PI / 2 * (i + 1) / this.measurements.subdivisionsPerQuarter, radius);

            if (inverted) {
                this.triangles.push(new Triangle(center.plus(p1), center, center.plus(p2)));
            } else {
                this.triangles.push(new Triangle(center, center.plus(p1), center.plus(p2)));
            }            
        }
    }

    protected createCylinder(block: TinyBlock, offset: number, radius: number, distance: number, inverted = false) {
        let center = block.getCylinderOrigin(this).plus(block.forward().times(offset));

        for (var i = 0; i < this.measurements.subdivisionsPerQuarter; i++) {
            let v1 = block.getOnCircle(Math.PI / 2 * i / this.measurements.subdivisionsPerQuarter);
            let v2 = block.getOnCircle(Math.PI / 2 * (i + 1) / this.measurements.subdivisionsPerQuarter);
            this.createQuadWithNormals(
                center.plus(v1.times(radius)),
                center.plus(v2.times(radius)),
                center.plus(v2.times(radius)).plus(block.forward().times(distance)),
                center.plus(v1.times(radius)).plus(block.forward().times(distance)),
                v1, v2, v2, v1,
                !inverted);
        }
    }

    public tinyIndexToWorld(p: number): number {
        let i = Math.floor((p + 1) / 3);
        let j = p - i * 3;
    
        var f = 0.5 * i;
        if (j == 0) {
            f += this.measurements.edgeMargin;
        } else if (j == 1) {
            f += 0.5 - this.measurements.edgeMargin;
        }
    
        return f;
    }
    
    public tinyBlockToWorld(position: Vector3): Vector3 {
        return new Vector3(this.tinyIndexToWorld(position.x), this.tinyIndexToWorld(position.y), this.tinyIndexToWorld(position.z));
    }
}