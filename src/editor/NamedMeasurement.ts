class NamedMeasurement {
	private name: string;
	private relative: boolean;
	private displayDouble: boolean;
	private domElement: HTMLInputElement;

	constructor(name: string, relative: boolean, displayDouble: boolean) {
		this.name = name;
		this.relative = relative;
		this.displayDouble = displayDouble;
		this.domElement = document.getElementById(name) as HTMLInputElement;
		if (this.domElement == null) {
			throw new Error("DOM Element " + this.name + " not found.");
		}
	}

	public readFromDOM(measurements: Measurements) {
		console.log(this.name + ": " + this.domElement.value);
		var value = parseFloat(this.domElement.value);
		if (this.relative) {
			value /= measurements.technicUnit;
		}
		if (this.displayDouble) {
			value /= 2;
		}
		measurements[this.name] = value;
	}

	public applyToDom(measurements: Measurements) {
		var value: number = measurements[this.name];
		if (this.relative) {
			value *= measurements.technicUnit;
		}
		if (this.displayDouble) {
			value *= 2;
		}
		this.domElement.value = value.toString();
	}
}

const NAMED_MEASUREMENTS : NamedMeasurement[] = [
	new NamedMeasurement("technicUnit", false, false),
	new NamedMeasurement("edgeMargin", true, false),
	new NamedMeasurement("interiorRadius", true, true),
	new NamedMeasurement("pinHoleRadius", true, true),
	new NamedMeasurement("pinHoleOffset", true, false),
	new NamedMeasurement("axleHoleSize", true, true),
	new NamedMeasurement("pinRadius", true, true),
	new NamedMeasurement("pinLipRadius", true, true),
	new NamedMeasurement("axleSizeInner", true, false),
	new NamedMeasurement("axleSizeOuter", true, false),
	new NamedMeasurement("axlePinAdapterSize", true, false),
	new NamedMeasurement("axlePinAdapterRadius", true, true),
	new NamedMeasurement("interiorEndMargin", true, false),
	new NamedMeasurement("lipSubdivisions", false, false),
	new NamedMeasurement("subdivisionsPerQuarter", false, false)
]