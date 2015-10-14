# melonSlider
A simple slider that changes images by dividing them in two parts. 

##The main features:
* Uses svg to divide the image in two parts.
* You can customize the border between the parts of the image. 
* No dependencies

##Usage
1. Download the package and link melonSlider.js file

  ```html
  <script src="/js/melonSlider.js"></script>
  ```
2. Create a div element that will contain your images. Set `width` and `height` attributes in accordance with the size of your images. Also set `overflow:hidden` and `position:relative`. Set id for this div. Write img tags with your images inside this div.

  ```html
  <div id='containerId' style="width:600px;height:300px;overflow:hidden;position:relative;">
    <img src="../images/1.png"/>
    <img src="../images/2.png"/>
    <img src="../images/3.png"/>
    <img src="../images/4.png"/>
  </div>
  ```
3. Initialize a slider with options.
  
  ```javascript
  $(document).ready(function(){
    var options = {
      containerId:'containerId',
      autoSlide:true
    };
    var slider = new MelonSlider(options);
  })
  ```
  or
  ```javascript
  window.addEventListener('load',function(){
    var options = {
      containerId:'containerId',
      autoSlide:true
    };
    var slider = new MelonSlider(options);
  });
  ```

##Options
| name | type | default | description |
|------------------------|:-------:|:----------:|--------------------------------------------------------------------------------------------|
| containerId | string |  | An identifier of `div` contained images |
| rightButtonId | string |  | An identifier of element. A mouse click on this element will cause change slides forward |
| leftButtonId | string |  | An identifier of element. A mouse click on this element will cause change slides backward |
| speed | number | 1000 | Movement speed of parts of an image in pixels per second |
| cutMode | string | brokenLine | Set the type of a border between image parts. Possible values: brokenLine, curves, userCut |
| brokenLinePointNumber | number | 4 | Number of points on the broken line |
| brokenLineMinDistance | number | 50 | The minimum distance between the middle of the image and the broken line point |
| brokenLineMaxDistance | number | 100 | The maximum distance between the middle of the image and the broken line point |
| curvesPiecesNumber | number | 3 | Number of parts of the curve. |
| curveVertexMinDistance | number | 100 | The minimum distance between the middle of the image and the vertex of the curve |
| curveVertexMaxDistance | number | 150 | The maximum distance between the middle of the image and the vertex of the curve |
| userCut | object |  |An object with fields `path`, `minX`, `maxX`. It is required, if you set `cutMode: userCut`  |
| autoSlide | boolean | false | Change slides automatically or not |
| autoSlideDelay | number | 1000 | Delay time for autoSlide in milliseconds |
| animationType | string | requestAnimationFrame | There are two ways to animate movement of parts of an image: requestAnimationFrame and cssTransition  |
| cssAnimationTimingFunction | string | linear | If you set `animationType:cssTransition` you may specify `transition-timing-function` property. See [here](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp 'w3c')|

##Methods


***
TODO:

4. cutMode - brokenLine

5. cutMode - curves

6. cutMode - userCut

7. animationType

8. cssAnimationTimingFunction

9. methods
