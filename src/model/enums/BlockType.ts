enum BlockType {
	Solid,
	PinHole,
	AxleHole,
	Pin,
	Axle
}

function isAttachment(blockType: BlockType): boolean {
	return blockType != BlockType.AxleHole
		&& blockType != BlockType.PinHole
		&& blockType != BlockType.Solid;
}

function getRandomBlockType(): BlockType {
	let types = [BlockType.AxleHole, BlockType.PinHole, BlockType.Solid, BlockType.Pin, BlockType.Axle];
	let index = Math.floor(types.length * Math.random());
	return types[index];
}

const BLOCK_TYPE = {
	"solid": BlockType.Solid,
	"pinhole": BlockType.PinHole,
	"axlehole": BlockType.AxleHole,
	"pin": BlockType.Pin,
	"axle": BlockType.Axle
}