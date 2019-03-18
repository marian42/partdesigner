class Triangle {
    public v1: Vector3;
    public v2: Vector3;
    public v3: Vector3;

    constructor(v1: Vector3, v2: Vector3, v3: Vector3, flipped = false) {
        if (flipped) {
            this.v1 = v2;
            this.v2 = v1;
            this.v3 = v3;
        } else {
            this.v1 = v1;
            this.v2 = v2;
            this.v3 = v3;
        }
    }

    normal(): Vector3 {
        return this.v3.minus(this.v1).cross(this.v2.minus(this.v1)).normalized();
    }
}