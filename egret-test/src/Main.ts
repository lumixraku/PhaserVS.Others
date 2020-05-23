//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////



var ax = 0;
var ay = 0;
var imgW = 120;
var imgH = 120;
var frame = 5;
var startOffset = 180;
var gameWidth = 640;
var gameHeight = 1136;

var globalCfg = {
    imgCount: 3000,

    vRegionRange: 6.7,
    vRegionBase: 2.1,

    vMinRange: .5,
    vMinBase: .1,

    rRange: 2.1,
    rBase: .8
};

// 限制区域
var w = gameWidth - startOffset * 2;
var h = gameHeight - startOffset * 2;
var wHalf = w / 2;
var hHalf = h / 2;

let _regionActive = {
    x: startOffset,
    y: startOffset,
    width: w,
    height: h,
    bottom: startOffset + h,
    right: startOffset + w,
    xCen: startOffset + wHalf,
    yCen: startOffset + hHalf,
    wHalf: wHalf,
    hHalf: hHalf
};

var imageArr = [];
var imageStatusArr = [];

var ImageStatus = function () {
    this.dx = Math.random() > .5 ? -1 : 1;
    this.dy = Math.random() > .5 ? 1 : -1;
    this.updateVelocity();
};
ImageStatus.prototype.updateVelocity = function () {
    this.vMin = globalCfg.vMinBase + globalCfg.vMinRange * Math.random();
    this.vRegion = globalCfg.vRegionBase + globalCfg.vRegionRange * Math.random();
    this.rDelta =1 // (globalCfg.rBase + globalCfg.rRange * Math.random()) * (Math.random() > .5 ? 1 : -1);
};

var _countAdvance = 0;

class Main extends egret.DisplayObjectContainer {

    stats: any

    public constructor() {
        super();
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
    }

    private onAddToStage(event: egret.Event) {


        this.stats = new Stats();
        this.stats.setMode(0); // 0: fps, 1: ms, 2: mb
        // align top-left
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.left = '0px';
        this.stats.domElement.style.top = '0px';
        document.body.appendChild(this.stats.domElement);  


        egret.lifecycle.addLifecycleListener((context) => {
            // custom lifecycle plugin

            context.onUpdate = () => {
                this.update()
            }
        })

        egret.lifecycle.onPause = () => {
            egret.ticker.pause();
        }

        egret.lifecycle.onResume = () => {
            egret.ticker.resume();
        }

        this.runGame().catch(e => {
            console.log(e);
        })



    }

    private async runGame() {
        await this.loadResource()
        this.createGameScene();
        const result = await RES.getResAsync("description_json")
        // this.startAnimation(result);
        // await platform.login();
        // const userInfo = await platform.getUserInfo();
        // console.log(userInfo);

    }

    private async loadResource() {
        try {
            const loadingView = new LoadingUI();
            this.stage.addChild(loadingView);
            await RES.loadConfig("resource/default.res.json", "resource/");
            await RES.loadGroup("preload", 0, loadingView);
            this.stage.removeChild(loadingView);
        }
        catch (e) {
            console.error(e);
        }
      
    }

    private textfield: egret.TextField;


    createGameScene() {

        let stageW = this.stage.stageWidth;
        let stageH = this.stage.stageHeight;
                

        let sky = this.createBitmapByName("bg_jpg");
        this.addChild(sky);        
        let frameNames = ['EgretVS', 'EgretAndroid', 'EgretDragonBones', 'EgretEngine', 'EgretWing']
        let addRdmImg = () => {
            var ax = _regionActive.x + _regionActive.width * Math.random();
            var ay = _regionActive.y + _regionActive.height * Math.random();
            var frameIdx = Math.floor(Math.random() * 5);
            var frameName = frameNames[frameIdx]

            // var img = this.add.image(ax, ay, 'test', frame);
            var txtr: egret.Texture = RES.getRes("egret-group#" + frameName);
            var img: egret.Bitmap = new egret.Bitmap(txtr);
            img.x = ax
            img.y = ay
            this.addChild(img)

            img.rotation = 360 * Math.random();
            imageArr.push(img);
            imageStatusArr.push(new ImageStatus());

        }

        console.log('图片数目：', globalCfg.imgCount);
        for (var i = 0; i < globalCfg.imgCount; i++) {
            addRdmImg();
        }
    }

    update(){
            this.stats.begin();

            this.setImage();

            this.stats.end();        
    }

    setImage() {
        ++_countAdvance;

        if (_countAdvance % 1 == 0) {
            var image;
            var control;
            var xTo;
            var yTo;
            var xOff;
            var yOff;

            for (var i = imageArr.length - 1; i > -1; --i) {
                image = imageArr[i];
                control = imageStatusArr[i];

                image.rotation += control.rDelta * 180/Math.PI;


                xOff = control.dx * (control.vMin + control.vRegion * (1 - Math.abs(image.x - _regionActive.xCen) / _regionActive.wHalf));
                xTo = image.x + xOff;
                if (xTo > _regionActive.x && xTo < _regionActive.right) {
                    image.x = xTo;
                } else {
                    control.dx *= -1;
                    control.updateVelocity();
                }

                yOff = control.dy * (control.vMin + control.vRegion * (1 - Math.abs(image.y - _regionActive.yCen) / _regionActive.hHalf));
                yTo = image.y + yOff;

                if (yTo > _regionActive.y && yTo < _regionActive.bottom) {
                    image.y = yTo;
                } else {
                    control.dy *= -1;
                    control.updateVelocity();
                }

            }
        }
    }


    /**
     * 创建游戏场景
     * Create a game scene
     */
    private createGameSceneOOO() {
        let sky = this.createBitmapByName("bg_jpg");
        this.addChild(sky);
        let stageW = this.stage.stageWidth;
        let stageH = this.stage.stageHeight;
        sky.width = stageW;
        sky.height = stageH;

        let topMask = new egret.Shape();
        topMask.graphics.beginFill(0x000000, 0.5);
        topMask.graphics.drawRect(0, 0, stageW, 172);
        topMask.graphics.endFill();
        topMask.y = 33;
        this.addChild(topMask);

        let icon = this.createBitmapByName("egret_icon_png");
        this.addChild(icon);
        icon.x = 26;
        icon.y = 33;

        let line = new egret.Shape();
        line.graphics.lineStyle(2, 0xffffff);
        line.graphics.moveTo(0, 0);
        line.graphics.lineTo(0, 117);
        line.graphics.endFill();
        line.x = 172;
        line.y = 61;
        this.addChild(line);


        let colorLabel = new egret.TextField();
        colorLabel.textColor = 0xffffff;
        colorLabel.width = stageW - 172;
        colorLabel.textAlign = "center";
        colorLabel.text = "Hello Egret";
        colorLabel.size = 24;
        colorLabel.x = 172;
        colorLabel.y = 80;
        this.addChild(colorLabel);

        let textfield = new egret.TextField();
        this.addChild(textfield);
        textfield.alpha = 0;
        textfield.width = stageW - 172;
        textfield.textAlign = egret.HorizontalAlign.CENTER;
        textfield.size = 24;
        textfield.textColor = 0xffffff;
        textfield.x = 172;
        textfield.y = 135;
        this.textfield = textfield;


    }

    /**
     * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
     * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
     */
    private createBitmapByName(name: string) {
        let result = new egret.Bitmap();
        let texture: egret.Texture = RES.getRes(name);
        result.texture = texture;
        return result;
    }

    /**
     * 描述文件加载成功，开始播放动画
     * Description file loading is successful, start to play the animation
     */
    private startAnimation(result: string[]) {
        let parser = new egret.HtmlTextParser();

        let textflowArr = result.map(text => parser.parse(text));
        let textfield = this.textfield;
        let count = -1;
        let change = () => {
            count++;
            if (count >= textflowArr.length) {
                count = 0;
            }
            let textFlow = textflowArr[count];

            // 切换描述内容
            // Switch to described content
            textfield.textFlow = textFlow;
            let tw = egret.Tween.get(textfield);
            tw.to({ "alpha": 1 }, 200);
            tw.wait(2000);
            tw.to({ "alpha": 0 }, 200);
            tw.call(change, this);
        };

        change();
    }
}