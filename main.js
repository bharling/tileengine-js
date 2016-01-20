(function() {
  var EarthRadius, MaxLatitude, MaxLongitude, MinLatitude, MinLongitude, Q, c, can, clip, createTile, ct, drawQuadKey, groundResolution, latLonToPix, mapScale, mapSize, pixToLatLon, pixToTile, quadKeyToTile, tileToPix, tileToQuadKey;

  can = document.getElementById('canvas');

  ct = can.getContext('2d');

  EarthRadius = 6378137;

  MinLatitude = -85.05112878;

  MaxLatitude = 85.05112878;

  MinLongitude = -180;

  MaxLongitude = 180;

  clip = function(val, min, max) {
    return Math.min(Math.max(val, min), max);
  };

  mapSize = function(lod) {
    return 256 << lod >>> 0;
  };

  groundResolution = function(latitude, lod) {
    latitude = clip(latitude, MinLatitude, MaxLatitude);
    return Math.cos(latitude * Math.PI / 180) * 2 * Math.PI * EarthRadius / mapSize(lod);
  };

  mapScale = function(latitude, lod, dpi) {
    return groundResolution(latitude, lod) * dpi / 0.0254;
  };

  latLonToPix = function(lat, lon, lod) {
    var latitude, longitude, ms, px, py, sinLatitude, x, y;
    latitude = clip(lat, MinLatitude, MaxLatitude);
    longitude = clip(lon, MinLongitude, MaxLongitude);
    x = (longitude + 180) / 360;
    sinLatitude = Math.sin(latitude * Math.PI / 180);
    y = 0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI);
    ms = mapSize(lod);
    x = x * ms + 0.5;
    y = y * ms + 0.5;
    px = clip(x, 0, ms - 1);
    py = clip(y, 0, ms - 1);
    return [px, py];
  };

  pixToLatLon = function(px, py, lod) {
    var lat, lon, ms, x, y;
    ms = mapSize(lod);
    x = (clip(px, 0, ms - 1) / ms) - 0.5;
    y = 0.5 - (clip(py, 0, ms - 1) / ms);
    lat = 90 - 360 * Math.atan(Math.exp(-y * 2 * Math.PI)) / Math.PI;
    lon = 360 * x;
    return [lat, lon];
  };

  pixToTile = function(px, py) {
    return [px / 256, py / 256];
  };

  tileToPix = function(tx, ty) {
    return [tx * 256, ty * 256];
  };

  tileToQuadKey = function(tx, ty, lod) {
    var digit, i, mask, quadKey;
    quadKey = "";
    i = lod;
    while (i--) {
      digit = 0;
      mask = 1 << (i - 1);
      if (tx & mask !== 0) {
        digit++;
      }
      if (ty & mask !== 0) {
        digit++;
        digit++;
      }
      quadKey += digit;
    }
    return quadKey;
  };

  quadKeyToTile = function(quadKey) {
    var i, j, lod, mask, ref, t, tx, ty;
    tx = ty = 0;
    lod = i = quadKey.length;
    for (i = j = ref = lod; j >= 1; i = j += -1) {
      mask = 1 << (i - 1);
      t = lod - i;
      switch (quadKey[t]) {
        case "0":
          break;
        case "1":
          tx |= mask;
          break;
        case "2":
          ty |= mask;
          break;
        case "3":
          tx |= mask;
          ty |= mask;
          break;
        default:
          throw new Error('Invalid QuadKey');
      }
    }
    return [tx, ty, lod];
  };

  Q = (function() {
    function Q(x1, y1, w1, h1, parent, data) {
      this.x = x1;
      this.y = y1;
      this.w = w1;
      this.h = h1;
      this.parent = parent != null ? parent : null;
      this.data = data != null ? data : null;
      this.children = [];
    }

    Q.fromQuadkey = function(quadKey) {
      var lod, px, py, ref, ref1, tx, ty;
      ref = quadKeyToTile(quadKey), tx = ref[0], ty = ref[1], lod = ref[2];
      ref1 = tileToPix(tx, ty), px = ref1[0], py = ref1[1];
      return new this(px, py, 256, 256, null, lod);
    };

    Q.prototype.split = function() {
      var c1, c2, c3, c4, hh, hw;
      hw = this.w / 2;
      hh = this.h / 2;
      c1 = new Q(this.x, this.y, hw, hh, this);
      c2 = new Q(this.x + hw, this.y, hw, hh, this);
      c3 = new Q(this.x + hw, this.y + hh, hw, hh, this);
      c4 = new Q(this.x, this.y + hh, hw, hh, this);
      return this.children = [c1, c2, c3, c4];
    };

    Q.prototype.draw = function() {
      var c, j, len, ref, results, tile;
      if (this.children.length) {
        ref = this.children;
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          c = ref[j];
          results.push(c.draw());
        }
        return results;
      } else {
        tile = createTile(this.x, this.y, this.w, this.h, this.data);
        return ct.putImageData(tile, this.x, this.y);
      }
    };

    Q.prototype.contains = function(rect) {};

    return Q;

  })();

  c = document.createElement('canvas');

  c.width = c.height = 256;

  createTile = function(x, y, w, h, zoom) {
    var ctx;
    c.width = w;
    c.height = h;
    ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.lineTo(0, 0);
    ctx.stroke();
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("x: " + x + ", y: " + y + ", w: " + w + ", h: " + h + ", Zoom: " + zoom, w / 2, h / 2);
    return ctx.getImageData(0, 0, w, h);
  };

  drawQuadKey = function(quadKey) {
    return Q.fromQuadkey(quadKey).draw();
  };

  drawQuadKey("00");

  drawQuadKey("01");

  drawQuadKey("02");

  drawQuadKey("03");

}).call(this);
