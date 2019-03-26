class CatalogItem {
	part: Part = null;
	id: number;
	string: string;
	name: string;

	constructor(id: number, name: string, string: string) {
		this.id = id;
		this.name = name;
		this.string = string;
		this.part = Part.fromString(string);
	}
}