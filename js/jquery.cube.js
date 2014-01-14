(function ($) {

  "use strict";

  $.cube = function (el, options) {

    // To avoid scope issues, use 'base' instead of 'this'
    // to reference this class from internal events and functions.
    var base = this;

    // Access to jQuery and DOM versions of element
    base.$el = $(el);
    base.el = el;

    // Add a reverse reference to the DOM object
    base.$el.data("cube", base);

    /**
     * [init description]
     * @return {[type]} [description]
     */
    base.init = function () {

      // Extend plugin settings.
      base.options = $.extend({}, $.cube.defaultOptions, options);

      if (typeof (options) !== 'undefined') {
        base.options.hashNavigation = $.extend({}, $.cube.defaultOptions.hashNavigation, options.hashNavigation);
        base.options.drag = $.extend({}, $.cube.defaultOptions.drag, options.drag);
        base.options.shortcuts = $.extend({}, $.cube.defaultOptions.shortcuts, options.shortcuts);
        base.options.debug = $.extend({}, $.cube.defaultOptions.debug, options.debug);
        base.options.callbacks = $.extend({}, $.cube.defaultOptions.callbacks, options.callbacks);
      }

      // if(base.options.enableFallbackDetection === true){
      //   // Detect browser 3D rendering support.
      //   base.detect3DTransform();
      // }else{
      //   // 3D check is disabled so we fire the cube building.
      // }
        base.start();

    };

    /**
     * [start description]
     * @return {[type]} [description]
     */
    base.start = function () {

      // Trigger callback.
      base.options.callbacks.beforeLoad.call(base);

      // Maintain separated ids for each cube.
      base.id = $('div.' + base.options.domWrapper).length + 1;

      // Translate user defined sizes to pixels.
      base.cubeSetSizes();

      // Set initial space.
      base.space = base.cubeSidePosition(base.options.currentSide);

      // Build cube containers.
      base.cubeSetWrappers();

      // Build cube sides.
      base.cubeSetSides();

      // Set needed CSS for cube wrappers and sides.
      base.cubeSetCSS();

      // Set cube sides in perspective.
      base.cubeSetPerspective();

      // Set cube base behaviours.
      base.cubeSetBaseBehaviours();

      // Hash based cube navigation.
      if (base.options.hashNavigation.enabled === true) {
        base.cubeHashNavigation();
      }

      // Cube navigation links behaviors.
      if (base.options.anchorRotation === true) {
        base.cubeAnchorRotationBehaviours();
      }

      // Implements key behaviours.
      if (base.options.shortcuts.enabled === true) {
        base.cubeShortcutsBehaviours();
      }

      // Implements drag behaviors.
      if (base.options.drag.enabled === true) {
        base.cubeDragBuild();
      }

      // Updates sizes on resize considering Contact bounce.
      // http://en.wikipedia.org/wiki/Debounce#Contact_bounce
      $(window).resize(base.debouncer(function (e) {
        base.cubeStageResize();
      }));

      // Once everything is loaded, we let the debugger
      // to start tracking and displaying info.
      base.startDebugging = true;

      // Trigger callback.
      base.options.callbacks.afterLoad.call(base);

    };

    /**
     * [cubeSizes description]
     * @return {[type]} [description]
     */
    base.cubeSetSizes = function () {

      var wrapper = base.getMarginAndPadding(base.$el);

      base.options.cubeWidth = base.$el.width() - wrapper.horizontalMargin - wrapper.horizontalPadding;
      base.options.cubeHeight = base.$el.height() - wrapper.verticalMargin - wrapper.verticalPadding;

      // Let fix the wrapper element with pixels to avoid % problems.
      base.$el.width(base.options.cubeWidth);
      base.$el.height(base.options.cubeHeight);
    };

    /**
     * [cubeWrappers description]
     * @return {[type]} [description]
     */
    base.cubeSetWrappers = function () {

      base.$el
        .find('> div')
        .wrapAll('<div class="' + base.options.domWrapper + '-' + base.id + ' ' + base.options.domWrapper + '" />')
        .wrapAll('<div class="' + base.options.domWrapperInner + '-' + base.id + ' ' + base.options.domWrapperInner + '" />');

      base.cubeWrapper = base.$el.find('div.' + base.options.domWrapper + '-' + base.id);
      base.cube = base.$el.find('div.' + base.options.domWrapperInner + '-' + base.id);
    };

    /**
     * [cubeSides description]
     * @return {[type]} [description]
     */
    base.cubeSetSides = function () {
      var i = 0,
        content = '',
        allowedSides = 6;

      base.sides = [];

      base.$el.find('div.' + base.options.domWrapperInner + ' > div').each(function (i) {

        if (i < allowedSides) {
          $(this)
            .addClass(base.options.domCubeSide + ' ' + base.options.domCubeSide + '-' + i)
            .wrapInner('<div id="' + base.options.domCubeSide + '-' + base.options.domCubeContent + '-' + i + '"   class="' + base.options.domCubeContent + '" />');

          base.sides.push($(this));

        } else {
          base.$el.after($(this));
        }

      });
    };

    /**
     * [cubeSetCSS description]
     * @return {[type]} [description]
     */
    base.cubeSetCSS = function () {
      var i = 0,
        _w = base.options.cubeWidth,
        _h = base.options.cubeHeight;

      base.cubeWrapper.css({
        'width': _w,
        'height': _h,
        'position': 'absolute'
      });

      base.cube.css({
        'width': _w,
        'height': _h,
        'position': 'absolute'
      });

      $.each(base.sides, function (i) {

        var side = $(this);
        var sideContent = side.find('div.' + base.options.domCubeContent);

        side.css({
          'width': _w,
          'height': _h,
          'position': 'absolute'
        });

        sideContent.css({
          'width': _w,
          'height': _h,
          'position': 'relative'
        });

        // CSS for top and bottom sides.
        if (i === 4 || i === 5) {

          sideContent.css({
            'margin-top': (_w > _h) ? (_w - _h) / 2 : 0,
            'width': _w,
            'height': (_w > _h) ? _h : _w,
            'position': 'relative'
          });
        }

      });

      // base.cubeWrapper.parent().addClass(base.options.domProcessed);

      return false;
    };

    /**
     * [cubePerspective description]
     * @return {[type]} [description]
     */
    base.cubeSetPerspective = function () {

      var _w = base.options.cubeWidth,
        _h = base.options.cubeHeight;

      TweenLite.set(base.cubeWrapper, {
        perspective: base.options.perspective
      });

      TweenLite.set(base.cube, {
        transformStyle: "preserve-3d",
        z: base.space.z
      });

      TweenLite.set(base.sides[0], {
        x: 0,
        y: 0,
        z: _w / 2,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0
      });

      TweenLite.set(base.sides[1], {
        x: _w / 2,
        y: 0,
        z: 0,
        rotationX: 0,
        rotationY: 90.001,
        rotationZ: 0
      });

      TweenLite.set(base.sides[2], {
        x: 0,
        y: 0,
        z: _w / 2 * -1,
        rotationX: 0,
        rotationY: 180,
        rotationZ: 0
      });

      TweenLite.set(base.sides[3], {
        x: _w / 2 * -1,
        y: 0,
        z: 0,
        rotationX: 0,
        rotationY: 270.001,
        rotationZ: 0
      });

      TweenLite.set(base.sides[4], {
        x: 0,
        y: 0,
        z: _w * -0.5,
        rotationX: 90.001,
        rotationY: 0,
        rotationZ: 0,
        height: _w,
        transformOrigin: "left top"
      });

      TweenLite.set(base.sides[5], {
        x: 0,
        y: _h,
        z: -_w * -0.5,
        rotationX: 270.001,
        rotationY: 0,
        rotationZ: 0,
        height: _w,
        transformOrigin: "left top"
      });

    };

    /**
     * [cubeStageResize description]
     * @return {[type]} [description]
     */
    base.cubeStageResize = function () {

      // Trigger callback.
      base.options.callbacks.beforeResize.call(base);

      // Clean up sizes.
      base.$el.removeAttr('style');

      // Recalculate cube sizes and space.
      base.cubeSetSizes();
      base.cubeSetCSS();
      base.cubeSetPerspective();

      // Re rotate the cube based on the current space.
      var side = base.options.currentSide;
      base.options.currentSide = -1;
      base.cubeRotateToSide(side, false);

      // Trigger callback.
      base.options.callbacks.afterResize.call(base);
    };

    /**
     * [cubeSetBaseBehaviours description]
     * @return {[type]} [description]
     */
    base.cubeSetBaseBehaviours = function () {
      base.cubeFocused = false;
      base.$el.on('mouseenter', function (event) {
        base.cubeFocused = true;
      });
      base.$el.on('mouseleave', function (event) {
        base.cubeFocused = false;
      });
    };

    /**
     * [cubeHashNavigation description]
     * @return {[type]} [description]
     */
    base.cubeHashNavigation = function () {

      // Bind a callback that executes when document.location.hash changes.
      $(window).bind( "hashchange", function(e) {

        var url, side;

        if(typeof($.bbq) !== 'undefined' && typeof($.bbq.getState('hash')) !== 'undefined'){
          url = $.bbq.getState('side');
        }else{
          url = base.options.hashNavigation.linksMap['side'+[base.options.currentSide]];
        }

        // Set active links based on BBQ navigation links.
        $('a.' + base.options.hashNavigation.cssClass + '.active-trail').removeClass('active-trail');
        $('a.' + base.options.hashNavigation.cssClass).each(function(){
          if($(this).attr('href').indexOf(url) !== -1){
            $(this).addClass('active-trail');
          }
        });

      });

      // Bind behaviour for hash navigation links.
      $('a.' + base.options.hashNavigation.cssClass).on('click', function (event) {
        event.preventDefault();

        var hash = $(this).prop("hash").replace('#','');
        var side = base.cubeGetSideByHash(hash);

        // Snap the cube.
        base.cubeRotateToSide(side,'timeline', function(){
          // Update BBQ status if present and enabled.
          if(base.options.hashNavigation.enabled === true && typeof($.bbq) !== 'undefined'){
            $.bbq.pushState({side:side});
          }
        });

      });

      // Triggers BBQ event for the first time.
      $(window).trigger( "hashchange" );

    };

    /**
     * [cubeLinksBehaviours description]
     * @return {[type]} [description]
     */
    base.cubeAnchorRotationBehaviours = function () {
      $('a.' + base.options.domLinksClass + '[' + base.options.domLinksAttr + '=' + base.$el.context.id + ']').on('click', function (event) {
        event.preventDefault();
        var hash = $(this).prop("hash").replace('#','');
        var side = base.cubeGetSideByHash(hash);
        base.cubeRotateToSide(side, 'timeline');
      });
    };

    /**
     * [cubeGetSideByHash description]
     * @param  {[type]} hash [description]
     * @return {[type]}      [description]
     */
    base.cubeGetSideByHash = function (hash) {
      var side = 0;
      for (var prop in base.options.hashNavigation.linksMap) {
        side++;
        if (base.options.hashNavigation.linksMap[prop] == hash) {
          return side;
        }
      }
      return 1;
    };

    /**
     * [cubeRotate description]
     * @param  {[type]} animated [description]
     * @return {[type]}          [description]
     */
    base.cubeRotate = function (animated, callback) {

      if(typeof(base.cube) !== 'object'){
        return false;
      }

      if(typeof(callback) !== 'function'){
        callback = function(){};
      }

      if (animated === 'timeline') {

        base.cubeScaleOut(function(){
          TweenLite.to(base.cube, base.options.animationTimeCubeRotation, {
            directionalRotation: {
              rotationX: base.space.rotationX + "_short",
              rotationY: base.space.rotationY + "_short",
              rotationZ: base.space.rotationZ + "_short"
            },
            x: base.space.x,
            y: base.space.y,
            z: base.space.z,
            scale: base.options.animationInScale,
            opacity: base.options.animationInOpacity,
            onComplete: function(callback){
              base.cubeScaleIn();
              callback(this);
            },
            onCompleteParams: [callback],
            ease: Power2.easeOut,
            delay: base.options.animationDelay
          });
        });

      } else if (animated === true) {

        TweenLite.to(base.cube, base.options.animationTimeCubeRotation, {
          directionalRotation: {
            rotationX: base.space.rotationX + "_short",
            rotationY: base.space.rotationY + "_short",
            rotationZ: base.space.rotationZ + "_short"
          },
          x: base.space.x,
          y: base.space.y,
          z: base.space.z,
          scale: base.options.animationInScale,
          opacity: base.options.animationInOpacity,
          onComplete: function(callback){
            callback(this);
          },
          onCompleteParams: [callback],
          ease: Power2.easeOut,
          delay: base.options.animationDelay,
          overwrite: 'preexisting'
        });

      } else {

        TweenLite.set(base.cube, {
          rotationX: base.space.rotationX,
          rotationY: base.space.rotationY,
          rotationZ: base.space.rotationZ,
          x: base.space.x,
          y: base.space.y,
          z: base.space.z
        });

      }

      return false;
    };

    /**
     * [cubeSidePosition description]
     * @param  {[type]} side [description]
     * @return {[type]}      [description]
     */
    base.cubeSidePosition = function (side) {
      var space, _z;
      var _w = base.options.cubeWidth;
      var _h = base.options.cubeHeight;

      side = (side >= 1 && side <= 6) ? side : 1;

      // Set rotation and axis space for each side.
      switch (side) {
      case 1:
        space = {
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
          x: 0,
          y: 0,
          z: -_w / 2
        };
        break;
      case 2:
        space = {
          rotationX: 0,
          rotationY: -89.999,
          rotationZ: 0,
          x: 0,
          y: 0,
          z: -_w / 2
        };
        break;
      case 3:
        space = {
          rotationX: 0,
          rotationY: -180,
          rotationZ: 0,
          x: 0,
          y: 0,
          z: -_w / 2
        };
        break;
      case 4:
        space = {
          rotationX: 0,
          rotationY: -269.999,
          rotationZ: 0,
          x: 0,
          y: 0,
          z: -_w / 2
        };
        break;
      case 5:
        space = {
          rotationX: -89.999,
          rotationY: 0,
          rotationZ: 0,
          x: 0,
          y: 0,
          z: -_h / 2
        };
        break;
      case 6:
        space = {
          rotationX: 89.999,
          rotationY: 0,
          rotationZ: 0,
          x: 0,
          y: 0,
          z: -_h / 2
        };
        break;
      }

      return space;
    };

    /**
     * [cubeRotateToSide description]
     * @param  {[type]} side [description]
     * @return {[type]}      [description]
     */
    base.cubeRotateToSide = function (side, animated, callback) {

      // Set rotation space.
      side = (typeof (side) === 'string') ? base.cubeGetSideByHash(side) : side;

      // Set new current active side.
      base.options.currentSide = side;

      base.space = base.cubeSidePosition(side);

      // Rotate the cube besed on current space.
      base.cubeRotate(animated, callback);

      return true;
    };

    /**
     * [cubeScale description]
     * @param  {[type]} scale [description]
     * @return {[type]}       [description]
     */
    base.cubeScale = function (scale) {
      var tween = TweenLite.to(base.cube, base.options.animationTimeOutScale, {
        scale: scale
      });
      return tween;
    };

    /**
     * [cubeScaleOut description]
     * @return {[type]} [description]
     */
    base.cubeScaleOut = function (closure) {
      if (base.options.hideContentOnScale === true) {
        TweenLite.to(base.cube.find('.' + base.options.domCubeContent), base.options.hideContentOnScaleTweenTime, {
          opacity: 0
        });
      }
      var tween = TweenLite.to(base.cube, base.options.animationTimeOutScale, {
        scale: base.options.animationOutScale,
        opacity: base.options.animationOutOpacity,
        onComplete: function(){
          closure.call(this);
        }
      });
      return tween;
    };

    /**
     * [cubeScaleIn description]
     * @return {[type]} [description]
     */
    base.cubeScaleIn = function () {
      if (base.options.hideContentOnScale === true) {
        TweenLite.to(base.cube.find('.' + base.options.domCubeContent), base.options.hideContentOnScaleTweenTime, {
          opacity: 1
        });
      }
      var tween = TweenLite.to(base.cube, base.options.animationTimeInScale, {
        scale: base.options.animationInScale,
        opacity: base.options.animationInOpacity
      });
      return tween;
    };

    /**
     * [cubeAlpha description]
     * @param  {[type]} alpha [description]
     * @return {[type]}       [description]
     */
    base.cubeAlpha = function (alpha) {
      var tween = TweenLite.to(base.cube, base.options.animationTimeOutScale, {
        opacity: alpha
      });
      return tween;
    };

    /**
     * [cubeAlphaOut description]
     * @return {[type]} [description]
     */
    base.cubeAlphaOut = function () {
      var tween = TweenLite.to(base.cube, base.options.animationTimeOutScale, {
        opacity: base.options.animationOutOpacity
      });
      return tween;
    };

    /**
     * [cubeAlphaIn description]
     * @return {[type]} [description]
     */
    base.cubeAlphaIn = function () {
      var tween = TweenLite.to(base.cube, base.options.animationTimeOutScale, {
        opacity: base.options.animationInOpacity
      });
      return tween;
    };

    /**
     * [cubeShortcutsBehaviours description]
     * @return {[type]} [description]
     */
    base.cubeShortcutsBehaviours = function () {

      $(document).keyup(function (event) {
        event.stopPropagation();

        // We should only rotate the focused object.
        if (base.cubeFocused === true) {

          var side = base.options.currentSide;

          switch (event.keyCode) {
          case 37:
            side--;
            side = (side < 1) ? side + 6 : side;
            break;
          case 39:
            side++;
            side = (side > 6) ? side - 6 : side;
            break;
          case 38:
            side = 5;
            break;
          case 40:
            side = 6;
            break;
          default:
            side = false;
            break;
          }

          if (side >= 1 && side <= 6) {
            base.cubeRotateToSide(side, 'timeline');
          }

        }

      });
    };

    /**
     * [cubeDragBuild description]
     * @return {[type]} [description]
     */
    base.cubeDragBuild = function () {

      base.draggableObj = {};

      base.$el
        .append('<div class="' + base.options.drag.id + '-' + base.id + ' ' + base.options.drag.id + '"><div class="inner">' + base.options.drag.content + '</div></div>');

      base.draggableObj = $('div.' + base.options.drag.id + '-' + base.id);

      var dragCss = {
        'opacity': base.options.drag.opacityOut
      };

      var dragPosition = base.options.drag.position.split(' ');

      // Set horizontal position.
      switch (dragPosition[0]) {
      case 'right':
        dragCss.right = 0;
        break;
      case 'left':
        dragCss.left = 0;
        break;
      case 'center':
        dragCss.left = base.options.cubeWidth / 2 - base.draggableObj.outerWidth(true) / 2;
        break;
      }

      // Set vertical position.
      switch (dragPosition[1]) {
      case 'top':
        dragCss.top = 0;
        break;
      case 'bottom':
        dragCss.bottom = 0;
        break;
      case 'center':
        dragCss.top = base.options.cubeHeight / 2 - base.draggableObj.outerHeight(true) / 2;
        break;
      }

      // Set base CSS for drag object.
      base.draggableObj.css(dragCss);

      // Attach behaviours to drag object.
      base.cubeDragBehaviours();
    };

    /**
     * [cubeDragBehaviours description]
     * @return {[type]} [description]
     */
    base.cubeDragBehaviours = function () {

      Draggable.create(base.cube, {
        type: "rotation",
        throwProps: false,
        trigger: base.draggableObj,
        onDragStart: function () {
          // Update dragged object CSS.
          base.draggableObj.addClass('dragging');

          // Catch the startup Y rotation.
          base.initDragY = base.space.rotationY;

          base.dragging = true;
        },
        onDragEnd: function () {

          // Update dragged object CSS.
          base.draggableObj.removeClass('dragging');
          base.draggableObj.css('opacity', base.options.drag.opacityOut);

          // Rotate to the most open side.
          base.cubeRotateSnapToSide();

        },
        onDrag: function () {

          var stage = {};
          var side = base.options.currentSide;
          var _h = base.options.cubeHeight;

          // Get the vertical center of the draggable object in pixels.
          var dragV = base.draggableObj.offset().top + base.draggableObj.outerHeight() / 2;
          var distance = dragV - this.pointerY;

          if (distance > base.options.drag.dragVerticalSnapUp || distance < -base.options.drag.dragVerticalSnapDown) {
            side = (distance > 0) ? 5 : 6;
            stage = base.cubeSidePosition(side);
          } else {
            // Get the horizontal center of the draggable object in pixels.
            var dragH = base.draggableObj.offset().left + base.draggableObj.outerWidth(true) / 2;

            // Calculates the horizontal rotation movement.
            var hRot = Math.round((dragH - this.pointerX) * base.options.drag.speed / 90) * -1;

            stage = {
              rotationX: 0,
              rotationY: base.initDragY + hRot,
              rotationZ: 0
            };
          }

          // Set the rotation tween.
          TweenLite.to(base.cube, 0.5, {
            directionalRotation: {
              rotationX: stage.rotationX + '_short',
              rotationY: stage.rotationY + '_short',
              rotationZ: stage.rotationZ + '_short',
            },
            x: 0,
            y: 0,
            z: -base.options.cubeWidth / 2,
            scale: base.options.animationOutScale,
            onUpdate: function () {
              base.space = stage;
            },
            ease: Power2.easeOut
          });
        }
      });

      base.draggableObj.on('mouseenter', function () {
        if (!$(this).hasClass('dragging')) {
          $(this).css('opacity', base.options.drag.opacityHover);
        }
      });

      base.draggableObj.on('mouseleave', function () {
        if (!$(this).hasClass('dragging')) {
          $(this).css('opacity', base.options.drag.opacityOut);
        }
      });
    };

    /**
     * [cubeRotateSnapToSide description]
     * @return {[type]} [description]
     */
    base.cubeRotateSnapToSide = function () {

      // Snap side based on latest dragging.
      var sideX, sideY, side, stage;

      // Calculate X axis side.
      sideX = Math.round((base.space.rotationY / 90) % 4);
      sideX = (sideX > 0) ? 4 - sideX : sideX * -1;
      sideX = (sideX <= -4 || sideX >= 4) ? 0 : sideX;

      // Calculate Y axis side.
      sideY = Math.round((base.space.rotationX / 90) % 2);
      sideY = (sideY > 0) ? 5 : sideY;
      sideY = (sideY < 0) ? 4 : sideY;



      // Calculate and set active side to be snapped.
      side = (sideY !== 0) ? sideY : sideX;
      side = side + 1;

      // Snap the cube.
      base.cubeRotateToSide(side,true, function(){
        // Update BBQ status if present and enabled.
        if(base.options.hashNavigation.enabled === true && typeof($.bbq) !== 'undefined'){
          $.bbq.pushState({side:side});
        }
      });

    };

    /**
     * [getMarginAndPadding description]
     * @param  {[type]} obj [description]
     * @return {[type]}     [description]
     */
    base.getMarginAndPadding = function (obj) {

      var objMarginAndPadding = {};

      objMarginAndPadding.horizontalMargin = parseInt(obj.css('marginLeft').replace('px', ''), 10) + parseInt(obj.css('marginRight').replace('px', ''), 10);
      objMarginAndPadding.verticalMargin = parseInt(obj.css('marginTop').replace('px', ''), 10) + parseInt(obj.css('marginBottom').replace('px', ''), 10);

      objMarginAndPadding.horizontalPadding = parseInt(obj.css('paddingLeft').replace('px', ''), 10) + parseInt(obj.css('paddingRight').replace('px', ''), 10);
      objMarginAndPadding.verticalPadding = parseInt(obj.css('paddingTop').replace('px', ''), 10) + parseInt(obj.css('paddingBottom').replace('px', ''), 10);

      return objMarginAndPadding;
    };

    /**
     * [debouncer description]
     * @param  {[type]} func [description]
     * @param  {[type]} to   [description]
     * @return {[type]}      [description]
     */
    base.debouncer = function (func, to) {
      var timeoutID,
        timeout = (to) ? to : 200;
      return function () {
        var scope = this,
          args = arguments;
        clearTimeout(timeoutID);
        timeoutID = setTimeout(function () {
          func.apply(scope, Array.prototype.slice.call(args));
        }, timeout);
      };
    };

    /**
     * [detect3DTransform description]
     * @return {[type]} [description]
     */
    base.detect3DTransform = function () {

      var el = document.createElement('p'),
        has3d,
        transforms = {
          'webkitTransform': '-webkit-transform',
          'OTransform': '-o-transform',
          'msTransform': '-ms-transform',
          'MozTransform': '-moz-transform',
          'transform': 'transform'
        };

      // Add it to the body to get the computed style.
      document.body.insertBefore(el, null);

      for (var t in transforms) {
        if (el.style[t] !== undefined) {
          el.style[t] = "translate3d(1px,1px,1px)";
          has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
        }
      }

      document.body.removeChild(el);

      if (has3d !== undefined && has3d.length > 0 && has3d !== "none") {
        // Detect browser 3D rendering speed.
        base.detectFPS();
      } else {
        // Browser has not 3D support yet so executes its callback.
        base.options.callbacks.browser3DSupportFallback(this);
      }
    };

    /**
     * [detectFPS description]
     * @return {[type]} [description]
     */
    base.detectFPS = function () {
      base.started = false;
      base.startDebugging = false;
      base.maxFPS = 0;
      base.testFPS = 0;
      base.fps = 0;
      base.ticker = TweenLite.ticker;
      base.ticker.fps(100);
      base.startTime = base.prevUpdate = base.ticker.time;
      base.startFrame = base.ticker.frame;
      base.ticker.addEventListener("tick", base.updateFPS, this);
    };

    /**
     * [updateFPS description]
     * @return {[type]} [description]
     */
    base.updateFPS = function () {
      // If debug option is disable, remothe the updateFPS listener.
      if (base.testFPS > base.options.testFPS && base.options.debug.enabled === false) {
        base.ticker.removeEventListener("tick", base.updateFPS);
      }

      // Start plugin if browser is capable of render 3D nicely.
      // If not, we should display a fallback.
      if (base.testFPS === base.options.testFPS && base.started === false) {
        if (base.maxFPS > base.options.minFPS) {
          base.start();
        } else {
          base.options.callbacks.browserFPSSupportFallback(this);
        }
        base.started = true;
      }

      // Update fps test results.
      var timePassed = base.ticker.time - base.prevUpdate;
      if (timePassed > base.options.debug.debugUpdateDelay || base.testFPS < base.options.testFPS) {
        base.prevUpdate = base.ticker.time;
        base.fps = Number((base.ticker.frame - base.startFrame) / (base.prevUpdate - base.startTime)).toFixed(1);
        base.maxFPS = (Math.round(base.fps) > Math.round(base.maxFPS)) ? base.fps : base.maxFPS;
        base.testFPS++;

        // We show the debugger or remove the check listener.
        if (base.options.debug.enabled === true) {
          base.debugging();
        }
      }
    };

    /**
     * [debugging description]
     * @return {[type]} [description]
     */
    base.debugging = function () {

      if (base.startDebugging === false) {
        return false;
      }

      if ($('div.debug-cube-' + base.id).length === 0) {
        base.$el.append('<div class="debug-cube-' + base.id + ' debug-cube"></div>');
      }

      var output = '';
      var cube = base.cube.get(0);
      // var cube = base.$el;

      // Loop to get _gsTransform properties.
      for (var key in cube._gsTransform) {
        output += '<div><strong>' + key + ':</strong> ' + cube._gsTransform[key] + '</div>';
      }

      // Track current active side.
      output += '<div><strong>CurrentSide:</strong> ' + base.options.currentSide + '</div>';

      // Track FPS.
      output += '<div><strong>FPS:</strong> ' + base.fps + '</div>';

      // Update debugger values.
      base.$el.find('div.debug-cube-' + base.id).html(output);
    };

    // Run initializer.
    base.init();
  };

  $.cube.defaultOptions = {
    enableFallbackDetection: false,
    minFPS: 10,
    testFPS: 50,
    perspective: 2000,
    currentSide: 1,
    cubeWidth: 100,
    cubeHeight: 100,
    domProcessed: 'cube-processed',
    domWrapper: 'cube-wrapper',
    domWrapperInner: 'cube',
    domCubeSide: 'side',
    domCubeContent: 'side-content',
    domLinksAttr: 'rel',
    domLinksClass: 'cube-anchor',
    animationOutScale: 0.75,
    animationInScale: 1,
    animationTimeOutScale: 0.3,
    animationTimeInScale: 0.2,
    animationTimeCubeRotation: 0.5,
    animationOutOpacity: 0.8,
    animationInOpacity: 1,
    animationDelay: 0,
    hideContentOnScale: true,
    hideContentOnScaleTweenTime: 0.5,
    anchorRotation: true,
    hashNavigation: {
      enabled: false,
      cssClass: 'nav-cube-anchor',
      animated: true,
      linksMap: {
        side1: 'side-1',
        side2: 'side-2',
        side3: 'side-3',
        side4: 'side-4',
        side5: 'side-5',
        side6: 'side-6',
      }
    },
    drag: {
      enabled: false,
      id: 'dragg-control',
      position: 'center center',
      dragVerticalSnapUp: 50,
      dragVerticalSnapDown: 50,
      content: '+',
      opacityHover: 0.75,
      opacityOut: 0.5,
      opacityActive: 0.9,
      speed: 50
    },
    shortcuts: {
      enabled: false
    },
    debug: {
      enabled: false,
      debugUpdateDelay: 1
    },
    callbacks: {
      beforeLoad: function(){},
      afterLoad: function(){},
      beforeResize: function(){},
      afterResize: function(){},
      browser3DSupportFallback: function(){},
      browserFPSSupportFallback: function(){}
    }
  };

  $.fn.cube = function (options) {
    return this.each(function () {
      (new $.cube(this, options));
    });
  };

})(jQuery);
