class Triangle {
    public v1: Vector3;
    public v2: Vector3;
    public v3: Vector3;

    constructor(v1: Vector3, v2: Vector3, v3: Vector3) {
        this.v1 = v1;
        this.v2 = v2;
        this.v3 = v3;
    }

    normal(): Vector3 {
        return this.v2.minus(this.v1).cross(this.v3.minus(this.v1)).normalized();
    }
}