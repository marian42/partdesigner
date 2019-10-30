![](https://i.imgur.com/L7moBQT.png)

# Part Designer

This is a free online CAD tool to create custom LEGO® Technic compatible construction parts for 3D printing.

Features
- Assemble a custom part from basic blocks: Pin Hole, Axle Hole, Pin, Axle, Solid
- Save your model as an STL file
- Catalog of existing LEGO® parts
- Customize measurements to get a perfect fit
- Create a sharable link of your part

# Running the local version

You need to have [TypeScript](https://www.typescriptlang.org/) installed. In the project root, run `tsc`. This should run without errors and create the file `app.js`.

Now you need a webserver that locally serves the files from the project directory. If you have python installed, you can call `python3 -m http.server`.It will tell you the port, for example 8000 and you can visit http://localhost:8000 in your browser. Alternatively, you can install [http-server](https://www.npmjs.com/package/http-server), which will also create a server in port 8000.

If you work on the code, run `tsc --watch`, which will recompile everytime you change a source file.
