can = document.getElementById 'canvas'
ct = can.getContext '2d'


# This is da shizzle
# https://msdn.microsoft.com/en-us/library/bb259689.aspx


EarthRadius = 6378137
MinLatitude = -85.05112878
MaxLatitude = 85.05112878
MinLongitude = -180
MaxLongitude = 180

TOPLEFT = [0,0]

clip = (val, min, max) ->
	Math.min Math.max( val, min ), max

mapSize = (lod) ->
	( 256 << lod ) >>> 0

groundResolution = (latitude, lod) ->
	latitude = clip latitude, MinLatitude, MaxLatitude
	Math.cos( latitude * Math.PI / 180 ) * 2 * Math.PI * EarthRadius / mapSize(lod)

mapScale = (latitude, lod, dpi) ->
	groundResolution(latitude, lod) * dpi / 0.0254

latLonToPix = (lat, lon, lod) ->
	latitude = clip(lat, MinLatitude, MaxLatitude)
	longitude = clip(lon, MinLongitude, MaxLongitude)
	x = (longitude + 180) / 360
	sinLatitude = Math.sin(latitude * Math.PI / 180)
	y = 0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)

	ms = mapSize lod
	x = x * ms + 0.5
	y = y * ms + 0.5
	px = ( clip( x, 0, ms - 1 ) ) | 0
	py = ( clip( y, 0, ms - 1 ) ) | 0
	[px, py]

pixToLatLon = (px, py, lod) ->
	ms = mapSize(lod)
	x = (clip(px,0,ms-1) / ms) - 0.5
	y = 0.5 - (clip(py, 0, ms-1) / ms)
	lat = 90 - 360 * Math.atan(Math.exp(-y * 2 * Math.PI)) / Math.PI
	lon = 360 * x
	[lat,lon]


pixToTile = (px, py) ->
	[(px / 256) | 0, (py / 256) | 0]

tileToPix = (tx, ty) ->
	[(tx * 256) | 0, (ty * 256) | 0]

tileToQuadKey = (tx, ty, lod) ->
	quadKey = ""
	i = lod
	for i in [lod .. 1] by -1
		digit = 0
		mask = (1 << (i-1))
		if (tx & mask) != 0
			digit++
		if (ty & mask) != 0
			digit++
			digit++
		quadKey += digit
	quadKey

quadKeyToTile = (quadKey) ->
	tx = ty = 0
	lod = i = quadKey.length

	for i in [lod .. 1] by -1
		mask = (1 << (i - 1)) | 0
		t = lod - i
		switch quadKey[t]
			when "0" then break
			when "1" then tx |= mask
			when "2" then ty |= mask

			when "3"
				tx |= mask
				ty |= mask
			else throw new Error('Invalid QuadKey')
	[tx,ty,lod]

class Q
	constructor: (@x, @y, @w, @h, @parent=null, @data=null) ->
		@children = []

	@fromQuadkey: (quadKey) ->
		[tx, ty, lod] = quadKeyToTile quadKey
		[px , py] = tileToPix tx, ty
		new @( px, py, 256, 256, null, lod )

	split: ->
		hw = @w / 2
		hh = @h / 2

		c1 = new Q(@x, @y, hw, hh, @)
		c2 = new Q(@x+hw, @y, hw, hh, @)
		c3 = new Q(@x+hw, @y+hh, hw, hh, @)
		c4 = new Q(@x, @y+hh, hw, hh, @)

		@children = [c1, c2, c3, c4]

	draw: ->
		if @children.length
			for c in @children
				c.draw()
		else
			tile = createTile @x, @y, @w, @h, @data
			ct.putImageData tile, 0, 0


	contains: (rect) ->

c = document.createElement 'canvas'
c.width = c.height = 256




createTile = (x,y,w,h,zoom) ->
	#c = document.createElement 'canvas'

	c.width = w
	c.height = h
	ctx = c.getContext '2d'
	ctx.clearRect 0, 0, c.width, c.height
	ctx.beginPath()
	ctx.moveTo 0,0
	ctx.lineTo w,0
	ctx.lineTo w,h
	ctx.lineTo 0,h
	ctx.lineTo 0,0
	ctx.stroke()
	ctx.font = '12px Arial'
	ctx.textAlign = 'center'
	ctx.fillText "x: #{x}, y: #{y}, w: #{w}, h: #{h}, Zoom: #{zoom}", w/2, h/2
	ctx.getImageData 0, 0, w, h

drawQuadKey = (quadKey) ->
	Q.fromQuadkey( quadKey ).draw()


atPosition = (lat, lon, zoom) ->
	ct.clearRect 0, 0, can.width, can.height
	[px, py] = latLonToPix(lat, lon, zoom)

	TOPLEFT = [px,py]

	[tx, ty] = pixToTile(px, py)
	quadKey = tileToQuadKey( tx, ty, zoom )
	drawQuadKey quadKey
	px: px, py: py, tx: tx, ty: ty, quadKey: quadKey

atPosition(51.3905059, -40.3581019, 6)


exports = if typeof exports == 'undefined' then window else exports

exports.atPosition = atPosition


#root = new Q(0, 0, 512, 512)
#root.split()
#root.children[0].split()
#root.children[0].children[2].split()
#root.draw()
