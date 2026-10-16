import PIXI from '../_libs/pixi4.min.js';


const style = `[data-backdrop="halftone"].backdrop > div {
    opacity: 0;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

[data-backdrop="halftone"] .halftone_canvas {
    background-color: #000; 
    position: absolute;
    top: -1px;
    left: 0;
    width: 100%;
    height: calc( 100% + 1px );
    pointer-events:none;
}`

const styleTag = document.createElement('style');
styleTag.innerHTML = style;
document.head.appendChild(styleTag);

var halftone = Backbone.View.extend({
    template: _.template(''),

    deferredLoadEventName: 'halftone-load-complete',

    defaults : {
        "dot_scale": 53,
        "dot_gain": 48,
        "undercolor_removal": 95,
        "c_rand_offset_x": "0.89148018555716",
        "c_rand_offset_y": "-0.034963104873896",
        "m_rand_offset_x": "-0.45742203574628",
        "m_rand_offset_y": "-0.1833441699855",
        "y_rand_offset_x": "0.60032634017989",
        "y_rand_offset_y": "0.83121883729473",
        "color_shift": 94,
        "cyan": true,
        "cyan_halftone": true,
        "c_opacity": 70,
        "c_rotation": 140,
        "c_rot_speed": -1,
        "magenta": true,
        "magenta_halftone": true,
        "m_opacity": 69,
        "m_rotation": 42,
        "m_rot_speed": 1,
        "yellow": true,
        "yellow_halftone": true,
        "y_opacity": 99,
        "y_rotation": 59,
        "y_rot_speed": -1,
        "black": true,
        "black_halftone": false,
        "k_opacity": 100,
        "k_rotation": 91,
        "k_rot_speed": -1,
        "color": "rgba(51,51,51,0)",
        "hex": "#333333",
        "alpha": 0,
        "overlay_type": "multiply_color",
        "mouse_interaction": true,
        "image":'',
        "image_url": "https://static.cargo.site/assets/backdrop/default_256.jpg",
        "hires_image_url": "https://static.cargo.site/assets/backdrop/default_1024.jpg",
        "image_size": 256,
        "hires_image_size": 1536,

        "c_direction": 0,
        "k_direction": 90,
        "m_direction": 30,
        "scroll_interaction": true,
        "size": "cover",
        "y_direction": 60
    },

    drawFrameID: null,

    initialize: function() {

        this.image_load_queue = [];

        this.data = {
            inited: false,

            counter: 0,

            cmyk_rot_speed: {
                c: 0,
                m: 0,
                y: 0,
                k: 0
            },

            renderer: null,
            shader_inited: false,
            stage_wrapper: null,
            stage: null,
            stage_fore: null,
            loader: null,
            image_url: "/",
            hires_image_url: "/",
            is_mobile: false,
            bg_mask: null,
            foreground_multiplier: null,
            sprite: null,
            hires_sprite: null,

            image_size: {
                width: 800,
                height: 600
            },

            image_loaded: false,

            scroll_position: {
                x: 0,
                y: 0
            },

            mouse_offset: {
                top: 0,
                left: 0
            },

            model_speed : {
                x: 0,
                y: 0,
            },

            stage_size : {
                w: 800,
                h: 600,
                resolution: 1
            },

            movement_offset : {
                x: 0,
                y: 0
            },

            mouse_prev : {
                x: -1,
                y: -1
            },

            mouse_cur: {
                x: 0,
                y: 0
            },

            mouse_angle: 0,
            mouse_override: false,

            mouse_delta: {
                x: 0,
                y: 0,
                smooth_x: 0,
                smooth_y: 0,
                smooth_cumu_x: 0,
                smooth_cumu_y: 0
            }

        };
    
        var model_data = Object.assign({}, this.model.get('data'));
        model_data = _.defaults(model_data, this.defaults);
        this.model.set('data', model_data)
        this.render();

        this.listenTo(this.model, "reset", this.Init);
        this.makeCallbacks();

    },

    render: function() {

        var markup = this.template({
            settings : this.model.get('data')
        });

        this.$el.html( markup );

        return this;
    },

    loadImage: function(){

        $('.loading_animation', this.el).removeClass('hidden')

        var model_data = this.model.get('data');

        var _this = this;
        var hires_image_data
        var lowres_image_data
        // get image data and append image id to it for comparison

        hires_image_data = Cargo.Collection.Images.fetchWebGLImage(model_data.image, this.defaults.hires_image_size);

        // if image exists, use it and start loading
        if ( hires_image_data && model_data.image != 0 ){

            hires_image_data.id = model_data.image
            lowres_image_data = Cargo.Collection.Images.fetchWebGLImage(model_data.image, this.defaults.image_size);
            lowres_image_data.id = model_data.image

        } else {				

            // otherwise load it with the defaults and reset to 0
            hires_image_data = {
                w: 1024,
                h: 1024,
                url: this.defaults.hires_image_url,
                id: 0
            }

            lowres_image_data = {
                w: 200,
                h: 200,
                url: this.defaults.image_url,
                id: 0
            }	

            model_data.image = 0
            this.model.set('data', model_data)					
        }

        var lowres_image_object = new Image();
            lowres_image_object.crossOrigin = "";
    

        this.data.image_loaded = false;

        this.image_load_queue.push(
            lowres_image_data.id
        );

        // loading callback
        lowres_image_object.onload = function(){

            if(_this.destroyed) {
                return;
            }

            var last_image = _this.image_load_queue.pop() || 0;

            // Verify this is the latest image requested
            // This image does not match the most recently picked one, try again
            if ( _this.model.get('data').image != last_image ){
                _this.loadImage();
                return
            }

            // this image didn't finish loading before we picked a new one
            if( last_image != lowres_image_data.id) {
                return;
            }

            _this.image_load_queue = []

            // set image data
            _this.data.image_size.width = hires_image_data.w;
            _this.data.image_size.height = hires_image_data.h;

            var texture = new PIXI.Texture.fromImage(lowres_image_object.src);
            _this.data.blur_sprite = new PIXI.Sprite(texture);

            var hires_image_object = new Image();

            hires_image_object.crossOrigin = "";

            hires_image_object.onload = function(){
                var texture = new PIXI.Texture.fromImage(hires_image_object.src);

                _this.data.hires_sprite = new PIXI.Sprite(texture);

                // finish setup
                _this.data.image_loaded = true;
                _this.finishSetup();
                                
            }

            hires_image_object.src = hires_image_data.url;

        }


        // Init loading of image by assigning source
        lowres_image_object.src = lowres_image_data.url;
    },	


    finishSetup: function(){
        // finish setup
        this.data.blur_sprite.filters = [new PIXI.filters.BlurFilter()];

        this.data.renderTexture = new PIXI.RenderTexture(this.data.renderer, this.data.blur_sprite.width, this.data.blur_sprite.height);
        this.data.sprite = new PIXI.Sprite(this.data.renderTexture);

        this.data.loading_image = false;

        this.resizeImage();
        this.makeStage();
        this.setupShader();
        

        if ( this.in_viewport){
            this.Resume();
        } else {
            this.Pause();
        }	

        Cargo.Event.trigger("hide_loading_anim");
    },

    isPowerOfTwo: function(x) {
        return (x & (x - 1)) == 0;
    },

    nextHighestPowerOfTwo: function(x) {
        --x;
        for (var i = 1; i < 32; i <<= 1) {
            x = x | x >> i;
        }
        // maximum dimensions are 2048 x 2048
        return Math.min(x + 1, 2048);
    },

    setupShader:function(){
        var _this = this;
        this.data.shader_inited = false;

        var CMYKSeparate = new PIXI.Filter(

            // no vertex shader
            '',

            // fragment shader
            [

                "#ifdef GL_ES",
                "precision mediump float;",
                "#endif",

                "varying vec2 vTextureCoord;", // Texcoords

                "uniform float imgAspect;", // image aspect ratio


                // cmyk opacity, 0-1
                "uniform float c_opacity;",
                "uniform float m_opacity;",
                "uniform float y_opacity;",
                "uniform float k_opacity;",

                // cmyk move offset, -1 / 1
                "uniform vec2 move_offset;",

                // misalignment for color layers
                "uniform vec2 c_rand_offset;",
                "uniform vec2 m_rand_offset;",
                "uniform vec2 y_rand_offset;",

                // activate color layers
                "uniform int c_on;",
                "uniform int m_on;",
                "uniform int y_on;",
                "uniform int k_on;",

                // undercolor removal, 0-1
                "uniform float undercolor;",

                "uniform sampler2D uSampler;", // image


                "void main() {",

                    // place origin at center of image
                    "vec2 st2 = vTextureCoord +vec2(-0.5, -0.5);",

    //              aspect ratio calculation
                    "if (imgAspect < 1.0 ){",
                        "st2 = st2 * mat2(imgAspect, 0.0, 0.0, 1.0);",
                    "} else {",
                        "st2 = st2 * mat2(1.0, 0.0, 0, 1.0/imgAspect);",
                    "};",

                    "vec2 Kst = st2 + move_offset;",
                    "vec2 Cst = st2 + move_offset*0.8;",
                    "vec2 Mst = st2 + move_offset*0.6;",
                    "vec2 Yst = st2 + move_offset*0.4;",

                    // Use a texture to modulate size of dots
                    // offset texture to get misalignment effect
                    "vec3 texcolor = texture2D(uSampler, vTextureCoord).rgb;",
                    "vec3 c_texcolor = texture2D(uSampler, vTextureCoord+vec2(c_rand_offset.x, c_rand_offset.y)).rgb;",
                    "vec3 m_texcolor = texture2D(uSampler, vTextureCoord+vec2(m_rand_offset.x, m_rand_offset.y)).rgb;",
                    "vec3 y_texcolor = texture2D(uSampler, vTextureCoord+vec2(y_rand_offset.x, y_rand_offset.y)).rgb;",

                    "float radius = sqrt(1.0-texcolor.g);",

                    // Making CMYK - C
                    "float c = 0.0;",
                    "if (c_on > 0){",
                        "vec4 c_cmyk;",
                        "c_cmyk.xyz = 1.0 - c_texcolor;",
                        "c_cmyk.w = min(c_cmyk.x, min(c_cmyk.y, c_cmyk.z))*undercolor;", // Create K
                        "c_cmyk.xyz -= c_cmyk.w;", // Subtract K equivalent from CMY

                        "c = c_cmyk.x*c_opacity;",
                    "};",


                    // Making CMYK - M
                    "float m = 0.0;",
                    "if (m_on > 0){",
                        "vec4 m_cmyk;",
                        "m_cmyk.xyz = 1.0 - m_texcolor;",
                        "m_cmyk.w = min(m_cmyk.x, min(m_cmyk.y, m_cmyk.z))*undercolor;", // Create K
                        "m_cmyk.xyz -= m_cmyk.w;", // Subtract K equivalent from CMY

                        "m = m_cmyk.y*m_opacity;",
                    "};",

                    // Making CMYK - Y
                    "float y = 0.0;",
                    "if (y_on > 0){",
                        "vec4 y_cmyk;",
                        "y_cmyk.xyz = 1.0 - y_texcolor;",
                        "y_cmyk.w = min(y_cmyk.x, min(y_cmyk.y, y_cmyk.z))*undercolor;", // Create K
                        "y_cmyk.xyz -= y_cmyk.w;", // Subtract K equivalent from CMY

                        "y = y_cmyk.z*y_opacity;",
                    "};",

                    // Making CMYK - K

                    "float k = 0.0;",
                    "if (k_on > 0){",

                        "vec4 cmyk;",
                        "cmyk.xyz = 1.0 - texcolor;",
                        "cmyk.w = min(cmyk.x, min(cmyk.y, cmyk.z));", // Create K
                        "cmyk.xyz -= cmyk.w;", // Subtract K equivalent from CMY

                        "k = cmyk.w*k_opacity;",

                    "};",

                    "vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);",
                    "vec4 white = vec4(1.0, 1.0, 1.0, 1.0);",
                    "vec4 transwhite = vec4(1.0,1.0,1.0,0.0);",

                    "vec4 black = vec4(0.0, 0.0, 0.0, 1.0);",
                    "vec4 cyan = vec4(0.0, 0.686, 0.925, 1.0);",
                    "vec4 magenta = vec4(0.917, 0.078, 0.54, 1.0);",
                    "vec4 yellow = vec4(1.0, 0.941, 0.164, 1.0);",

                    // probably not super efficient, but there we go.
    //              "vec4 rgbscreen = white;",

                    "vec4 rgbscreen = mix(white, yellow, y);",
                    "rgbscreen = rgbscreen * mix(white, magenta, m);",
                    "rgbscreen = rgbscreen * mix(white, cyan, c);",
                    "rgbscreen = rgbscreen * mix(white, black, k);",
                    "rgbscreen = 1.0-rgbscreen;",

                    "gl_FragColor = rgbscreen;",
                "}"



            ].join('\n'),

            // custom  uniforms

            {
                imgAspect:  { type: 'f', value: 1.333 },


                c_opacity:      { type: 'f', value: 0 },
                m_opacity:      { type: 'f', value: 0 },
                y_opacity:      { type: 'f', value: 0 },
                k_opacity:      { type: 'f', value: 0 },

                c_on:      { type: 'i', value: 1 },
                m_on:      { type: 'i', value: 1 },
                y_on:      { type: 'i', value: 1 },
                k_on:      { type: 'i', value: 1 }, // HTT 4 life

                undercolor: {type: 'f', value: 1.0},

                c_rand_offset:      { type: 'v2', value: new Float32Array([0.0, 0.0]) },
                m_rand_offset:      { type: 'v2', value: new Float32Array([0.0, 0.0]) },
                y_rand_offset:      { type: 'v2', value: new Float32Array([0.0, 0.0]) },

                move_offset:      { type: 'v2', value: new Float32Array([0.0, 0.0]) },
            }

        );



        var HalfToner = new PIXI.Filter(
            // no vertex shader
            '',

            // fragment shader
            [


                "#ifdef GL_ES",
                "precision mediump float;",
                "#endif",

                "varying vec2 vTextureCoord;", // Texcoords

                "uniform float imgAspect;", // image aspect ratio
                "uniform vec2 dimensions;",
                "uniform vec4 filterArea;",

                // cmyk angles, in radians
                "uniform float c_angle;",
                "uniform float m_angle;",
                "uniform float y_angle;",
                "uniform float k_angle;",

                // dot gain or reduction
                "uniform float dot_gain;",

                // cmyk opacity, 0-1
                "uniform float c_opacity;",
                "uniform float m_opacity;",
                "uniform float y_opacity;",
                "uniform float k_opacity;",

                // cmyk move offset, -1 / 1
                "uniform vec2 move_offset;",

                // misalignment for color layers
                "uniform vec2 c_rand_offset;",
                "uniform vec2 m_rand_offset;",
                "uniform vec2 y_rand_offset;",

                // activate color layers
                "uniform int c_on;",
                "uniform int m_on;",
                "uniform int y_on;",
                "uniform int k_on;",

                // undercolor removal, 0-1
                "uniform float undercolor;",



                "uniform sampler2D uSampler;", // image

                // Distance to nearest point in a grid of
                // (frequency x frequency) points over the unit square
                "uniform float frequency;",

                "float aastep(float threshold, float value) {",
                  "float afwidth = (frequency*.0015) ;",
                  "return smoothstep(threshold-afwidth, threshold+afwidth, value);",
                "}",

                "void main() {",

                    "vec2 mapCoord = vTextureCoord * ( filterArea.xy / dimensions.xy );",


                    // place origin at center of image
                    "vec2 st2 = mapCoord +vec2(-0.5, -0.5);",

    //              aspect ratio calculation
                    "if (imgAspect < 1.0 ){",
                        "st2 = st2 * mat2(imgAspect, 0.0, 0.0, 1.0);",
                    "} else {",
                        "st2 = st2 * mat2(1.0, 0.0, 0, 1.0/imgAspect);",
                    "};",

                    "vec2 Kst = st2 + move_offset;",
                    "vec2 Cst = st2 + move_offset*0.8;",
                    "vec2 Mst = st2 + move_offset*0.6;",
                    "vec2 Yst = st2 + move_offset*0.4;",



                    // Use a texture to modulate size of dots
                    // offset texture to get misalignment effect
                    "vec3 texcolor = texture2D(uSampler, vTextureCoord).rgb;",
                    "vec3 c_texcolor = texture2D(uSampler, clamp( vTextureCoord+vec2(c_rand_offset.x, c_rand_offset.y) , vec2(0.005, 0.005) , vTextureCoord.xy ) ).rgb;",
                    "vec3 m_texcolor = texture2D(uSampler, clamp( vTextureCoord+vec2(m_rand_offset.x, m_rand_offset.y) , vec2(0.005, 0.005) , vTextureCoord.xy ) ).rgb;",
                    "vec3 y_texcolor = texture2D(uSampler, clamp( vTextureCoord+vec2(y_rand_offset.x, y_rand_offset.y) , vec2(0.005, 0.005) , vTextureCoord.xy ) ).rgb;",

                    "float radius = sqrt(1.0-texcolor.g);",

                    // Making CMYK - C
                    "float c = 0.0;",
                    "if (c_on > 0){",
                        "vec4 c_cmyk;",
                        "c_cmyk.xyz = 1.0 - c_texcolor;",

                        // xyz = cmy
                        "c_cmyk.w = min(c_cmyk.x, min(c_cmyk.y, c_cmyk.z))*undercolor;", // Create K?

                        "c_cmyk.xyz -= (c_cmyk.w+.01);", // Subtract K equivalent from CMY , plus a little to avoid dots on white

                        "Cst = frequency*mat2(cos(c_angle), sin(c_angle), sin(c_angle)*-1.0, cos(c_angle))*Cst;",
                        "vec2 Cuv = 2.0*fract(Cst)-1.0;",
                        "c = aastep(0.0, sqrt(c_cmyk.x)*dot_gain-length(Cuv))*c_opacity;",
                    "};",


                    // Making CMYK - M
                    "float m = 0.0;",
                    "if (m_on > 0){",
                        "vec4 m_cmyk;",
                        "m_cmyk.xyz = 1.0 - m_texcolor;",
                        "m_cmyk.w = min(m_cmyk.x, min(m_cmyk.y, m_cmyk.z))*undercolor;", // Create K
                        "m_cmyk.xyz -= (m_cmyk.w+.01);", // Subtract K equivalent from CMY

                        "Mst = frequency*mat2(cos(m_angle), sin(m_angle), sin(m_angle)*-1.0, cos(m_angle))*Mst;",
                        "vec2 Muv = 2.0*fract(Mst)-1.0;",
                        "m = aastep(0.0, sqrt(m_cmyk.y)*dot_gain-length(Muv))*m_opacity;",
                    "};",

                    // Making CMYK - Y
                    "float y = 0.0;",
                    "if (y_on > 0){",
                        "vec4 y_cmyk;",
                        "y_cmyk.xyz = 1.0 - y_texcolor;",
                        "y_cmyk.w = min(y_cmyk.x, min(y_cmyk.y, y_cmyk.z))*undercolor;", // Create K
                        "y_cmyk.xyz -= (y_cmyk.w+.01);", // Subtract K equivalent from CMY

                        "Yst = frequency*mat2(cos(y_angle), sin(y_angle), sin(y_angle)*-1.0, cos(y_angle))*Yst;",
                        "vec2 Yuv = 2.0*fract(Yst)-1.0;",
                        "y = aastep(0.0, sqrt(y_cmyk.z)*dot_gain-length(Yuv))*y_opacity;",
                    "};",

                    // Making CMYK - K

                    "float k = 0.0;",
                    "if (k_on > 0){",

                        "vec4 cmyk;",
                        "cmyk.xyz = 1.0 - texcolor;",
                        "cmyk.w = min(cmyk.x, min(cmyk.y, cmyk.z))-0.01;", // Create K
                        "cmyk.xyz -= cmyk.w;", // Subtract K equivalent from CMY

                        "Kst = frequency*1.05*mat2(cos(k_angle), sin(k_angle), sin(k_angle)*-1.0, cos(k_angle))*Kst;",
                        "vec2 Kuv = 2.0*fract(Kst)-1.0;",
                        "k = (aastep(0.0, sqrt(cmyk.w)*dot_gain*(undercolor+.01)-length(Kuv) )  )*k_opacity ;",

                    "};",


                    "vec4 white = vec4(1.0, 1.0, 1.0, 1.0);",

                    "vec4 black = vec4(0.0, 0.0, 0.0, 1.0);",
                    "vec4 cyan = vec4(0.0, 0.686, 0.925, 1.0);",
                    "vec4 magenta = vec4(0.917, 0.078, 0.54, 1.0);",
                    "vec4 yellow = vec4(1.0, 0.941, 0.164, 1.0);",


                    // probably not super efficient, but there we go.
    //              "vec4 rgbscreen = white;",

                    "vec4 rgbscreen = mix(white, yellow, y);",
                    "rgbscreen = rgbscreen * mix(white, magenta, m);",
                    "rgbscreen = rgbscreen * mix(white, cyan, c);",
                    "rgbscreen = rgbscreen * mix(white, black, k);",
                    "rgbscreen.rgb = 1.0-rgbscreen.rgb;",

                    "gl_FragColor = rgbscreen;",

                "}"



            ].join('\n'),

            // custom  uniforms

            {
                imgAspect:  { type: 'f', value: 1.333 },
                frequency:  { type: 'f', value: 100.0 },


                c_angle:      { type: 'f', value: 0 },
                m_angle:      { type: 'f', value: 0 },
                y_angle:      { type: 'f', value: 0 },
                k_angle:      { type: 'f', value: 0 },

                dot_gain:       {type: 'f', value: 1},

                c_opacity:      { type: 'f', value: 0 },
                m_opacity:      { type: 'f', value: 0 },
                y_opacity:      { type: 'f', value: 0 },
                k_opacity:      { type: 'f', value: 0 },

                c_on:      { type: 'i', value: 1 },
                m_on:      { type: 'i', value: 1 },
                y_on:      { type: 'i', value: 1 },
                k_on:      { type: 'i', value: 1 }, // HTT 4 life

                undercolor: {type: 'f', value: 1.0},


                c_rand_offset:      { type: 'v2', value: new Float32Array([0.0, 0.0]) },
                m_rand_offset:      { type: 'v2', value: new Float32Array([0.0, 0.0]) },
                y_rand_offset:      { type: 'v2', value: new Float32Array([0.0, 0.0]) },

                move_offset:      { type: 'v2', value: new Float32Array([0.0, 0.0]) },
                dimensions:     {type: 'v2', value: new PIXI.Matrix()},

            }

        );

        var _this = this;
        HalfToner.apply = function(filterManager, input, output, clear)
        {

          this.uniforms.dimensions[0] = _this.data.stage_size.w
          this.uniforms.dimensions[1] = _this.data.stage_size.h

          filterManager.applyFilter(this, input, output, clear);
        }

        this.data.sprite.padding = 30;
        // add filter to sprite
        this.data.sprite.filters = null;
        this.data.sprite.filters = [HalfToner];

        this.data.hires_sprite.filters = null;
        this.data.hires_sprite.filters = [CMYKSeparate];

        this.data.stage.filters = null;

        this.data.stage.filters = [new PIXI.filters.ColorMatrixFilter()];
        var colorMatrix = [
                -1,0,0,0,1,       // 0-4     R
                0,-1,0,0,1,       // 5-9     G
                0,0,-1,0,1,       // 10-14   B
                0,0,0,1,0        // 15-19   A
            ];
        this.data.stage.filters[0].matrix = colorMatrix;

        this.data.sprite.renderable = true;
        this.data.hires_sprite.renderable = true;

        this.data.shader_inited = true;
        this.setShaderValues();

        setTimeout(function(){
            $('.loading_animation', _this.el).addClass('hidden')
            Cargo.Event.trigger(_this.deferredLoadEventName);
        }, 100)

    },

    makeStage: function(){
        this.data.stage.removeChildren();
        this.data.stage_fore.removeChildren();
        this.data.stage_wrapper.removeChildren();

        this.data.bg_mask.renderable = false;
        this.data.bg_mask.texture = PIXI.Texture.fromImage('https://static.cargo.site/assets/backdrop/halftone/blackmask.png');

        this.data.foreground_multiplier = new PIXI.Graphics();
        this.data.foreground_multiplier.alpha = 0;
        this.data.foreground_multiplier.beginFill(0xFFFFFF);
        this.data.foreground_multiplier.drawRect(0,0,1,1);
        this.data.foreground_multiplier.endFill();
        this.changeOverlayColor();

        this.data.stage.addChild(this.data.bg_mask);

        this.data.stage.addChild(this.data.sprite);


        this.data.stage.addChild(this.data.hires_sprite);

        this.data.stage_fore.addChild(this.data.foreground_multiplier);

        this.data.stage_wrapper.addChild(this.data.stage);
        this.data.stage_wrapper.addChild(this.data.stage_fore);
        this.resizeImage();

    },

    resizeImage: function() {

        if ( !this.data.image_loaded ){
            return;
        }

        var _offset = 4;
        // var _size = this.model.get("data").size;
        var _size = 'cover'
        var _limit = false;
        var _center = true;
        var _origHeight = this.data.image_size.height;
        var _origWidth = this.data.image_size.width;
        var _height = 0;
        var _width = 0;
        var _marginTop = 0;
        var _marginLeft = 0;
        var _check = null;

        var _parent = {
            h: this.data.stage_size.h + _offset,
            w: this.data.stage_size.w + _offset
        }

        var _ratio = {

            y: this.data.image_size.width / this.data.image_size.height,
            x: this.data.image_size.height / this.data.image_size.width
        };

        // Image mode
        if (_size === 'contain' || _size === 'none') {
            _check = (_parent.w / _parent.h) > _ratio.y;
        } else if (_size === 'cover') {
            _check = (_parent.w / _parent.h) < _ratio.y;
        }

        // None
        if (_size === 'none') {
            _limit = true;
        }

        if (_check) {
            // Tall
            _height = Math.ceil(_parent.h);
            _width = Math.ceil(_parent.h * _ratio.y);
        } else {
            // Wide
            _height = Math.ceil(_parent.w * _ratio.x);
            _width = Math.ceil(_parent.w);
        }

        if ((_size === 'contain' || _size === 'none') && _limit) {
            if (_height > _origHeight) {
                _height = _origHeight;
            }
            if (_width > _origWidth) {
                _width = _origWidth;
            }
        }

        // fudging values a bit so that the sprite overhangs by a couple pixels
        if (! _center && (_size === 'contain' || _size === 'none')) {
            _marginTop = (_offset / 2) * -1;
            _marginLeft = (_offset / 2) * -1;
        } else {
            _marginTop = Math.ceil((_parent.h - _height) / 2 - (_offset / 2));
            _marginLeft = Math.ceil((_parent.w - _width) / 2 - (_offset / 2));
        }



        this.data.foreground_multiplier.width = this.data.stage_size.w;
        this.data.foreground_multiplier.height = this.data.stage_size.h;

        this.data.bg_mask.height = _height;
        this.data.bg_mask.width = _width;
        this.data.bg_mask.x = _marginLeft;
        this.data.bg_mask.y = _marginTop;
        this.data.bg_mask.renderable = true;

        this.data.sprite.height = _height;
        this.data.sprite.width = _width;
        this.data.sprite.x = _marginLeft;
        this.data.sprite.y = _marginTop;

        this.data.hires_sprite.height = _height;
        this.data.hires_sprite.width = _width;
        this.data.hires_sprite.x = _marginLeft;
        this.data.hires_sprite.y = _marginTop;

    
        

    },


    setShaderValues: function(){

        var model_data = this.model.get('data');

        this.data.cmyk_rot_speed= {
            c: model_data.c_rot_speed * Math.PI/180 * -0.016,
            m: model_data.m_rot_speed * Math.PI/180 * -0.016,
            y: model_data.y_rot_speed * Math.PI/180 * -0.016,
            k: model_data.k_rot_speed * Math.PI/180 * -0.016
        }

        var cmyk_on = {};
        if (model_data.cyan ){
            if (model_data.cyan_halftone){
                cmyk_on.c = 1;
                cmyk_on.c_key = 0;
            } else {
                cmyk_on.c = 0;
                cmyk_on.c_key = 1;
            }
        } else {
            cmyk_on.c = 0;
            cmyk_on.c_key = 0;
        }

        if (model_data.magenta ){
            if (model_data.magenta_halftone){
                cmyk_on.m = 1;
                cmyk_on.m_key = 0;
            } else {
                cmyk_on.m = 0;
                cmyk_on.m_key = 1;
            }
        } else {
            cmyk_on.m = 0;
            cmyk_on.m_key = 0;
        }

        if (model_data.yellow ){
            if (model_data.yellow_halftone){
                cmyk_on.y = 1;
                cmyk_on.y_key = 0;
            } else {
                cmyk_on.y = 0;
                cmyk_on.y_key = 1;
            }
        } else {
            cmyk_on.y = 0;
            cmyk_on.y_key = 0;
        }


        if (model_data.black ){
            if (model_data.black_halftone){
                cmyk_on.k = 1;
                cmyk_on.k_key = 0;
            } else {
                cmyk_on.k = 0;
                cmyk_on.k_key = 1;
            }
        } else {
            cmyk_on.k = 0;
            cmyk_on.k_key = 0;
        }

        if ( this.data.shader_inited && this.data.image_loaded) {

            var screen_size = model_data.dot_scale*.01;

            const blurUniforms = this.data.blur_sprite.filters[0];
            const spriteUniforms = this.data.sprite.filters[0].uniforms;
            const hiresSpriteUniforms = this.data.hires_sprite.filters[0].uniforms;

            blurUniforms.passes = Math.floor(5*screen_size*screen_size)+1;
            blurUniforms.blur = Math.floor(2*screen_size*screen_size*screen_size*screen_size*screen_size)+.5;
            blurUniforms.padding = 0;

            this.data.renderTexture.render(this.data.blur_sprite);

            spriteUniforms.imgAspect = this.data.stage_size.w/this.data.stage_size.h
            hiresSpriteUniforms.imgAspect = this.data.stage_size.w/this.data.stage_size.h;

            spriteUniforms.dot_gain = model_data.dot_gain/100 + 1.01;


            spriteUniforms.c_on = cmyk_on.c;
            spriteUniforms.m_on = cmyk_on.m;
            spriteUniforms.y_on = cmyk_on.y;
            spriteUniforms.k_on = cmyk_on.k;

            spriteUniforms.undercolor = model_data.undercolor_removal*.01;


            hiresSpriteUniforms.c_on = cmyk_on.c_key;
            hiresSpriteUniforms.m_on = cmyk_on.m_key;
            hiresSpriteUniforms.y_on = cmyk_on.y_key;
            hiresSpriteUniforms.k_on = cmyk_on.k_key;

            spriteUniforms.c_opacity = model_data.c_opacity*.01;
            spriteUniforms.m_opacity = model_data.m_opacity*.01;
            spriteUniforms.y_opacity = model_data.y_opacity*.01;
            spriteUniforms.k_opacity = model_data.k_opacity*.01;

            hiresSpriteUniforms.c_opacity	= spriteUniforms.c_opacity;
            hiresSpriteUniforms.m_opacity	= spriteUniforms.m_opacity;
            hiresSpriteUniforms.y_opacity	= spriteUniforms.y_opacity;
            hiresSpriteUniforms.k_opacity	= spriteUniforms.k_opacity;

            hiresSpriteUniforms.undercolor = model_data.undercolor_removal*.01;

        }

    },

    updateShaderAnimation: function(){

        var model_data = this.model.get('data');

        if ( this.data.shader_inited) {

            const spriteUniforms = this.data.sprite.filters[0].uniforms;
            const hiresSpriteUniforms = this.data.hires_sprite.filters[0].uniforms;

            var dot_scale = model_data.dot_scale;
            var dot_scale_down = dot_scale *.0015 + .01;

            if ( model_data.mouse_interaction ){

                spriteUniforms.move_offset = new Float32Array( [this.data.scroll_position.x*.0005+ (this.data.mouse_prev.x * -dot_scale_down) / this.data.stage_size.w, this.data.scroll_position.y*.0005+ (this.data.mouse_prev.y * -dot_scale_down) / this.data.stage_size.h ] );
            } else {
                spriteUniforms.move_offset = new Float32Array([0,1]);
            }

            var shiftX = 1.6*(this.data.mouse_prev.y/this.data.stage_size.h - 0.5)*(this.data.stage_size.h/window.innerHeight) + -.4 * (this.data.mouse_prev.x/this.data.stage_size.w - 0.5)*(this.data.stage_size.w/window.innerWidth);
            var shiftY = 1.6*(this.data.mouse_prev.x/this.data.stage_size.w - 0.5)*(this.data.stage_size.w/window.innerWidth) + -.4 * (this.data.mouse_prev.y/this.data.stage_size.h - 0.5)*(this.data.stage_size.h/window.innerHeight);
            shiftX = Math.cos(shiftX*Math.PI);
            shiftY = Math.cos(shiftX)*shiftY;

            var color_shift = (100-model_data.color_shift)*0.00075;

            spriteUniforms.c_rand_offset = new Float32Array([model_data.c_rand_offset_x*color_shift*shiftX, model_data.c_rand_offset_y*color_shift*shiftY ]);
            spriteUniforms.m_rand_offset = new Float32Array([model_data.m_rand_offset_x*color_shift*shiftX, model_data.m_rand_offset_y*color_shift*shiftY ]);
            spriteUniforms.y_rand_offset = new Float32Array([model_data.y_rand_offset_x*color_shift*shiftX, model_data.y_rand_offset_y*color_shift*shiftY ]);

            hiresSpriteUniforms.c_rand_offset = new Float32Array([model_data.c_rand_offset_x*color_shift*shiftX, model_data.c_rand_offset_y*color_shift*shiftY ]);
            hiresSpriteUniforms.m_rand_offset = new Float32Array([model_data.m_rand_offset_x*color_shift*shiftX, model_data.m_rand_offset_y*color_shift*shiftY ]);
            hiresSpriteUniforms.y_rand_offset = new Float32Array([model_data.y_rand_offset_x*color_shift*shiftX, model_data.y_rand_offset_y*color_shift*shiftY ]);

            spriteUniforms.imgAspect = this.data.stage_size.w/this.data.stage_size.h
            spriteUniforms.c_angle = model_data.c_rotation* (Math.PI/180) + this.data.cmyk_rot_speed.c * this.data.counter;
            spriteUniforms.m_angle = model_data.m_rotation* (Math.PI/180) + this.data.cmyk_rot_speed.m * this.data.counter;
            spriteUniforms.y_angle = model_data.y_rotation* (Math.PI/180) + this.data.cmyk_rot_speed.y * this.data.counter;
            spriteUniforms.k_angle = model_data.k_rotation* (Math.PI/180) + this.data.cmyk_rot_speed.k * this.data.counter;

            spriteUniforms.frequency = (100-dot_scale)*1.9+10;

            hiresSpriteUniforms.imgAspect = spriteUniforms.imgAspect;
            hiresSpriteUniforms.frequency = spriteUniforms.frequency;

        }
    },

    changeOverlayColor: function() {
        var model_data = _.clone(this.model.get('data') );

        this.data.renderer.backgroundColor = "0xFFFFFF";

        this.data.foreground_multiplier.tint = model_data.hex.replace('#', '0x');
        this.data.foreground_multiplier.alpha = model_data.alpha;

        var overlay_type = model_data.overlay_type;

        if ( overlay_type == "multiply_color") {
            this.data.foreground_multiplier.blendMode = PIXI.BLEND_MODES.MULTIPLY;
        } else if ( overlay_type == "screen_color"){
            this.data.foreground_multiplier.blendMode = PIXI.BLEND_MODES.SCREEN;
        } else {
            this.data.foreground_multiplier.blendMode = PIXI.BLEND_MODES.NORMAL;
        }

    },

    updateMotion: function() {

        var velocity = 0;

        var rad_direction = 0;

// 			if ( this.data.mouse_override == true ) {
            rad_direction += this.data.mouse_angle ;
// 			} else {
// 				rad_direction += (this.model.get("direction")*-1 )  * (Math.PI / 180) ;
// 			};


        this.data.model_speed = {
             x: Math.cos(rad_direction) * velocity,
             y: Math.sin(rad_direction) * velocity
        }

        this.data.movement_offset = {
             x: Math.cos(rad_direction)*velocity + this.data.movement_offset.x,
             y: Math.sin(rad_direction)*velocity + this.data.movement_offset.y
        }


    },

    updateScrollOffset: function() {

        var scrollTop = $(window).scrollTop()*0.1;
        var scrollLeft = $(window).scrollLeft() * 0.1;

        if ( scrollTop != 0 ){
            this.data.scroll_position.y = scrollTop;
        }

        if ( scrollLeft != 0){
            this.data.scroll_position.x = scrollLeft;
        }


    },

    updateMouseOffset: function(e){

        // if no mouse, then no mouse
        if ( !this.model.get('data').mouse_interaction ) {
            return;
        }

        if(e){
            this.data.mouse_cur = {
                x: e.clientX - this.data.mouse_offset.left,
                y: e.clientY - this.data.mouse_offset.top
            };				
        }


        this.data.mouse_prev = {
            x: this.data.mouse_cur.x*.05 + this.data.mouse_prev.x*.95,
            y: this.data.mouse_cur.y*.05 + this.data.mouse_prev.y*.95
        }

        this.data.mouse_calced = true;

    },

    SetSizeFromMainView: function(width, height){

        var resolution = window.devicePixelRatio;
        var pixels = width*resolution * height * resolution;
        var hdPixels = 1920 * 1080 * 3

        if(
            pixels  > hdPixels
        ){
            var scaleDown = Math.sqrt(hdPixels/pixels);

            width = Math.ceil(width*scaleDown);
            height= Math.ceil(height*scaleDown);
            
        }

        if ( this.data.stage_size.w != width || this.data.stage_size.h != height || resolution != this.data.stage_size.resolution || this.data.stage_size.force_update == true){

            this.queuedResize = [width,height];

        }
    },

    Pause: function(){
        window.cancelAnimationFrame(this.drawFrameID);
        this.paused = true;
    },

    Resume: function(){
        
        cancelAnimationFrame(this.drawFrameID);
        this.draw();
        this.paused = false;

    },

    draw: function(){
        var _this = this;

        this.drawFrameID = window.requestAnimationFrame(function(){
            if( _this.queuedResize){

                var width = _this.queuedResize[0];
                var height = _this.queuedResize[1];

                _this.data.mouse_offset.top = width;
                _this.data.mouse_offset.left = height;

                _this.data.stage_size.w = width;
                _this.data.stage_size.h = height;
                _this.resizeImage();

                _this.data.renderer.resize(width,height);
                _this.queuedResize = null;
            }


            _this.draw();

            _this.data.counter++;
            
            _this.updateMotion();
            if ( _this.data.mouse_calced == false ){
                _this.updateMouseOffset();
            }
            _this.data.mouse_calced = false;

            _this.updateShaderAnimation();

            _this.data.renderer.render(_this.data.stage_wrapper);

        });

    },


    makeCallbacks: function() {
        this.SetSizeFromMainView = this.SetSizeFromMainView.bind(this);
        this.scrollCallback = this.updateScrollOffset.bind(this);
        this.mouseCallback = this.updateMouseOffset.bind(this);
    },


    // Do everything in here

    Init: function() {
        Cargo.Event.trigger("show_loading_anim");

        var _this = this;

        this.data.shader_inited = false;
        this.data.renderer = PIXI.autoDetectRenderer(800, 600, {resolution: window.devicePixelRatio});

        this.data.stage_wrapper= new PIXI.Container();
        this.data.stage = new PIXI.Container();
        this.data.stage_fore = new PIXI.Container();
        this.data.loader = PIXI.loader;

        this.data.loading_image = false;


        this.data.bg_mask = new PIXI.Sprite();
/*
        this.data.sprite = new PIXI.Sprite();
        this.data.hires_sprite = new PIXI.Sprite();
*/
        this.data.foreground_multiplier = new PIXI.Graphics();



        this.loadImage();

        this.setShaderValues();
        this.changeOverlayColor();

        this.el.appendChild(this.data.renderer.view);
        this.data.renderer.backgroundColor = "0xFFFFFF";
        this.data.renderer.view.classList.add('halftone_canvas');

        // Set up sprite and filter
        if (this.model.get("data").scroll_interaction == true) {
            window.addEventListener("scroll", this.scrollCallback);
        }

        if ( Cargo.Helper.isMobile() ){
            this.data.is_mobile = true;
        } 

        window.addEventListener("pointermove", this.mouseCallback);
        

    },


    Update: function(name, value) {

        var model_data = _.clone(this.model.get('data'))
        var prev_value = model_data[name]

        model_data[name] = value;

        this.model.set('data', model_data);


        if ( name =="image"){
            if ( value == prev_value ){
                
                return;
            }

            Cargo.Event.trigger("show_loading_anim");
            this.data.image_loaded = false;
            this.loadImage();
        }

        if ( name=="image_delete" && model_data['image'] == value ){
            model_data['image'] = ''
            this.model.set('data', model_data)
            this.data.image_loaded = false;				
            this.loadImage();				
        }				

        if (name =="direction" || name=="target_speed" || name=="mouse_interaction" || name=="scroll_interaction" ){
            this.data.mouse_override = false;
        }

        if (name == "size"){
            this.resizeImage();
        }

        if (name == "hex" || name === "alpha" || name == "overlay_type"){
            this.changeOverlayColor();
        }

        if (name == "scroll_interaction") {
            this.data.scroll_position = {
                x: 0,
                y: 0
            }

            window.removeEventListener("scroll", this.scrollCallback );

            if ( value == true){
                window.addEventListener("scroll", this.scrollCallback );
            }
        }


        this.setShaderValues();


    },

    destroy: function(){
        this.image_load_queue = [];
        this.data.shader_inited = false;

        window.cancelAnimationFrame(this.drawFrameID);

        window.removeEventListener("scroll", this.scrollCallback);
        window.removeEventListener("pointermove", this.mouseCallback);

        this.data.loader = null;
        this.data.renderTexture = null;
        this.data.stage_wrapper= null;
        this.data.stage = null;
        this.data.stage_fore = null;
        this.data.renderer.destroy();

        this.destroyed = true;

    },
});

export default halftone;


!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="27b3e7b4-2711-5953-942e-a85c6ed4605f")}catch(e){}}();
//# debugId=27b3e7b4-2711-5953-942e-a85c6ed4605f
