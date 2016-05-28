/*!
 * responsivook.js(https://github.com/tategakibunko/responsivook)
 * Copyright Masaki WATANABE
 * Licensed under MIT
 */

var Responsivook = (function(){
  // for IE polyfill of CustomEvent
  function CustomEvent (event, params){
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent("CustomEvent");
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  };

  CustomEvent.prototype = window.Event.prototype;
  window.CustomEvent = CustomEvent;

  var __min_font_size = 12;

  var _get_default_font_size = function(height){
    return Math.floor(height / (22 + 2.5));
  };

  var _get_default_height_landscape = function(){
    return Math.floor(screen.height * 60 / 100);
  };

  var _get_default_height_portrait = function(){
    return Math.floor(screen.height * 55 / 100);
  };

  var _get_default_height = function(){
    return (screen.width > screen.height)?
      _get_default_height_landscape(): _get_default_height_portrait();
  };

  var _insert_after = function($target, $ins_node){
    var $parent = $target.parentNode;
    var $next = $target.nextSibling;
    if($next && $next.classList && $next.classList.contains("responsivook")){
      $parent.removeChild($next);
      $next = $target.nextSibling;
    }
    $parent.insertBefore($ins_node, $next);
  };

  var _resize_timer;
  window.addEventListener("resize", function(evt){
    clearTimeout(_resize_timer);
    _resize_timer = setTimeout(function(){
      var event;
      if(window.CustomEvent){
	event = new CustomEvent("resized", {detail: {}});
      } else {
	event = document.createEvent('CustomEvent');
	event.initCustomEvent("resized", true, true, {});
      }
      document.dispatchEvent(event);
    }, 250);
  });

  var _create_button = function(label, color){
    var button = document.createElement("button");
    button.className = ["responsivook-btn", "btn", "icon-only", color].join(" ");
    button.innerHTML = label;
    return button;
  };

  var _create_on_click_pager = function(layout, type){
    return (type === "next")? function(){
      layout.pageIndex = Math.min(layout.pageIndex + 1, layout.pageCount - 1);
      _set_page(layout);
      return false;
    } : function(){
      layout.pageIndex = Math.max(0, layout.pageIndex - 1);
      _set_page(layout);
      return false;
    };
  };

  var _create_pager = function(layout, opt){
    var div = document.createElement("div");
    div.className = "responsivook-pager";
    var left = _create_button(opt.leftLabel, opt.leftColor);
    var right = _create_button(opt.rightLabel, opt.rightColor);
    div.appendChild(left);
    div.appendChild(right);
    left.onclick = _create_on_click_pager(layout, opt.leftType);
    right.onclick = _create_on_click_pager(layout, opt.rightType);
    return {
      element:div,
      left:left,
      right:right
    };
  };

  var _append_page = function(layout, page){
    var target = layout.wrapElement;
    if(page.pageNo > 0){
      var divider = document.createElement("div");
      divider.className = "responsivook-divider";
      target.appendChild(divider);
    }
    target.appendChild(page.element);
  };

  var _set_page = function(layout){
    var page = layout.pageDocument.getPage(layout.pageIndex);
    var target = layout.contentElement;
    if(target.firstChild){
      target.replaceChild(page.element, target.firstChild);
    } else {
      target.appendChild(page.element);
    }
  };

  var _get_wrap_height = function(opt){
    switch(opt.theme){
    case "dangumi": return "auto";
    default: return opt.height + "px";
    }
  };

  var _create_wrap_element = function(opt){
    var element = document.createElement("div");
    element.className = "responsivook-nehan-wrap";
    element.style.width = opt.width + "px";
    element.style.height = _get_wrap_height(opt);
    return element;
  };

  var _create_content_element = function(opt){
    var element = document.createElement("div");
    element.className = "responsivook-nehan-wrap-content";
    return element;
  };

  var _create_page_document = function(opt){
    return new Nehan.Document()
      .setStyle("body", {
	flow:opt.flow,
	fontSize:opt.fontSize,
	fontFamily:opt.fontFamily,
	width:opt.pageWidth,
	height:opt.pageHeight,
	oncreate:function(ctx){
	  setTimeout(function(){
	    ctx.dom.classList.add("responsivook-fadein");
	  }, 0);
	}
      })
      .setStyles(opt.styles)
      .setContent(opt.html);
  };

  var _create_layout = function(opt){
    var wrap_element = _create_wrap_element(opt);
    var content_element = _create_content_element(opt);
    var page_document = _create_page_document(opt);
    wrap_element.appendChild(content_element);
    return {
      pageIndex:0,
      pageCount:0,
      contentElement:content_element,
      wrapElement:wrap_element,
      pageDocument:page_document
    };
  };

  var _start_book = function(opt){
    var $book = document.createElement("div");
    $book.className = "responsivook";
    var layout = _create_layout(opt);
    var pager = _create_pager(layout, opt);
    $book.appendChild(layout.wrapElement);
    $book.appendChild(pager.element);
    layout.pageDocument.render({
      onProgress:function(tree, ctx){
	layout.pageCount++;
      }
    });
    _insert_after(opt.$dom, $book);
    _set_page(layout);
    return $book;
  };

  var _start_dangumi = function(opt){
    var $book = document.createElement("div");
    $book.className = "responsivook";
    var layout = _create_layout(opt);
    $book.appendChild(layout.wrapElement);
    layout.pageDocument.render({
      onPage:function(page, ctx){
	layout.pageCount++;
	_append_page(layout, page);
      }
    });
    _insert_after(opt.$dom, $book);
    return $book;
  };

  var _start_layout = function(opt){
    switch(opt.theme){
    case "dangumi":
      _start_dangumi(opt);
      break;
    case "book":
    default:
      _start_book(opt);
      break;
    }
  };

  var _get_page_width = function(width, font_size){
    return width - font_size * 2;
  };

  var _get_page_height = function(height, font_size){
    return height;
  };

  var _check_resize = function(target){
    var $parent = target.$dom.parentNode;
    return target.width !== $parent.offsetWidth;
  };

  var _resize_page_size = function(target){
    var $parent = target.$dom.parentNode;
    target.width = $parent.offsetWidth;
    target.pageWidth = _get_page_width(target.width, target.fontSize);
    return target;
  };

  var _create_html = function(html, on_html){
    var result = html
      .replace(/\[page-break\](\n|<br>)*/g, "<page-break>")
    ;
    if(on_html && typeof on_html === "function"){
      result = on_html(result);
    }
    return result;
  };

  var _create_target = function($dom, opt){
    var raw_html = $dom.innerHTML;
    var html = _create_html(raw_html, opt.onHtml || null);
    var flow = opt.flow || "tb-rl";
    var width = $dom.offsetWidth;
    var height_draft = Math.max(200, opt.height || _get_default_height());
    var font_size = Math.max(opt.minFontSize || __min_font_size, opt.fontSize || _get_default_font_size(height_draft));
    var height = font_size * Math.floor(height_draft / font_size);
    var font_family = opt.fontFamily || "'ヒラギノ明朝 Pro W3','Hiragino Mincho Pro','HiraMinProN-W3','IPA明朝','IPA Mincho', 'Meiryo','メイリオ','ＭＳ 明朝','MS Mincho'";
    var page_width = _get_page_width(width, font_size);
    var page_height = _get_page_height(height, font_size);
    var is_left_next = flow === "tb-rl";
    var left_color = opt.leftColor || "dark-blue";
    var right_color = opt.rightColor || "red";
    var left_label = opt.leftLabel || (is_left_next? "&#x2190; NEXT" : "&#x2190; PREV");
    var right_label = opt.rightLabel || (is_left_next? "PREV &#x2192;" : "NEXT &#x2192;");
    var left_type = is_left_next? "next" : "prev";
    var right_type = is_left_next? "prev" : "next";
    var styles = opt.styles || {};
    var theme = opt.theme || "book";
    return {
      $dom:$dom,
      html:html,
      flow:flow,
      width:width,
      height:height,
      pageWidth:page_width,
      pageHeight:page_height,
      fontSize:font_size,
      fontFamily:font_family,
      leftColor:left_color,
      rightColor:right_color,
      leftLabel:left_label,
      rightLabel:right_label,
      leftType:left_type,
      rightType:right_type,
      styles:styles,
      theme:theme
    };
  };

  return {
    version : "1.2.0",
    start : function(path, args){
      args = args || {};
      var targets = Array.prototype.map.call(document.querySelectorAll(path), function($dom){
	var target = _create_target($dom, args);
	$dom.style.display = "none";
	return target;
      });
      var convert = function(targets){
	targets.forEach(_start_layout);
      };
      convert(targets);
      document.addEventListener("resized", function(event){
	var updated = targets.filter(_check_resize).map(_resize_page_size);
	convert(updated);
      });
    }
  };
})();
