class StudioPartExporter {
    private static formatPoint(vector: Vector3): string {
        return (vector.x * 20).toFixed(4) + " " + (-vector.y * 20).toFixed(4) + " " + (-vector.z * 20).toFixed(4);
    }

    private static formatVector(vector: Vector3): string {
        return (vector.x).toFixed(4) + " " + (-vector.y).toFixed(4) + " " + (-vector.z).toFixed(4);
    }

    private static formatConnector(position: Vector3, block: Block, facesForward: boolean): string {
        let result = "0 PE_CONN ";

        switch (block.type) {
            case BlockType.PinHole: result += "0 2"; break;
            case BlockType.AxleHole: result += "0 6"; break;
            case BlockType.Axle: result += "0 7"; break;
            case BlockType.Pin: result += "0 3"; break;
            case BlockType.BallJoint: result += "1 5"; break;
            default: throw new Error("Unknown block type: " + block.type);
        }

        if (facesForward) {
            result += " "
                + StudioPartExporter.formatVector(block.right) + " "
                + StudioPartExporter.formatVector(block.forward) + " "
                + StudioPartExporter.formatVector(block.up) + " "
                + StudioPartExporter.formatPoint(position.plus(new Vector3(1, 1, 1).plus(block.forward)).times(0.5));
        } else {
            result += " "
                + StudioPartExporter.formatVector(block.right.times(-1)) + " "
                + StudioPartExporter.formatVector(block.forward.times(-1)) + " "
                + StudioPartExporter.formatVector(block.up) + " "
                + StudioPartExporter.formatPoint(position.plus(new Vector3(1, 1, 1).minus(block.forward)).times(0.5));
        }

         
        result += " 0 0 0.8 0 0\n";
        return result;
    }

    private static createFileContent(part: Part, measurements: Measurements, name: string, filename: string): string {
        let smallBlocks = part.createSmallBlocks();
        let mesh = new PartMeshGenerator(part, measurements).getMesh();

        var result: string = `0 FILE ` + filename + `
0 Description: part
0 Name: ` + name + `
0 Author: 
0 BFC CERTIFY CCW
1 16 0.0000 -0.5000 0.0000 1.0000 0.0000 0.0000 0.0000 1.0000 0.0000 0.0000 0.0000 1.0000 part.obj_grouped
0 NOFILE
0 FILE part.obj_grouped
0 Description: part.obj_grouped
0 Name: 
0 Author: 
0 ModelType: Part
0 BFC CERTIFY CCW
1 16 0.0000 0.0000 0.0000 1.0000 0.0000 0.0000 0.0000 1.0000 0.0000 0.0000 0.0000 1.0000 part.obj
`;

        for (let position of part.blocks.keys()) {
            let startBlock = part.blocks.get(position);

            if (startBlock.type == BlockType.Solid) {
                continue;
            }

            let previousBlock = part.blocks.getOrNull(position.minus(startBlock.forward));
            let isFirstInRow = previousBlock == null || previousBlock.orientation != startBlock.orientation || previousBlock.type != startBlock.type;

            if (!isFirstInRow) {
                continue;
            }

            let facesForward = false;

            if (startBlock.isAttachment) {
                for (let x = 0; x <= 1; x++) {
                    for (let y = 0; y <= 1; y++) {
                        let supportBlockPosition = position.minus(startBlock.forward).plus(startBlock.right.times(x)).plus(startBlock.up.times(y));
                        let supportBlock = smallBlocks.getOrNull(supportBlockPosition);
                        if (supportBlock != null && !supportBlock.isAttachment) {
                            facesForward = true;
                            break;
                        }
                    }
                    if (facesForward) {
                        break;
                    }
                }
            }

            let block = startBlock;
            let offset = 0;
            while (true) {
                let nextBlock = part.blocks.getOrNull(position.plus(startBlock.forward));
                let isLastInRow = nextBlock == null || nextBlock.orientation != startBlock.orientation || nextBlock.type != startBlock.type;

                if (isLastInRow && offset % 2 == 0 && offset > 0) {
                    result += StudioPartExporter.formatConnector(position.minus(startBlock.forward), block, facesForward);
                } else if (offset % 2 == 0) {
                    result += StudioPartExporter.formatConnector(position, block, facesForward);
                }

                if (isLastInRow) {
                    break;
                }

                offset += 1;
                position = position.plus(startBlock.forward);
                block = nextBlock;
            }
        }

        result += `
0 NOFILE
0 FILE part.obj
0 Description: part.obj
0 Name: 
0 Author: 
0 BFC CERTIFY CCW
`;

        for (let triangle of mesh.triangles) {
            result += "3 16 " + this.formatPoint(triangle.v1) + " " + this.formatPoint(triangle.v2) + " " + this.formatPoint(triangle.v3) + "\n";
        }

        result += "0 NOFILE\n";
        return result;
    }   

    public static savePartFile(part: Part, measurements: Measurements, name = "part") {
        let filename = name.toLowerCase().replace(" ", "_") + ".part";
        let content = StudioPartExporter.createFileContent(part, measurements, name, filename);
        let link = document.createElement('a');
        link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
        link.download = filename;
        link.click();
    }
}