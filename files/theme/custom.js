/**
 * 1.1 version of theme custom js
 * Support for Navpane plugin
 */

 jQuery(function() {

	var $ = jQuery;

	// Define Theme specific functions
  var Theme = {
    utils: {
      onEscKey: function(callback) {
        $(document).on('keyup', function(event) {
          if (event.keyCode === 27) callback();
        });
      },
      getVisiblePercent: function(el) {
        if (!$(el).length) return;

        var $el = $(el),
            scrollTop = $(window).scrollTop(),
            scrollBottom = scrollTop + $(window).height(),
            elTop = $el.offset().top,
            elBottom = elTop + $el.outerHeight(),
            visibleTop = elTop < scrollTop ? scrollTop : elTop,
            visibleBottom = elBottom > scrollBottom ? scrollBottom : elBottom;

        return ((visibleBottom - visibleTop) / $el.outerHeight()).toFixed(2);
      }
    },

    // Swiping mobile galleries wwith Hammer.js
    swipeGallery: function() {
      setTimeout(function() {
        var touchGallery = document.getElementsByClassName("fancybox-wrap")[0];
        var mc = new Hammer(touchGallery);
        mc.on("panleft panright", function(ev) {
          if (ev.type == "panleft") {
            $("a.fancybox-next").trigger("click");
          } else if (ev.type == "panright") {
            $("a.fancybox-prev").trigger("click");
          }
          Theme.swipeGallery();
        });
      }, 500);
    },

    swipeInit: function() {
      if ('ontouchstart' in window) {
        $("body").on("click", "a.w-fancybox", function() {
          Theme.swipeGallery();
        });
      }
    },

    interval: function(condition, action, duration, limit) {
      var counter = 0;
      var looper = setInterval(function(){
        if (counter >= limit || Theme.checkElement(condition)) {
          clearInterval(looper);
        } else {
          action();
          counter++;
        }
      }, duration);
    },

    checkElement: function(selector) {
      return $(selector).length;
    },

    moveLogin: function() {
      var login = $('#member-login').detach();
      $("#nav .wsite-menu-default li:last-child").after(login);
    },

    bannerScroll: function() {
      var visiblePercent = this.utils.getVisiblePercent('#banner');

      $('.wsite-header-elements').css({
        opacity: visiblePercent
      });
    },

    cloneLogo: function(el) {
      $(el)
        .prepend($('#logo').clone().removeAttr('id').addClass('logo'))
        .find('#wsite-title')
        // .removeAttr('id')
        .addClass('site-title');
    },

    navSetup: function() {
      $('.hamburger').click(function() {
        $('.nav').revealer('toggle');
        $('html, body').toggleClass('scroll-locked');
      });

      // Fix editor nav issues since pages don't fully reload
      if ($('body').hasClass('wsite-editor')) {
        $(document).on('click', '.w-navpane a.wsite-menu-item', function() {
          $('html').removeClass('scroll-locked');
          $('body').removeClass('scroll-locked');
          $('.nav').revealer('hide');
        });
      }

      // Jump to top of pane when drilling down
      $('.nav-wrap .has-children').each(function() {
        this.addEventListener('click', function() {
          $('.nav-wrap').scrollTop(0);
        }, true);
      });

      this.cloneLogo('.nav .nav-header');
    },

    setCarouselCellWidth: function() {
      $('.carousel-cell').css({
        width: $('#wsite-com-product-images').width()
      });

      $('#wsite-com-product-images').css({
        minHeight: $('.carousel-cell').height()
      });
    },

    productPage: function() {
      this.setCarouselCellWidth();
      this.quantityInput();

      var $carousel = $('.carousel');

      if ($('#wsite-com-product-price-sale').is(':visible')) {
        $('.sale-badge').addClass('is-visible');
      }

      // Bail if no carousel or flickity not available (editor)
      if (!$carousel.length || typeof $.fn.flickity === 'undefined') return;

      $carousel.flickity({
        cellAlign: 'left',
        imagesLoaded: true,
        pageDots: false
      });

      $carousel.on('staticClick.flickity', function(event, pointer, cellElement, cellIndex) {
        if (typeof cellIndex == 'number') {
          $carousel.flickity('select', cellIndex);
        }
      });
    },

    quantityInput: function() {
      var $input = $('#wsite-com-product-quantity-input');
      var button = 'button-quantity';

      function setValues($input) {
        return {
          value : parseInt($input.val(), 10),
          min : $input.attr('min') ? parseInt($input.attr('min'), 10) : 0,
          max : $input.attr('max') ? parseInt($input.attr('max'), 10) : Infinity,
        }
      }

      // Set up controls
      $input
        .after('<button class="'+ button +' plus" data-quantity-control="increment" />')
        .after('<button class="'+ button +' minus" data-quantity-control="decrement" />');

      // Bind clicks
      $(document).on('click', '.' + button, function(event) {
        event.preventDefault();

        var $target = $(event.target);
        var action = $target.attr('data-quantity-control');
        var $quantityInput = $target.siblings($input.selector);
        var values = setValues($quantityInput);

        if (action === 'increment' && values.value < values.max) {
          $quantityInput.val(values.value + 1).trigger('change');
        } else if (action === 'decrement' && values.value > 0 && values.value > values.min) {
          $quantityInput.val(values.value - 1).trigger('change');
        }
      });

      // Validate change
      $input.on('change', function(event) {
        var $target = $(event.target);
        var values = setValues($target);

        if (values.value >= values.max) {
          $target.val(values.max).addClass('val-max');
        } else if (values.value <= values.min) {
          $target.val(values.min).addClass('val-min');
        } else {
          $target.removeClass('val-max val-min');
        }
      });
    },

    miniCartSetup: function() {
      var self = this;
      var cartOpenClass = 'minicart-visible';

      // Toggle minicart visibility
      function toggleMinicart(state) {
        $('html, body').toggleClass('scroll-locked');
        $('body').toggleClass(cartOpenClass);
        $('.minicart-takeover').revealer(state);
      };

      // Override the header icon / toggle button
      function hijackMinicartToggle() {
        var $cartToggle = $('#wsite-nav-cart-a');
        var itemCount = parseInt($('#wsite-nav-cart-num').text(), 10);
        var hasItems = isNaN(itemCount) || itemCount === 0 ? false : true;

        $cartToggle
          .off('click mouseenter mouseover mouseleave mouseout')
          .toggleClass('has-items new-item', hasItems);

        setTimeout(function() {
          $cartToggle.removeClass('new-item');
        }, 2000);
      };

      // Override the minicart panel
      function hijackMinicart() {
        var $miniCart = $('#wsite-mini-cart');
        $miniCart
          .off('mouseenter mouseover mouseleave mouseout')
          .removeClass('arrow-top')
          .removeAttr('style')
          .find('.wsite-cart-header')
          .prependTo($miniCart);

        if (!$miniCart.find('.logo').length) {
          self.cloneLogo('.wsite-cart-header');
        }

        if (!$('.minicart-takeover').length) {
          $miniCart.wrap('<div class="minicart-takeover" />');
        }
      };

      // Bind minicart events
      $(document).on('click', '.wsite-nav-cart', function() {
        toggleMinicart('toggle');
      });

      $(document).on('click', '.minicart-close', function() {
        toggleMinicart('hide');
      });

      self.utils.onEscKey(function() {
        if ($(document.body).hasClass(cartOpenClass)) {
          toggleMinicart('hide');
        }
      });

      // Watch for minicart
      self.observeDom(document, function(docObserver, target, config) {
        // Bail if minicart & toggle not available yet
        if (!$('#wsite-mini-cart').length || !$('#wsite-nav-cart-a').length) return;

        // Watch minicart
        self.observeDom($('#wsite-mini-cart')[0], function(observer, target, config) {
          observer.disconnect();
          hijackMinicart();
          hijackMinicartToggle();
          observer.observe(target, config);
        });

        // Watch toggle (sometimes default toggle updates after cart)
        self.observeDom($('#wsite-nav-cart-a')[0], function(observer, target, config, mutation) {
          observer.disconnect();
          if (mutation.type === 'childList') {
            hijackMinicartToggle();
          }
          observer.observe(target, config);
        });

        // minicart available, so stop watching the doc
        docObserver.disconnect();
      }, { subtree: true });
    },

    storeSetup: function() {
      // Sidebar
      var $lastBreacrumbLink = $('.wsite-com-breadcrumb:has(a)').last();

      $lastBreacrumbLink.addClass('wsite-selected');

      $('.sidebar-toggle').text($('.wsite-com-link-text.wsite-selected').text() || $lastBreacrumbLink.text() || 'All Products');
    },

    moveStoreSidebar: function() {
      var $sidebar = $('.wsite-com-sidebar');

      $(document.body).toggleClass('has-com-sidebar', !!$sidebar.length);

      if ($(window).width() > 767) {
        $sidebar.insertAfter('#logo');
      } else {
        $sidebar.prependTo('#wsite-com-store-inner');
      }
    },

    bindStoreEvents: function() {
      // Toggle dropdown
      $(document).on('click', '.sidebar-toggle', function(event) {
        event.preventDefault();

        $(this).toggleClass('is-open');
        $('#wsite-com-hierarchy').revealer('toggle');
      });

      // Close dropdowns if clicking outside nav
      $(document).on('click', function(event) {
        if ($(event.target).closest('.wsite-com-sidebar').length) {
          event.stopPropagation();
        } else {
          $('#wsite-com-hierarchy').revealer('hide');
        }
      });
    },

    blogSetup: function() {
      var $singlePost = $('.wsite-blog-post');
      var $commentsToggle = $('#comments');
      var $commentArea = $('#commentArea');
      var toggleText = $('.blog-comments-bottom .blog-link').text();
      var numComments = toggleText.match(/[0-9]/);

      // Single layout change
      $singlePost
        .find('.blog-header')
        .insertBefore('.blog-content-wrap');

      // Force repaint
      setTimeout(function() {
        $singlePost
          .addClass('post-transition');
      }, 1);

      // Comments area
      $commentsToggle
        .text(toggleText.replace(/[0-9]/g, ''))
        .append('(' + numComments + ')')
        .on('click', function() {
          $(this).toggleClass('comments-visible');
          $commentArea.slideToggle();
        });

      if (window.location.hash.indexOf('comments') === 1) {
        $commentArea.slideDown();
      }

      if (numComments > 0) {
        $('.blog-comment-area').prepend('<h3 class="comment-count">' + toggleText + '</h3>');
      }
    },

    observeDom: function(target, callback, config) {
      var config = $.extend({
        attributes: true,
        childList: true,
        characterData: true
      }, config);

      // create an observer instance & callback
      var observer = new MutationObserver(function(mutations) {
        // Using every() instead of forEach() allows us to short-circuit the observer in the callback
        mutations.every(function(mutation) {
          callback(observer, target, config, mutation);
        });
      });

      // pass in the target node, as well as the observer options
      observer.observe(target, config);
    },
  }

	$(document).ready(function() {

	  $('body').addClass('postload');
    Theme.swipeInit();
    Theme.navSetup();
    Theme.storeSetup();
    Theme.moveStoreSidebar();
    Theme.bindStoreEvents();
    Theme.miniCartSetup();
    Theme.productPage();
    Theme.blogSetup();

    // Run interval loop for editor
    Theme.interval('', function() {
      Theme.storeSetup();
      Theme.moveStoreSidebar();
      Theme.setCarouselCellWidth();
    }, 1000, 5);

    $(window).on({
      resize: function() {
        Theme.moveStoreSidebar();
        Theme.setCarouselCellWidth();
      },
      scroll: function() {
        Theme.bannerScroll();
      }
    });

    // Swap preview images for hi-res images in product page

    $("a.wsite-product-image").each(function() {
      var hires = $(this).attr("href");
      $(this).find('img').attr("src", hires);
    });

    Theme.interval("#nav #member-login", Theme.moveLogin, 800, 5);

    // landing scroll

    $('#landing-scroll').click(function(e) {
      e.preventDefault();
        $('html,body, .wrapper').animate({
          scrollTop: $('#main').offset().top
      }, 1000);
    });
  });
});
