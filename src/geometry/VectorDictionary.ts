class VectorDictionary<T> {
	private data: {
		[id: number]: {
			[id: number]: {
				[id: number]: T;
			};
		};
	} = {};

	containsKey(key: Vector3): boolean {
		return key.x in this.data && key.y in this.data[key.x] && key.z in this.data[key.x][key.y];
	}

	get(key: Vector3): T {
		if (!this.containsKey(key)) {
			throw new Error("Dictionary does not contain key: " + key.toString());
		}
		return this.data[key.x][key.y][key.z];
	}

	getOrNull(key: Vector3): T {
		if (!this.containsKey(key)) {
			return null;
		}
		return this.data[key.x][key.y][key.z];
	}

	set(key: Vector3, value: T) {
		if (!(key.x in this.data)) {
			this.data[key.x] = {};
		}
		if (!(key.y in this.data[key.x])) {
			this.data[key.x][key.y] = {};
		}
		this.data[key.x][key.y][key.z] = value;
	}

	remove(key: Vector3) {
		if (key.x in this.data && key.y in this.data[key.x] && key.z in this.data[key.x][key.y]) {
			delete this.data[key.x][key.y][key.z];
		}
	}

	clear() {
		this.data = {};
	}

	*keys(): IterableIterator<Vector3> {
		for (let x in this.data) {
			for (let y in this.data[x]) {
				for (let z in this.data[x][y]) {
					yield new Vector3(parseInt(x), parseInt(y), parseInt(z));
				}
			}
		}
	}

	*values(): IterableIterator<T> {
		for (let x in this.data) {
			for (let y in this.data[x]) {
				for (let z in this.data[x][y]) {
					yield this.data[x][y][z];
				}
			}
		}
	}

	any(): boolean {
		for (let x in this.data) {
			for (let y in this.data[x]) {
				for (let z in this.data[x][y]) {
					return true;
				}
			}
		}
		return false;
	}
}