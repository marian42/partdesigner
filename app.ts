let gl: WebGLRenderingContext;

var editor: Editor;
var catalog: Catalog;

window.onload = () => {
	editor = new Editor();
	catalog = new Catalog();
};

window.onpopstate = function(event: PopStateEvent){
    if (event.state) {
		var url = new URL(document.URL);
		if (url.searchParams.has("part")) {
			editor.part = Part.fromString(url.searchParams.get("part"));
			editor.updateMesh(true);
		}
    }
};