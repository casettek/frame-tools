import p5 from "p5";

let _r;
let _limitCount;
let _aryTriangle = [];
let _aryCenter = [];
let _count;
let _aryInitRot = [];
let _aryCentRotYZ = [];

let _ampR;
let _ampG;
let _ampB;
let _aryInitNoiseXYZ = [];
let _aryNoiseRangeXYZ = [];
let _noiseStepT;
let _sphereR;

function setup() {
  let canvasSize;
  if (windowWidth <= windowHeight) {
    canvasSize = windowWidth;
  } else {
    canvasSize = windowHeight;
  }
  createCanvas(canvasSize, canvasSize, WEBGL);
  setAttributes("premultipliedAlpha", true);
  frameRate(30);
  noStroke();

  _r = width / 1.3;
  _limitCount = 4;

  let createTriangle = new BaseTriangle();

  _ampR = random(255, 1020);
  _ampG = random(255, 1020);
  _ampB = random(255, 1020);
  for (let i = 0; i < 3; i++) {
    _aryInitNoiseXYZ[i] = random(100);
    _aryInitRot[i] = random(360);
  }
  _aryNoiseRangeXYZ[0] = 1.0 / 1.5 / 4;
  _aryNoiseRangeXYZ[1] = 1.0 / 1.5 / 4;
  _aryNoiseRangeXYZ[2] = 1.0 / 1.5 / 4;
  _noiseStepT = 0.004;

  _sphereR = width / 50;

  _count = 0;

  for (let i = 0; i < _aryCenter.length; i++) {
    let rotY = atan2(_aryCenter[i][2], _aryCenter[i][0]);
    let rx = (_aryCenter[i][2] ** 2 + _aryCenter[i][0] ** 2) ** 0.5;
    let ry = _aryCenter[i][1];
    let rotZ = atan2(ry, rx);
    _aryCentRotYZ[i] = [rotY, rotZ];
  }
}

function draw() {
  background(200);
  directionalLight(105, 105, 105, -1, 1, -1);
  specularMaterial(0);
  push();

  rotateX(_aryInitRot[0] + _count / 300);
  rotateY(_aryInitRot[1] + _count / 100);
  rotateZ(_aryInitRot[2] + _count / 200);
  let freq = 4;
  let d = 20;
  for (let i = 0; i < _aryTriangle.length; i++) {
    let noiseVal =
      sin(
        freq *
          2 *
          PI *
          noise(
            _aryInitNoiseXYZ[0] +
              (_aryNoiseRangeXYZ[0] * _aryCenter[i][0]) / _r,
            _aryInitNoiseXYZ[1] +
              (_aryNoiseRangeXYZ[1] * _aryCenter[i][1]) / _r,
            _aryInitNoiseXYZ[2] +
              (_aryNoiseRangeXYZ[2] * _aryCenter[i][2]) / _r +
              _noiseStepT * _count
          )
      ) **
        d *
        0.4 +
      0.6;

    push();
    rotateZ(PI / 2);
    rotateX(-_aryCentRotYZ[i][0]);
    rotateZ(_aryCentRotYZ[i][1]);
    translate(0, (-_r * noiseVal) / 2, 0);
    box(_sphereR * noiseVal);
    pop();
  }
  pop();

  _count++;
}

class BaseTriangle {
  constructor() {
    let triangles = [];
    triangles[0] = [
      [_r, 0, 0],
      [0, 0, _r],
      [0, -_r, 0],
    ];
    triangles[1] = [
      [-_r, 0, 0],
      [0, 0, _r],
      [0, -_r, 0],
    ];
    triangles[2] = [
      [_r, 0, 0],
      [0, 0, -_r],
      [0, -_r, 0],
    ];
    triangles[3] = [
      [-_r, 0, 0],
      [0, 0, -_r],
      [0, -_r, 0],
    ];
    triangles[4] = [
      [_r, 0, 0],
      [0, 0, _r],
      [0, _r, 0],
    ];
    triangles[5] = [
      [-_r, 0, 0],
      [0, 0, _r],
      [0, _r, 0],
    ];
    triangles[6] = [
      [_r, 0, 0],
      [0, 0, -_r],
      [0, _r, 0],
    ];
    triangles[7] = [
      [-_r, 0, 0],
      [0, 0, -_r],
      [0, _r, 0],
    ];
    let countObj = 0;
    for (let i = 0; i < triangles.length; i++) {
      let newSubTriangle = new SubTriangle(triangles[i], countObj + 1);
    }
  }
}

class SubTriangle {
  constructor(triangle, countObj) {
    //triangle = [[x1, y1, z1], [x2, y2, z2], [x3, y3, z3]]
    this.countObj = countObj;
    if (this.countObj <= _limitCount) {
      this.XYZ1 = triangle[0];
      this.XYZ2 = triangle[1];
      this.XYZ3 = triangle[2];
      this.divide(this.XYZ1, this.XYZ2, this.XYZ3);
      let newTriangle1 = [this.XYZ1, this.newMidXYZ_1_2, this.newMidXYZ_3_1];
      let newTriangle2 = [this.newMidXYZ_1_2, this.XYZ2, this.newMidXYZ_2_3];
      let newTriangle3 = [this.newMidXYZ_3_1, this.newMidXYZ_2_3, this.XYZ3];
      let newTriangle4 = [
        this.newMidXYZ_1_2,
        this.newMidXYZ_2_3,
        this.newMidXYZ_3_1,
      ];
      this.triangles = [newTriangle1, newTriangle2, newTriangle3, newTriangle4];
      for (let i = 0; i < this.triangles.length; i++) {
        let newSubTriangle = new SubTriangle(
          this.triangles[i],
          this.countObj + 1
        );
      }
    } else {
      this.addCenter(triangle); //[[x1, y1, z1], [x2, y2, z2], [x3, y3, z3], [ave.x, ave.y, ave.z]]
      _aryTriangle.push(triangle);
    }
  }
  addCenter(triangle) {
    let centX = 0;
    let centY = 0;
    let centZ = 0;
    for (let i = 0; i < triangle.length; i++) {
      centX += triangle[i][0];
      centY += triangle[i][1];
      centZ += triangle[i][2];
    }
    centX /= triangle.length;
    centY /= triangle.length;
    centZ /= triangle.length;
    _aryCenter.push([centX, centY, centZ]);
  }
  divide(XYZ1, XYZ2, XYZ3) {
    let midXYZ_1_2 = [
      (XYZ1[0] + XYZ2[0]) / 2,
      (XYZ1[1] + XYZ2[1]) / 2,
      (XYZ1[2] + XYZ2[2]) / 2,
    ];
    let midXYZ_2_3 = [
      (XYZ2[0] + XYZ3[0]) / 2,
      (XYZ2[1] + XYZ3[1]) / 2,
      (XYZ2[2] + XYZ3[2]) / 2,
    ];
    let midXYZ_3_1 = [
      (XYZ3[0] + XYZ1[0]) / 2,
      (XYZ3[1] + XYZ1[1]) / 2,
      (XYZ3[2] + XYZ1[2]) / 2,
    ];
    let distMid_1_2 =
      (midXYZ_1_2[0] ** 2 + midXYZ_1_2[1] ** 2 + midXYZ_1_2[2] ** 2) ** 0.5;
    let distMid_2_3 =
      (midXYZ_2_3[0] ** 2 + midXYZ_2_3[1] ** 2 + midXYZ_2_3[2] ** 2) ** 0.5;
    let distMid_3_1 =
      (midXYZ_3_1[0] ** 2 + midXYZ_3_1[1] ** 2 + midXYZ_3_1[2] ** 2) ** 0.5;
    this.newMidXYZ_1_2 = [
      (midXYZ_1_2[0] / distMid_1_2) * _r,
      (midXYZ_1_2[1] / distMid_1_2) * _r,
      (midXYZ_1_2[2] / distMid_1_2) * _r,
    ];
    this.newMidXYZ_2_3 = [
      (midXYZ_2_3[0] / distMid_2_3) * _r,
      (midXYZ_2_3[1] / distMid_2_3) * _r,
      (midXYZ_2_3[2] / distMid_2_3) * _r,
    ];
    this.newMidXYZ_3_1 = [
      (midXYZ_3_1[0] / distMid_3_1) * _r,
      (midXYZ_3_1[1] / distMid_3_1) * _r,
      (midXYZ_3_1[2] / distMid_3_1) * _r,
    ];
  }
}

function mouseReleased() {
  _aryTriangle = [];
  _aryCenter = [];
  _aryInitRot = [];
  _aryCentRotYZ = [];
  _aryInitNoiseXYZ = [];
  _aryNoiseRangeXYZ = [];

  let createTriangle = new BaseTriangle();

  _ampR = random(255, 1020);
  _ampG = random(255, 1020);
  _ampB = random(255, 1020);
  for (let i = 0; i < 3; i++) {
    _aryInitNoiseXYZ[i] = random(100);
    _aryInitRot[i] = random(360);
  }
  _aryNoiseRangeXYZ[0] = 1.0 / 1.5 / 4;
  _aryNoiseRangeXYZ[1] = 1.0 / 1.5 / 4;
  _aryNoiseRangeXYZ[2] = 1.0 / 1.5 / 4;
  _noiseStepT = 0.004;

  _sphereR = width / 50;

  _count = 0;

  for (let i = 0; i < _aryCenter.length; i++) {
    let rotY = atan2(_aryCenter[i][2], _aryCenter[i][0]);
    let rx = (_aryCenter[i][2] ** 2 + _aryCenter[i][0] ** 2) ** 0.5;
    let ry = _aryCenter[i][1];
    let rotZ = atan2(ry, rx);
    _aryCentRotYZ[i] = [rotY, rotZ];
  }
}

window.setup = setup;
window.draw = draw;
window.mouseReleased = mouseReleased;
