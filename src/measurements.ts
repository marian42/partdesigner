class Measurements {
	technicUnit = 8;

	edgeMargin = 0.2 / this.technicUnit;
	interiorRadius = 3.2 / this.technicUnit;
	pinHoleRadius = 2.6 / this.technicUnit;
	pinHoleOffset = 0.7 / this.technicUnit;
	axleHoleSize = 1.01 / this.technicUnit;
	pinRadius = 2.315 / this.technicUnit;
	pinLipRadius = 0.17 / this.technicUnit;
	axleSizeInner = 0.86 / this.technicUnit;
	axleSizeOuter = 2.15 / this.technicUnit;
	axlePinAdapterSize = 0.8 / this.technicUnit;
	axlePinAdapterRadius = 3 / this.technicUnit;
	interiorEndMargin = 0.2 / this.technicUnit;

	lipSubdivisions = 6;

	subdivisionsPerQuarter = 8;

	public enforceConstraints() {
		this.lipSubdivisions = Math.max(2, Math.ceil(this.lipSubdivisions));
		this.subdivisionsPerQuarter = Math.max(2, Math.ceil(this.subdivisionsPerQuarter / 2) * 2);
		this.edgeMargin = Math.min(0.49, this.edgeMargin);
		this.interiorRadius = Math.min(0.5 - this.edgeMargin, this.interiorRadius);
		this.interiorEndMargin = Math.min(0.49, this.interiorEndMargin);
		this.pinHoleRadius = Math.min(this.interiorRadius, this.pinHoleRadius);
		this.pinHoleOffset = Math.min(0.5 - this.edgeMargin, this.pinHoleOffset);
		this.axleHoleSize = Math.min(this.interiorRadius / 2, this.axleHoleSize);
		this.pinRadius = Math.min(0.5 - this.edgeMargin, this.pinRadius);
		this.axleSizeOuter = Math.min(Math.sqrt(Math.pow(Math.min(0.5 - this.edgeMargin, this.axlePinAdapterRadius), 2.0) - Math.pow(this.axleSizeInner, 2.0)), this.axleSizeOuter);
		this.axleSizeInner = Math.min(this.axleSizeOuter, this.axleSizeInner);
		this.axlePinAdapterSize = Math.min(0.5 - this.edgeMargin, this.axlePinAdapterSize);
	}
}

const DEFAULT_MEASUREMENTS = new Measurements();