/**
 * image_compress.js
 * ضغط الصور داخل المتصفح قبل رفعها للسيرفر (يقلّل حجم الرفع من عدة ميغابايت إلى مئات الكيلوبايت).
 *
 * الاستخدام:
 *   const small = await window.compressImage(file, { maxSide: 1280, quality: 0.82 });
 *
 * - لا يرمي أخطاء أبداً: عند أي مشكلة يرجع الملف الأصلي كما هو.
 * - لا يلمس ملفات GIF / SVG (للحفاظ على الحركة والمتجهات).
 * - لا يكبّر الصور الصغيرة، ولا يستبدل الأصل إن لم يصغر حجمه فعلاً.
 */
(function (global) {
  "use strict";

  var SKIP_TYPES = ["image/gif", "image/svg+xml"];

  function loadBitmap(file) {
    if (typeof global.createImageBitmap === "function") {
      return global
        .createImageBitmap(file, { imageOrientation: "from-image" })
        .catch(function () {
          return global.createImageBitmap(file);
        });
    }

    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("image decode failed"));
      };
      img.src = url;
    });
  }

  function toBlob(canvas, type, quality) {
    return new Promise(function (resolve) {
      try {
        canvas.toBlob(function (blob) {
          resolve(blob);
        }, type, quality);
      } catch (e) {
        resolve(null);
      }
    });
  }

  function baseName(name) {
    return (name || "image").replace(/\.[^.\/\\]+$/, "");
  }

  async function compressImage(file, options) {
    try {
      if (!file || typeof file !== "object" || !file.type) return file;
      if (file.type.indexOf("image/") !== 0) return file;
      if (SKIP_TYPES.indexOf(file.type) !== -1) return file;

      var opts = options || {};
      var maxSide = opts.maxSide || 1280;
      var quality = typeof opts.quality === "number" ? opts.quality : 0.82;

      var bitmap = await loadBitmap(file);
      var srcW = bitmap.width || bitmap.naturalWidth;
      var srcH = bitmap.height || bitmap.naturalHeight;
      if (!srcW || !srcH) return file;

      var ratio = Math.min(1, maxSide / Math.max(srcW, srcH));
      var w = Math.max(1, Math.round(srcW * ratio));
      var h = Math.max(1, Math.round(srcH * ratio));
      var resized = ratio < 1;

      var canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, 0, 0, w, h);
      if (bitmap.close) bitmap.close();

      // WebP أولاً، وإن لم يدعمه المتصفح (يرجع PNG بصمت) نستخدم JPEG بخلفية بيضاء
      var blob = await toBlob(canvas, "image/webp", quality);

      if (!blob || blob.type !== "image/webp") {
        var flat = document.createElement("canvas");
        flat.width = w;
        flat.height = h;
        var fctx = flat.getContext("2d");
        fctx.fillStyle = "#ffffff";
        fctx.fillRect(0, 0, w, h);
        fctx.drawImage(canvas, 0, 0);
        blob = await toBlob(flat, "image/jpeg", quality);
      }

      if (!blob) return file;

      // إن لم نصغّر الأبعاد ولم ينقص الحجم فعلاً، نُبقي الأصل
      if (!resized && blob.size >= file.size) return file;

      var ext = blob.type === "image/webp" ? ".webp" : ".jpg";

      return new File([blob], baseName(file.name) + ext, {
        type: blob.type,
        lastModified: Date.now(),
      });
    } catch (err) {
      if (global.console && console.warn) console.warn("compressImage: using original file", err);
      return file;
    }
  }

  global.compressImage = compressImage;
})(window);
