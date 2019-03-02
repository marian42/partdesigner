class MeshGenerator {
    private triangles: Triangle[] = [];

    private smallBlocks: VectorDictionary<SmallBlock>;
    private tinyBlocks: VectorDictionary<TinyBlock>;   

    constructor(part: Part) {
        this.smallBlocks = part.createSmallBlocks();
    }

}