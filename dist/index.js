"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var map_1 = __importDefault(require("ol/map"));
var image_1 = __importDefault(require("ol/layer/image"));
var view_1 = __importDefault(require("ol/view"));
var extent_1 = __importDefault(require("ol/extent"));
var overlay_1 = __importDefault(require("ol/overlay"));
var vector_1 = __importDefault(require("ol/layer/vector"));
var imagestatic_1 = __importDefault(require("ol/source/imagestatic"));
var vector_2 = __importDefault(require("ol/source/vector"));
var projection_1 = __importDefault(require("ol/proj/projection"));
var feature_1 = __importDefault(require("ol/feature"));
var point_1 = __importDefault(require("ol/geom/point"));
var linestring_1 = __importDefault(require("ol/geom/linestring"));
var polygon_1 = __importDefault(require("ol/geom/polygon"));
var style_1 = __importDefault(require("ol/style/style"));
var icon_1 = __importDefault(require("ol/style/icon"));
var text_1 = __importDefault(require("ol/style/text"));
var stroke_1 = __importDefault(require("ol/style/stroke"));
var fill_1 = __importDefault(require("ol/style/fill"));
var interaction_1 = __importDefault(require("ol/interaction"));
var _config;
/** Internal map obects */
var map;
var view;
var vectorLayer;
var imlayer;
var imExtent;
var imProjection;
/** Attributions to show on map */
var attributions;
/** GPS following */
var followingUser = false;
var followingUserCallback = null;
/** Geolocation id of watch */
var geoLocationId;
/** Last known geolocation */
var geoLocationLast;
/** Whether to show residences on map */
var showResidences = false;
var filter = 'all';
/** Model to convert lat-lng to pixel coords */
var MAP_Xn = 19.133691;
var MAP_Yn = 72.916984;
var MAP_Zn = 4189;
var MAP_Zyn = 1655;
var MAP_WEIGHTS_X = [
    -7.769917472065843,
    159.26978694839946,
    244.46989575495544,
    -6.003894110679995,
    -0.28864271213341297,
    0.010398324019718075,
    4.215508849724247,
    -0.6078830146963545,
    -7.0400449629241395
];
var MAP_WEIGHTS_Y = [
    14.199431377059842,
    -158.80601990819815,
    68.9630034040724,
    5.796703402034644,
    1.1348242200568706,
    0.11891051684489184,
    -0.2930832938484276,
    0.1448231125788526,
    -5.282895700923075
];


function setFilter(newFilter){
    filter=newFilter;
    vectorLayer.getSource.changed();
}
exports.setFilter=setFilter;
/** Make and get the map. Call only once. */
function getMap(config, locations, locationSelectCallback, mapLoadedCallback) {
    _config = config;
    /* Make features array */
    var features = [];
    for (var _i = 0, locations_1 = locations; _i < locations_1.length; _i++) {
        var loc = locations_1[_i];
        /* Change coordinate sysetm */
        var pos = [loc.pixel_x, 3575 - loc.pixel_y];
        /* Ignore inner locations */
        if (loc.parent === null) {
            /* Make the Feature */
            var iconFeature = new feature_1.default({
                geometry: new point_1.default(pos),
                loc: loc
            });
            /* Push into array */
            features.push(iconFeature);
        }
    }
    /* Make vector source and layer from features */
    var vectorSource = new vector_2.default({
        features: features
    });
    /* Style the vector layer */
    var vectorLayerStyle = function (feature) {
        var zoom = map.getView().getZoom();
        var loc = feature.get('loc');
        /* Hide residences */
        if (loc.group_id === 3 && !showResidences) {
            return;
        }
        /* Increase font size with zoom */
        var font_size = zoom * 3;
        /* Choose short name if present */
        var loc_name = loc.name;
        if (loc.short_name !== '0') {
            loc_name = loc.short_name;
        }
        if(loc.hostel){
            loc_name = "🏢" + loc_name;
        }
        else if(loc.eatery){
            loc_name = "🍽️" + loc_name;
        }
        /* Choose icon color based on group id */
        var icon_color;
        if (loc.group_id === 1 || loc.group_id === 4 || loc.group_id === 12) {
            icon_color = 'blue';
        }
        else if (loc.group_id === 3) {
            icon_color = 'green';
        }
        else if (loc.group_id === 2) {
            icon_color = 'yellow';
        }
        else {
            icon_color = 'gray';
        }
        /* Make text object */
        /* Icon image*/
        var icon = new icon_1.default({
            src: _config.markersBase + "marker_dot_" + icon_color + ".png",
            scale: 0.2
        });
        var text = new text_1.default({
            offsetY: 20,
            padding: [20, 20, 20, 20],
            font: font_size + "px Roboto",
            text: loc_name,
            fill: new fill_1.default({
                color: '#ffffff'
            }),
            stroke: new stroke_1.default({
                color: '#444', width: 3
            })
        });
        if(loc.eatery === true && filter.includes('eateries')){
            var icon = new icon_1.default({
                src: _config.markersBase+ "fast-food.png",
                scale: 0.2
            });
            var text = new text_1.default({
                offsetY: 20,
                padding: [20, 20, 20, 20],
                font: font_size + "px Roboto",
                text: loc_name,
                fill: new fill_1.default({
                    color: '#ffffff'
                }),
                stroke: new stroke_1.default({
                    color: '#444', width: 3
                })
            });
        }
        else if(loc.hostel === true && filter.includes('hostels')){
            var icon = new icon_1.default({
                src: _config.markersBase + "location-pin.png",
                scale: 0.2
            });
            var text = new text_1.default({
                offsetY: 20,
                padding: [20, 20, 20, 20],
                font: font_size + "px Roboto",
                text: loc_name,
                fill: new fill_1.default({
                    color: '#ffffff'
                }),
                stroke: new stroke_1.default({
                    color: '#444', width: 3
                })
            });
        }
        
        /* Make style */
        // console.log(zoom);
        var style = new style_1.default({
            image: (zoom >= 3) ? icon : undefined,
            text: (zoom >= 4) ? text : undefined,
        });
        return [style];
    };
    vectorLayer = new vector_1.default({
        source: vectorSource,
        updateWhileInteracting: true,
        updateWhileAnimating: true,
        style: vectorLayerStyle
    });
    /* Configure map */
    imExtent = [0, 0, 5430, 3575];
    imProjection = new projection_1.default({
        code: 'instiMAP',
        units: 'pixels',
        extent: imExtent
    });
    var staticSource = new imagestatic_1.default({
        url: config.mapMinPath,
        attributions: attributions,
        projection: imProjection,
        imageExtent: imExtent,
        imageLoadFunction: function (image, src) {
            /* For showing loading spinner */
            var img = image.getImage();
            img.src = src;
            img.onload = function () {
                loadHighRes();
                mapLoadedCallback();
            };
        }
    });
    /* Make image layer */
    imlayer = new image_1.default({
        source: staticSource
    });
    /* Disable tilting */
    var interactions = interaction_1.default.defaults({ altShiftDragRotate: false, pinchRotate: false });
    /* Make view */
    view = new view_1.default({
        projection: imProjection,
        center: extent_1.default.getCenter(imExtent),
        zoom: 3.4,
        minZoom: 2,
        maxZoom: 5.5,
        extent: [300, 300, 5000, 3000]
    });
    /* Generate map */
    map = new map_1.default({
        interactions: interactions,
        layers: [
            imlayer,
            vectorLayer
        ],
        target: _config.map_id,
        view: view,
        controls: []
    });
    /* Handle click */
    map.on('click', function (evt) {
        /* Create extent of acceptable click */
        var pixel = evt.pixel;
        var pixelOffSet = 30;
        var pixelWithOffsetMin = [pixel[0] - pixelOffSet, pixel[1] + pixelOffSet];
        var pixelWithOffsetMax = [pixel[0] + pixelOffSet, pixel[1] - pixelOffSet];
        var XYMin = map.getCoordinateFromPixel(pixelWithOffsetMin);
        var XYMax = map.getCoordinateFromPixel(pixelWithOffsetMax);
        var ext = XYMax.concat(XYMin);
        var extentFeat = new feature_1.default(new polygon_1.default([[
                [ext[0], ext[1]],
                [ext[0], ext[3]],
                [ext[2], ext[3]],
                [ext[2], ext[1]],
                [ext[0], ext[1]]
            ]]));
        /* Get first nearby feature */
        var feature = vectorLayer.getSource().forEachFeatureIntersectingExtent(extentFeat.getGeometry().getExtent(), function (f) { return f; });
        /* Zoom in */
        if (feature) {
            var location_1 = feature.get('loc');
            moveToLocation(location_1);
            locationSelectCallback(location_1);
        }
        else {
            moveMarker(-50, -50, false);
            locationSelectCallback();
        }
    });
    /* Change mouse cursor on features */
    map.on('pointermove', function (e) {
        var pixel = map.getEventPixel(e.originalEvent);
        var hit = map.hasFeatureAtPixel(pixel);
        var nativeElem = document.getElementById(_config.map_id);
        if (nativeElem != null) {
            nativeElem.style.cursor = hit ? 'pointer' : 'move';
        }
    });
    /* Stop following the user on drag */
    map.on('pointerdrag', function () {
        setFollowingUser(false);
    });
    return map;
}
exports.getMap = getMap;
/** Move marker to a location */
function moveToLocation(loc) {
    moveMarker(loc.pixel_x, loc.pixel_y, true);
}
exports.moveToLocation = moveToLocation;
/** Move the marker to location */
function moveMarker(x, y, center, markerid) {
    if (center === void 0) { center = true; }
    if (markerid === void 0) { markerid = _config.marker_id; }
    var pos = [Number(x), 3575 - Number(y)];
    /* Check for existing overlay */
    var overlay = map.getOverlayById(markerid);
    /* Check for invalid coordinates */
    if (overlay !== null) {
        /* Overlay exists */
        overlay.setPosition(pos);
    }
    else {
        /* Create a new overlay */
        var element = document.getElementById(markerid);
        var marker = new overlay_1.default({
            id: markerid,
            position: pos,
            positioning: 'bottom-center',
            element: element,
            stopEvent: false,
            offset: [0, 0]
        });
        map.addOverlay(marker);
    }
    /* Animate */
    if (center) {
        view.animate({ center: pos });
        view.animate({ zoom: 4.5 });
    }
}
exports.moveMarker = moveMarker;
/** Show/hide residence buildings on map */
function setResidencesVisible(visible) {
    showResidences = visible;
    vectorLayer.getSource().changed();
}
exports.setResidencesVisible = setResidencesVisible;
/** Load the high resolution map */
function loadHighRes() {
    /* High res source */
    var highResSource = new imagestatic_1.default({
        url: _config.mapPath,
        attributions: attributions,
        projection: imProjection,
        imageExtent: imExtent,
    });
    /* Load high resolution image */
    var highRes = new Image();
    highRes.src = _config.mapPath;
    highRes.onload = function () {
        imlayer.setSource(highResSource);
    };
}
/** Determine if we support geolocation */
function hasGeolocation() {
    return navigator.geolocation ? true : false;
}
exports.hasGeolocation = hasGeolocation;
/** Setup a location watch */
function getGPS(failedCallback) {
    if (hasGeolocation()) {
        /* Start following the user */
        setFollowingUser(true);
        /* If we already have permission */
        if (geoLocationId != null) {
            moveGPS(true);
            return;
        }
        /* Get permission and setup a watch */
        geoLocationId = navigator.geolocation.watchPosition(function (position) {
            var follow = followingUser || geoLocationLast == null;
            var l = getMapXY(position);
            if (l.pixel_x > 0 && l.pixel_y > 0 && l.pixel_x < 5430 && l.pixel_y < 5375) {
                geoLocationLast = l;
                moveGPS(follow);
            }
        }, function () { }, {
            enableHighAccuracy: true
        });
    }
    else {
        if (failedCallback) {
            failedCallback();
        }
    }
}
exports.getGPS = getGPS;
/** Center the user marker to last known location */
function moveGPS(center) {
    if (geoLocationLast == null) {
        return;
    }
    moveMarker(geoLocationLast.pixel_x, geoLocationLast.pixel_y, center, _config.user_marker_id);
}
/** Apply regression to get pixel coordinates on InstiMap */
function getMapXY(position) {
    /* Set the origin */
    var x = (position.coords.latitude - MAP_Xn) * 1000;
    var y = (position.coords.longitude - MAP_Yn) * 1000;
    /* Apply the model */
    var A = MAP_WEIGHTS_X;
    var px = Math.round(MAP_Zn + A[0] + A[1] * x + A[2] * y +
        A[3] * x * x + A[4] * x * x * y +
        A[5] * x * x * y * y + A[6] * y * y +
        A[7] * x * y * y + A[8] * x * y);
    A = MAP_WEIGHTS_Y;
    var py = Math.round(MAP_Zyn + A[0] + A[1] * x + A[2] * y +
        A[3] * x * x + A[4] * x * x * y +
        A[5] * x * x * y * y + A[6] * y * y +
        A[7] * x * y * y + A[8] * x * y);
    return { pixel_x: px, pixel_y: py };
}
exports.getMapXY = getMapXY;
/** True if the user is being followed around the map */
function isFollowingUser() {
    return followingUser;
}
exports.isFollowingUser = isFollowingUser;
/** Setter for followingUser */
function setFollowingUser(val) {
    if (followingUser === val) {
        return;
    }
    followingUser = val;
    if (followingUserCallback != undefined && followingUserCallback != null) {
        followingUserCallback(followingUser);
    }
}
exports.setFollowingUser = setFollowingUser;
/** Last known geolocation */
function getGeolocationLast() {
    return geoLocationLast;
}
exports.getGeolocationLast = getGeolocationLast;
/** Call this to remove watches */
function cleanup() {
    if (geoLocationId != null && geoLocationId != undefined) {
        navigator.geolocation.clearWatch(geoLocationId);
    }
}
exports.cleanup = cleanup;
/** Add event listener for followinguser change */
function addOnUserFollowingChangeListener(callback) {
    followingUserCallback = callback;
}
exports.addOnUserFollowingChangeListener = addOnUserFollowingChangeListener;
function makeline(point1x, point1y, point2x, point2y, color, width) {
    var featureLine = new feature_1.default({
        geometry: new linestring_1.default([[point1x, 3575 - point1y], [point2x, 3575 - point2y]]),
    });
    var vectorLine = new vector_2.default({});
    vectorLine.addFeature(featureLine);
    var vectorLineLayer = new vector_1.default({
        source: vectorLine,
        style: new style_1.default({
            fill: new fill_1.default({ color: color }),
            stroke: new stroke_1.default({ color: color, width: width, lineDash: [0, 0]})
        })
    });
    map.addLayer(vectorLineLayer);
    return vectorLineLayer;
}
exports.makeline = makeline;
function removeLine(vectorLineLayer) {
    map.removeLayer(vectorLineLayer);
}
exports.removeLine = removeLine;
