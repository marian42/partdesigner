class Measurements {
	technicUnit = 8;

	edgeMargin = 0.2 / this.technicUnit;
	interiorRadius = 3.2 / this.technicUnit;
	pinHoleRadius = 2.475 / this.technicUnit;
	pinHoleOffset = 0.89 / this.technicUnit;
	axleHoleSize = 1.01 / this.technicUnit;
	pinRadius = 2.315 / this.technicUnit;
	ballBaseRadius = 1.6 / this.technicUnit;
	ballRadius = 3.0 / this.technicUnit;
	pinLipRadius = 0.17 / this.technicUnit;
	axleSizeInner = 0.86 / this.technicUnit;
	axleSizeOuter = 2.15 / this.technicUnit;
	attachmentAdapterSize = 0.4 / this.technicUnit;
	attachmentAdapterRadius = 3 / this.technicUnit;
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
		this.axleSizeOuter = Math.min(Math.sqrt(Math.pow(Math.min(0.5 - this.edgeMargin, this.attachmentAdapterRadius), 2.0) - Math.pow(this.axleSizeInner, 2.0)), this.axleSizeOuter);
		this.axleSizeInner = Math.min(this.axleSizeOuter, this.axleSizeInner);
		this.attachmentAdapterSize = Math.min((0.5 - this.edgeMargin) / 2, this.attachmentAdapterSize);
		this.ballBaseRadius = Math.min(this.ballBaseRadius, this.interiorRadius);
		this.ballRadius = Math.max(Math.min(this.ballRadius, 0.5 - this.attachmentAdapterSize), this.ballBaseRadius);
	}
}

const DEFAULT_MEASUREMENTS = new Measurements();