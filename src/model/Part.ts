///<reference path="../geometry/Vector3.ts" />

let CUBE = [
	new Vector3(0, 0, 0),
	new Vector3(0, 0, 1),
	new Vector3(0, 1, 0),
	new Vector3(0, 1, 1),
	new Vector3(1, 0, 0),
	new Vector3(1, 0, 1),
	new Vector3(1, 1, 0),
	new Vector3(1, 1, 1)
];

class Part {
	public blocks: VectorDictionary<Block> = new VectorDictionary<Block>();

	public generateMesh() {
		throw new Error("Not implemented!");
	}

	public createSmallBlocks(): VectorDictionary<SmallBlock> {
		var result = new VectorDictionary<SmallBlock>();

		for (let position of this.blocks.keys()) {
			let block = this.blocks.get(position);
			for (let local of CUBE) {
				if (block.forward().dot(local) == 1) {
					continue;
				}
				result.set(position.plus(local), SmallBlock.createFromLocalCoordinates(block.right().dot(local), block.up().dot(local), position.plus(local), block));
			}
		}

		return result;
	}

	public isSmallBlockFree(position: Vector3): boolean {
		for (let local of CUBE) {
			if (!this.blocks.containsKey(position.minus(local))) {
				continue;
			}
			var block = this.blocks.get(position.minus(local));
			if (block.forward().dot(local) == 1) {
				return false;
			}
		}
		return true;
	}

	public clearSingle(position: Vector3) {
		for (let local of CUBE) {
			if (!this.blocks.containsKey(position.minus(local))) {
				continue;
			}
			var block = this.blocks.get(position.minus(local));
			if (block.forward().dot(local) != 1) {
				this.blocks.remove(position.minus(local));
			}
		}
	}

	public clearBlock(position: Vector3, orientation: Orientation) {
		for (let local of CUBE) {
			if (forward(orientation).dot(local) != 1) {
				this.clearSingle(position.plus(local));
			}
		}
	}

	public isBlockPlaceable(position: Vector3, orientation: Orientation, doubleSize: boolean): boolean {
		for (let local of CUBE) {
			if (!doubleSize && forward(orientation).dot(local) == 1) {
				continue;
			}
			if (!this.isSmallBlockFree(position.plus(local))) {
				return false;
			}
		}
		return true;
	}

	public placeBlockForced(position: Vector3, block: Block) {
		this.clearBlock(position, block.orientation);
		this.blocks.set(position, block);
	}

	public randomize(createFullSizeBlocks = false) {
		this.blocks.clear();
		for (var i = 0; i < 40; i++) {
			var position = new Vector3(Math.floor(3 * Math.random()), Math.floor(5 * Math.random()), Math.floor(5 * Math.random())).times(createFullSizeBlocks ? 2 : 1);
			var orientation = (Math.random() > 0.333 ? (Math.random() > 0.5 ? Orientation.X : Orientation.Y) : Orientation.Z);
			var type = getRandomBlockType();
			var block = new Block(orientation, type, true);

			this.placeBlockForced(position, block);
			if (createFullSizeBlocks) {
				var block2 = new Block(orientation, type, true);
				this.placeBlockForced(position.plus(forward(orientation)), block2);
			}
		}
	}

	public toString(): string {
		var result = "";

		if (!this.blocks.any()) {
			return result;
		}

		var origin = new Vector3(min(this.blocks.keys(), p => p.x), min(this.blocks.keys(), p => p.y), min(this.blocks.keys(), p => p.z));

		for (let position of this.blocks.keys()) {
			result += position.minus(origin).toNumber().toString(16).toLowerCase();

			let block = this.blocks.get(position);
			let orientationAndRounded = block.orientation == Orientation.X ? "x" : (block.orientation == Orientation.Y ? "y" : "z");
			if (!block.rounded) {
				orientationAndRounded = orientationAndRounded.toUpperCase();
			}
			result += orientationAndRounded;
			result += block.type.toString();
		}
		return result;
	}

	public static fromString(s: string): Part {
		let XYZ = "xyz";

		let part = new Part();

		var p = 0;
		while (p < s.length) {
			var chars = 1;
			while (XYZ.indexOf(s[p + chars].toLowerCase()) == -1) {
				chars++;
			}
			
			let position = Vector3.fromNumber(parseInt(s.substr(p, chars), 16));
			p += chars;
			let orientationString = s[p].toString().toLowerCase();
			let orientation = orientationString == "x" ? Orientation.X : (orientationString == "y" ? Orientation.Y : Orientation.Z);
			let rounded = s[p].toLowerCase() == s[p];
			let type = parseInt(s[p + 1]) as BlockType;

			part.blocks.set(position, new Block(orientation, type, rounded));
			p += 2;
		}
		return part;
	}

	public getCenter(): Vector3 {
		if (!this.blocks.any()) {
			return Vector3.zero();
		}

		let min = this.blocks.keys()[0].copy();
		let max = min.copy();

		for (var position of this.blocks.keys()) {
			var forward = this.blocks.get(position).forward();
			if (position.x < min.x) {
				min.x = position.x;
			}
			if (position.y < min.y) {
				min.y = position.y;
			}
			if (position.z < min.z) {
				min.z = position.z;
			}
			if (position.x + (1.0 - forward.x) > max.x) {
				max.x = position.x + (1.0 - forward.x);
			}
			if (position.y + (1.0 - forward.y) > max.y) {
				max.y = position.y + (1.0 - forward.y);
			}
			if (position.z + (1.0 - forward.y) > max.z) {
				max.z = position.z + (1.0 - forward.y);
			}
		}
		return min.plus(max).plus(Vector3.one()).times(0.5);
	}
}