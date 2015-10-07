# melonSlider
The simple slider that changes images by dividing them in two parts. 

##The main features:
* Uses svg to divide the image in two parts.
* You can customize the border between the parts of the image. 
* No dependencies

##Usage
1. Download the package and link melonSlider.js file

  ```html
  <script src="/js/melonSlider.js"></script>
  ```
2. Create the div tag that will contain your images. Set width and height attributes in accordance with the size of your images. Also set overflow attribute in hidden and position attribute in relative. Set id for this div. Write img tags with your images inside this div.

  ```html
  <div id='containerId' style="width:600px;height:300px;overflow:hidden;position:relative;">
    <img src="../images/1.png"/>
    <img src="../images/2.png"/>
    <img src="../images/3.png"/>
    <img src="../images/4.png"/>
  </div>
  ```
3. Iinitialize the slider with options.
  
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
