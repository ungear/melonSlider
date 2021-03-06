/*!
 * melonSlider JavaScript Library v1.0
 * http://melon-slider.ungear.ru/
 * https://github.com/ungear/melonSlider
 * 
 * (c) 2015 Mikhail Istomin http://ungear.ru
 * Released  under the MIT License
*/

+function(){
  "use strict";
  var VERSION = '1.0';
  var ANIMATION_TYPES = {
    requestAnimationFrame: 'requestAnimationFrame', //works in ie9+  
    cssTransition: "cssTransition"                 //works in ie10+ 
  };
  
  var CUT_MODES= {
    brokenLine: 'brokenLine',
    curves: 'curves',
    userCut: 'userCut'
  };
  
  var DEFAULT_SLIDER_OPTIONS = {
    containerId:'',
    previousButtonId:'',
    nextButtonId:'',
    speed: 1000,                      //  px/sec
    cutMode: CUT_MODES.brokenLine,
    segmentsNumber: 4,
    minSegmentWidth: 50,
    maxSegmentWidth: 100,
    autoSlide: false,
    autoSlideDelay: 1000,
    userCut:'',
    animationType: ANIMATION_TYPES.requestAnimationFrame,
    cssAnimationTimingFunction: 'linear'    //ease|ease-in|ease-out|ease-in-out|linear|step-start|step-end|steps|cubic-bezier
  };
  
  var SLIDER_NAME = 'melon-slider';
  
  // An ugly scheme to explain parts of slider. 
  //[=======================sliderContainer====================]
  //[ {---leftChunkContainer---}   {---rightChunkContainer---} ]
  //[ {   [---leftChunk---]    }   {   [---rightChunk---]    } ]
  //[ {   [---------------]    }   {   [----------------]    } ]
  //[ {------------------------}   {-------------------------} ]
  //[==========================================================]
  
  /******
   * Horizontal chunk is <svg> with <image> inside.
   * An instance controls <image> and the cutting.
   * Private. 
   */
  function HorizontalChunk(width, height, baseContainerId, isLeft){
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    
    var defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
    svg.appendChild(defs);
    
    var clipPath = document.createElementNS('http://www.w3.org/2000/svg','clipPath');
    var id = isLeft
      ? baseContainerId + '-' + SLIDER_NAME + "-left-chunk"
      : baseContainerId + '-' + SLIDER_NAME + "-right-chunk";
      
    clipPath.setAttribute('id', id);
    defs.appendChild(clipPath);
    
    var path = document.createElementNS('http://www.w3.org/2000/svg','path');
    clipPath.appendChild(path);
    
    var image = document.createElementNS('http://www.w3.org/2000/svg','image');
    image.setAttribute('x', 0);
    image.setAttribute('y', 0);
    image.setAttribute('width', width);
    image.setAttribute('height', height);
    svg.appendChild(image);
    
    this.svg = svg;
    this.clipPathId = id;
    this.path = path;
    this.image = image;
    this.visualImageWidth = 0;
    this.isLeft = isLeft;
    this.width = width;
    this.height = height;
  }
  
  HorizontalChunk.prototype.setImage = function(src){
    this.image.setAttributeNS('http://www.w3.org/1999/xlink','href',src);
  };
  
  /******
   * Sets path's "d" attribute. Applies clippath on image.
   */
  HorizontalChunk.prototype.cropByPath = function(path){
    var pathD = this.isLeft
      ? 'M0,0 ' + path + " L0," + this.height +" L0,0 Z"
      : 'M' + this.width + ',0 ' + path + " L" + this.width + "," + this.height + " L" + this.width + ",0 Z";
    this.path.setAttribute( 'd', pathD);
    var clipPathUrl = 'url(#' + this.clipPathId +')';
    this.image.setAttribute('clip-path',clipPathUrl);
  };
  
  HorizontalChunk.prototype.clear = function(){
    this.path.removeAttribute('d');
    this.image.removeAttribute('clip-path');
    this.image.removeAttributeNS('http://www.w3.org/1999/xlink','href');
  };

  /******
   * ChunkContainer is <div> with HorizontalChunk inside.
   * We animate the movement of this <div> 
   * Private 
   */
  function ChunkContainer(width,height){
    var chunkContainer = document.createElement('div');
    chunkContainer.style.top = 0;
    chunkContainer.style.left = 0;
    chunkContainer.style.position = 'absolute';
    chunkContainer.style.width = this.baseWidth;
    chunkContainer.style.height = this.baseHeight;
    this.el = chunkContainer;
  };
    
  ChunkContainer.prototype.clearTransitionStyles = function(){
    this.el.style['transition-property'] = '';
    this.el.style['transition-duration'] = '';
    this.el.style['transition-timing-function'] = '';
    this.el.style['transition-timing-delay'] = '';
  };
  
  ChunkContainer.prototype.prepareTransitionStylesToAnimation = function(options){
    this.el.style['transition-property'] = 'left';
    this.el.style['transition-duration'] = options.animationTime + 's';
    this.el.style['transition-timing-function'] = options.timingFunction || 'linear';
    this.el.style['transition-timing-delay'] = '0s';
  };
  
  /******
   * The main private constructor.
   */
  function Slider(options){
    this.setOptions(options);
    var errorsNumber = this.checkOptions();
    this.isCorrect = !errorsNumber;
    if(!this.isCorrect)
      return;
    this.initialize();
    this.currentImageIndex = 0;
    this.calculateChunks();
    this.setHandlers();
  }
  
  /******
   * Mixes user's options and default options.
   */
  Slider.prototype.setOptions = function(userOptions){
    this.options = {};
    for(var f in DEFAULT_SLIDER_OPTIONS){
      this.options[f] = f in userOptions
        ? userOptions[f]
        : DEFAULT_SLIDER_OPTIONS[f];
    }
  };
  
   /******
   * Validates options.
   */
  Slider.prototype.checkOptions = function(){
    var errorsNumber = 0;
    if(!this.options.containerId){
      printErrors("couldn't find container");
      errorsNumber++;
    }
    
    if(this.options.segmentsNumber < 1){
      printErrors("wrong segmentsNumber");
      errorsNumber++;
    }
    
    return errorsNumber;
  }
  
  /******
  * Creates instances of necessary entities
  */
  Slider.prototype.initialize = function(){
    var parts = {};
    parts.sliderContainer = document.getElementById(this.options.containerId);
    
    this.images = [];
    var images = parts.sliderContainer.getElementsByTagName('img');
    for (var i = 0; i < images.length; i++ ){
      var image = images[i];
      if(!isImageLoadedSuccessfully(image)){
        parts.sliderContainer.removeChild(image);
        i--;
      }
      else{
        this.images.push(image);
        if(this.images.length > 1)
          image.style.display = 'none';
      }
    }
    
    this.baseWidth = parts.sliderContainer.offsetWidth;
    this.baseHeight = parts.sliderContainer.offsetHeight;

    parts.leftChunkContainer = new ChunkContainer(this.baseWidth,this.baseHeight);
    parts.sliderContainer.appendChild(parts.leftChunkContainer.el);
    parts.leftChunk = new HorizontalChunk(this.baseWidth,this.baseHeight, this.options.containerId, true);
    parts.leftChunkContainer.el.appendChild(parts.leftChunk.svg);
   
    parts.rightChunkContainer = new ChunkContainer(this.baseWidth,this.baseHeight);
    parts.sliderContainer.appendChild(parts.rightChunkContainer.el);
    parts.rightChunk = new HorizontalChunk(this.baseWidth,this.baseHeight,this.options.containerId);
    parts.rightChunkContainer.el.appendChild(parts.rightChunk.svg);
    
    parts.previousButton = document.getElementById(this.options.previousButtonId);
    parts.nextButton = document.getElementById(this.options.nextButtonId);
    
    this.parts = parts;
  };
  
  /******
  * Calculates and applies the cutting line. Prepares chunks to animation.
  */
  Slider.prototype.calculateChunks = function(){
    this.chunksCalculationInProgress = true;
    this.parts.leftChunk.setImage(this.images[this.currentImageIndex].src);
    this.parts.rightChunk.setImage(this.images[this.currentImageIndex].src);
    
    var cut;
    switch (this.options.cutMode){
      case CUT_MODES.brokenLine:
        cut = this.generateBrokenLineCut();
        break;
      case CUT_MODES.curves:
        cut = this.generateBezierCurveCut();
        break;
      case CUT_MODES.userCut:
        cut = this.options.userCut;
        break;
    }
    this.parts.leftChunk.cropByPath(cut.path);
    this.parts.rightChunk.cropByPath(cut.path);
    
		this.parts.leftChunk.visualImageWidth = cut.maxX;
    this.parts.rightChunk.visualImageWidth = this.baseWidth - cut.minX;
    
    this.parts.leftChunkContainer.el.style.left = 0;
    this.parts.rightChunkContainer.el.style.left = 0;
    this.chunksCalculationInProgress = false;
    this.onReadyForNewAnimation();
  };
  
  Slider.prototype.generateBrokenLineCut = function(){
    var path = '';
    var xCoordinates = [];
    var yCoordinates = [];
    var minX = this.baseWidth;
    var maxX = 0;
    var middleX = parseInt(this.baseWidth/2);
    
    //generate y coordinates
    yCoordinates.push(0);
    var normalHeight = this.baseHeight/this.options.segmentsNumber;
    var delta = normalHeight*0.5;
    for(var i = 1; i< this.options.segmentsNumber; i++ ){
      var topValue = i*normalHeight - delta;
      var bottomValue = i*normalHeight + delta;
      var randY = getRandomInt(topValue, bottomValue);
      yCoordinates.push(randY);
    }
    yCoordinates.push(this.baseHeight);
    
    //generate x coordinates
    var pointSideLeft = getRandomBool();
    for(var j = 0; j< yCoordinates.length; j++){
      var randLeftBorder = pointSideLeft
        ? middleX - this.options.maxSegmentWidth
        : middleX + this.options.minSegmentWidth;
      
      var randRightBorder = pointSideLeft
        ? middleX - this.options.minSegmentWidth
        : middleX + this.options.maxSegmentWidth;
      
      var randX = getRandomInt(randLeftBorder, randRightBorder);
      xCoordinates.push(randX);
      pointSideLeft = !pointSideLeft;
      
      if (randX > maxX)
        maxX = randX;
      
      if(randX < minX)
        minX = randX;
    }
    
    path += 'L';
    for(var k = 0; k < yCoordinates.length; k++ ){
      path += xCoordinates[k] + ',' + yCoordinates[k] + ' ';
    }
    return {
      path: path,
      maxX: maxX,
      minX: minX
    };
  };
  
  Slider.prototype.generateBezierCurveCut = function(){
    var middleX = parseInt(this.baseWidth/2);
    var vertexMinDistance = this.options.minSegmentWidth;
    var vertexMaxDistance = this.options.maxSegmentWidth;
    var minX = middleX - vertexMaxDistance;
    var maxX = middleX + vertexMaxDistance;
    var curveLeft = getRandomBool();
    var normalHeight = this.baseHeight/this.options.segmentsNumber;
    var heightRandBottom = normalHeight/2;
    var heightRandTop = normalHeight*1.5;
    var path = '';
    var middlePointsY = [];
    middlePointsY.push(0);
    for(var i=1; i< this.options.segmentsNumber; i++){
      var y = generateCurveEndPoint(middlePointsY[i-1]);
      middlePointsY.push(y);
    }
    middlePointsY.push(this.baseHeight);
    
    for(var j=0; j< this.options.segmentsNumber; j++){
      if(j==0){
        var firstPoints = generateFirstCurveExtraPoints(middlePointsY[1]);
        path = 'L' + middleX + ',' + middlePointsY[0] + ' ' +
              'C' + firstPoints[0].x + ',' + firstPoints[0].y + ' ' +
              firstPoints[1].x + ',' + firstPoints[1].y + ' ' + 
              middleX + ',' + middlePointsY[1];
      }else{
        var point = generateCurveExtraPoint(middlePointsY[j],middlePointsY[j+1]);
        path += ' S' + point.x + ',' + point.y + ' ' + 
                middleX + ',' + middlePointsY[j+1];
      }
      curveLeft = !curveLeft;
    }
    return{
      path: path,
      maxX: maxX,
      minX: minX
    };
    
    
    function generateCurveEndPoint(curveStartY){
      var pieceRandHeight = getRandomInt(heightRandBottom, heightRandTop);
      return curveStartY + pieceRandHeight;
    }
  
    function generateCurveExtraPoint(curveStartY, curveEndY){
      var x = getRandomX();
      var y = getRandomInt(curveStartY + (curveEndY - curveStartY)/2,curveEndY);
      return {x:x, y:y};
    }
  
    function generateFirstCurveExtraPoints(curveEndY){
      var x1 = getRandomX();
      var y1 = getRandomInt(0,curveEndY/2);
      var x2 = getRandomX();
      var y2 = getRandomInt(curveEndY/2,curveEndY);
      return [{x:x1, y:y1}, {x:x2, y:y2}];
    }
    
    function getRandomX(){
      return  curveLeft
        ? getRandomInt(middleX - vertexMaxDistance, middleX - vertexMinDistance)
        : getRandomInt(middleX + vertexMinDistance, middleX + vertexMaxDistance);
    }
  };
  
  Slider.prototype.setHandlers = function(){
    if(this.parts.nextButton){
      this.parts.nextButton.addEventListener('click',this.showNextImage.bind(this));
    }
    
    if(this.parts.previousButton){
      this.parts.previousButton.addEventListener('click',this.showPreviousImage.bind(this));
    }
  };
  
  Slider.prototype.showNextImage = function(){
    this.options.autoSlide = false;
    if(!this.animationInProcess && !this.chunksCalculationInProgress)
      this.changeSlide(true);
  };
  
  Slider.prototype.showPreviousImage = function(){
    this.options.autoSlide = false;
    if(!this.animationInProcess && !this.chunksCalculationInProgress)
      this.changeSlide(false);
  };
  /******
  * Starts animation.
  */
  Slider.prototype.changeSlide = function (forward){
    this.animationInProcess = true;
    if (forward)
      this.increaseCurrentImageIndex();
    else
      this.decreaseCurrentImageIndex();
    
    for(var i = 0; i< this.images.length; i++){
      var image = this.images[i];
      image.style.display = i == this.currentImageIndex
        ? 'block'
        : 'none';
    }
    
    switch(this.options.animationType){
      case ANIMATION_TYPES.requestAnimationFrame:
        this.startFrameAnimation();
        break;
      case ANIMATION_TYPES.cssTransition:
        this.startCssAnimation();
        break;
    }
  };
  
  /******
  * Implements animation using window.requestAnimationFrame (or its polyfill)
  */
  Slider.prototype.startFrameAnimation = function(){
    var slider = this;
    var leftChunkVisualWidth = this.parts.leftChunk.visualImageWidth;
    var rightChunkVisualWidth = this.parts.rightChunk.visualImageWidth;
    
    var speed = this.options.speed;
    var previousTimestamp;
    var rAFpolufillLastTime = 0;
    var requestAnimationFrame = typeof window.requestAnimationFrame === 'function'
      ? window.requestAnimationFrame
      : requestAnimationFramePolyfill;
      
    requestAnimationFrame(animationStep);
    
    function animationStep(timestamp){
      var leftChunkLeft = parseInt(slider.parts.leftChunkContainer.el.style.left);
      var rightChunkLeft = parseInt(slider.parts.rightChunkContainer.el.style.left);
      var leftChunkIsVisible = -leftChunkLeft < leftChunkVisualWidth;
      var rightChunkIsVisible = rightChunkLeft < rightChunkVisualWidth;
      
      if(leftChunkIsVisible || rightChunkIsVisible){
        requestAnimationFrame(animationStep);
        var timeDelta = previousTimestamp 
          ? timestamp - previousTimestamp
          : 0;
        previousTimestamp = timestamp;
        var timeDeltaSec = timeDelta/1000;
        var progress = parseInt(timeDeltaSec * speed);
        slider.parts.leftChunkContainer.el.style.left = leftChunkLeft - progress + 'px';
        slider.parts.rightChunkContainer.el.style.left = rightChunkLeft + progress + 'px';
      }
      else{
        slider.afterEndAnimation();
      }
    }
    
    function requestAnimationFramePolyfill(callback){
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - rAFpolufillLastTime));
      var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
      rAFpolufillLastTime = currTime + timeToCall;
      return id;
    }
  };
  
  /******
  * Implements CSS animation using 'transition' property.
  */
  Slider.prototype.startCssAnimation = function(){
    var leftChunkVisualWidth = this.parts.leftChunk.visualImageWidth;
    var rightChunkVisualWidth = this.parts.rightChunk.visualImageWidth;
    var maxWidth = Math.max(leftChunkVisualWidth, rightChunkVisualWidth);
    var animationTime = maxWidth/this.options.speed; //seconds
    var slider = this;
    
    var transitionOptions = {
      animationTime: animationTime,
      timingFunction: this.options.cssAnimationTimingFunction
    };

    this.parts.leftChunkContainer.prepareTransitionStylesToAnimation(transitionOptions);
    this.parts.rightChunkContainer.prepareTransitionStylesToAnimation(transitionOptions);
    
    this.parts.leftChunkContainer.el.style.left = -leftChunkVisualWidth;
    this.parts.rightChunkContainer.el.style.left = rightChunkVisualWidth;
    
    setTimeout(function(){
      slider.parts.leftChunkContainer.clearTransitionStyles();
      slider.parts.rightChunkContainer.clearTransitionStyles();
      slider.afterEndAnimation();
    },animationTime*1000);
  };
  
  /******
  * All calculations are completed.
  */
  Slider.prototype.onReadyForNewAnimation = function(){
    var slider = this;
    if(this.options.autoSlide){
      setTimeout(function(){
        //option autoSlide can be changed by method stopAutoslide so we check it one more time
        if(slider.options.autoSlide)
          slider.changeSlide(true);
      },this.options.autoSlideDelay);
    }
  };
  
  Slider.prototype.afterEndAnimation = function(){
    this.animationInProcess = false;
    this.parts.leftChunk.clear();
    this.parts.rightChunk.clear();
    this.calculateChunks();
  };
  
  Slider.prototype.increaseCurrentImageIndex = function(){
    this.currentImageIndex++;
    if(this.currentImageIndex === this.images.length)
      this.currentImageIndex = 0;
  };
  
  Slider.prototype.decreaseCurrentImageIndex = function(){
    this.currentImageIndex--;
    if(this.currentImageIndex < 0)
      this.currentImageIndex = this.images.length - 1;
  };
  
  Slider.prototype.startAutoSlide = function(){
    if(this.options.autoSlide) return;
    this.options.autoSlide = true;
    if(!this.animationInProcess && !this.chunksCalculationInProgress)
      this.changeSlide(true);
  };
  
  Slider.prototype.stopAutoSlide = function(){
    this.options.autoSlide = false;
  };
  
  function isImageLoadedSuccessfully(img){
    return img.naturalWidth > 0; 
  }
  
  function getRandomInt(min, max){
    return Math.floor(Math.random() * (max - min)) + min;
  }
  
  function getRandomBool(){
    return Math.random() > 0.5;
  }
    
  function printErrors(errorText){
    console.log("melonSlider error : " + errorText);
  }
  
  /******
  * Public constructor.
  */
  function Facade(options){    
    var slider = new Slider (options);
    if(slider.isCorrect){
      return {
          element: slider.parts.sliderContainer,
          startAutoSlide: slider.startAutoSlide.bind(slider),
          stopAutoSlide: slider.stopAutoSlide.bind(slider),
          showNextImage: slider.showNextImage.bind(slider),
          showPreviousImage: slider.showPreviousImage.bind(slider)
        };
    }
    else{
      return null;
    }
  }
  
  window.MelonSlider=Facade;
}();