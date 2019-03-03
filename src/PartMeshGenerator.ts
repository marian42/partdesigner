class PartMeshGenerator extends MeshGenerator {
    private smallBlocks: VectorDictionary<SmallBlock>;
    private tinyBlocks: VectorDictionary<TinyBlock>;   

    constructor(part: Part) {
        super();
        this.smallBlocks = part.createSmallBlocks();
    }
}