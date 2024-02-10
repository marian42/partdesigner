class Triangle {
    public readonly v1: Vector3;
    public readonly v2: Vector3;
    public readonly v3: Vector3;

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

    public normal(): Vector3 {
        return this.v3.minus(this.v1).cross(this.v2.minus(this.v1)).normalized();
    }

    public getOnEdge1(progress: number): Vector3 {
        return Vector3.interpolate(this.v1, this.v2, progress);
    }

    public getOnEdge2(progress: number): Vector3 {
        return Vector3.interpolate(this.v2, this.v3, progress);
    }
    
    public getOnEdge3(progress: number): Vector3 {
        return Vector3.interpolate(this.v3, this.v1, progress);
    }
}