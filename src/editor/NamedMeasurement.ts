class NamedMeasurement {
	private name: string;
	private relative: boolean;
	private displayDouble: boolean;
	private domElement: HTMLInputElement;
	private resetElement: HTMLAnchorElement;

	constructor(name: string, relative: boolean, displayDouble: boolean) {
		this.name = name;
		this.relative = relative;
		this.displayDouble = displayDouble;
		this.domElement = document.getElementById(name) as HTMLInputElement;
		this.resetElement = this.domElement.previousElementSibling as HTMLAnchorElement;
		if (this.domElement == null) {
			throw new Error("DOM Element " + this.name + " not found.");
		}
		this.resetElement.addEventListener("click", (event: MouseEvent) => this.reset(event));
	}

	public readFromDOM(measurements: Measurements) {
		var value = parseFloat(this.domElement.value);
		if (!isFinite(value) || value < 0) {
			return;
		}
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
		value = Math.round(value * 1000) / 1000;
		this.domElement.value = value.toString();
		this.resetElement.style.visibility = measurements[this.name] == DEFAULT_MEASUREMENTS[this.name] ? "hidden" : "visible";
	}

	private reset(event: MouseEvent) {
		editor.measurements[this.name] = DEFAULT_MEASUREMENTS[this.name];
		this.applyToDom(DEFAULT_MEASUREMENTS);
		editor.updateMesh();
		event.preventDefault();
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
	new NamedMeasurement("axlePinAdapterSize", true, true),
	new NamedMeasurement("axlePinAdapterRadius", true, true),
	new NamedMeasurement("interiorEndMargin", true, false),
	new NamedMeasurement("lipSubdivisions", false, false),
	new NamedMeasurement("subdivisionsPerQuarter", false, false)
]