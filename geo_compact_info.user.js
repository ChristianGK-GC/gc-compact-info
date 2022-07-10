// ==UserScript==
// @name         Compact Information
// @namespace    https://www.geocaching.com/
// @version      0.1.3
// @description  Creates a compact overview of a geocache incl. a copy to clipboard function.
// @homepage     https://github.com/ChristianGK-GC/gc-compact-info
// @homepageURL  https://github.com/ChristianGK-GC/gc-compact-info
// @supportURL   https://github.com/ChristianGK-GC/gc-compact-info/issues
// @downloadURL  https://github.com/ChristianGK-GC/gc-compact-info/raw/main/geo_compact_info.user.js
// @updateURL    https://github.com/ChristianGK-GC/gc-compact-info/raw/main/geo_compact_info.user.js
// @author       ChristianGK
// @copyright    2022 ChristianGK
// @license      GNU General Public License v2.0
// @match        https://www.geocaching.com/geocache/*
// @icon64       https://upload.wikimedia.org/wikipedia/de/thumb/9/9a/Gc.svg/240px-Gc.svg.png
// @icon         https://www.cachewiki.de/w/images/c/c9/Logo.png
// @connect      nominatim.openstreetmap.org
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    if (is_page("cache_listing")) {
        try {
            function CompactInfoMain() {
                console.log('CompactInfoMain');
                var output = '<div class="LocationData CompactInfoMain" style="min-height: 30px;">';
                output += '<input type="button" class="Compact_Info_Button" value="Get data" style="color: #fff; min-width: 100px; background: #00b265; border: #00b265; border-radius: 4px; padding: 5px; text-align: center; float: right;"></input>';
                output += '<input type="button" class="Compact_Copy_Button" value="Get data" style="color: #fff; min-width: 100px; background: #00b265; border: #00b265; border-radius: 4px; padding: 5px; text-align: center; float: right; display: none;"></input>';
                output += '<div id="Compact_Info" style="word-break: break-word; font-size: x-small; display: none;">';
                output += '<span id="Compact_Info_Address"></span>';
                output += '<br><span id="Compact_Info_GCName"></span> <span id="Compact_Info_GCcode"></span> (<span id="Compact_Info_City"></span>)';
                output += '<br><span id="Compact_Info_GCLink"></span>';
                output += '<br><span id="Compact_Info_GCCoord"></span>';
                output += '<br><span id="Compact_Info_GCNote"></span>';
                output += '</div>';
                output += '</div>';
                document.getElementById('ctl00_ContentBody_CacheInformationTable').lastElementChild.outerHTML += output;

                var CompactInfoBtn = document.querySelector('.Compact_Info_Button');
                CompactInfoBtn.addEventListener('click', function(event) {
                    GetCompactInfo();
                })
            }

            function GetCompactInfo() {
                console.log('Get Compact Info');

                var GCName = document.getElementById('ctl00_ContentBody_CacheName').textContent;
                document.getElementById('Compact_Info_GCName').innerHTML = GCName;
                var GCcode = document.getElementById('ctl00_ContentBody_CoordInfoLinkControl1_uxCoordInfoCode').textContent;
                document.getElementById('Compact_Info_GCcode').innerHTML = GCcode;
                var GCLink = document.getElementById('coordinate-link-control').href;
                document.getElementById('Compact_Info_GCLink').innerHTML = GCLink;
                var GCCoord = '';
                if (document.getElementById('uxLatLon').className == 'myLatLon') {
                    GCCoord = document.getElementById('uxLatLon').innerHTML;
                } else {
                    GCCoord = 'Still original coordinates: ' + document.getElementById('uxLatLon').innerHTML;
                }
                document.getElementById('Compact_Info_GCCoord').innerHTML = GCCoord;

                var coordinates = document.getElementById('ctl00_ContentBody_MapLinks_MapLinks').firstChild.firstChild.firstChild.href;
                var latitude = coordinates.replace(/.*lat=([^&]*)&lng=.*/, "$1");
                var longitude = coordinates.replace(/.*&lng=(.*)$/, "$1");

                if (document.getElementById('viewCacheNote').children[0]) {
                    var GCNote = document.getElementById('viewCacheNote').children[0].textContent.replace(/\n/g, '<br />');
                    document.getElementById('Compact_Info_GCNote').innerHTML = GCNote;
                }
                document.getElementsByClassName('Compact_Info_Button')[0].attributes.value.textContent = 'Copy data';

                Coord2Location(latitude, longitude);

                var CompactInfoBtn = document.querySelector('.Compact_Info_Button');
                CompactInfoBtn.addEventListener('click', function(event) {
                    CopyElementByIdToClipboard('Compact_Info');
                })
                document.getElementById('Compact_Info').style.display = "unset";
            }

            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            function CopyElementByIdToClipboard(element) {
                console.log('CopyElementByIdToClipboard');
                try {
                    var range = document.createRange();
                    range.selectNode(document.getElementById(element));
                    window.getSelection().removeAllRanges();
                    window.getSelection().addRange(range);
                    document.execCommand("copy");
                    window.getSelection().removeAllRanges();
                } catch(e) {("Copy to clipboard",e);}
            }

            function Coord2Location(latitude, longitude) {
                console.log('Coord2Location(' + latitude + ',' + longitude + ')');

                // https://nominatim.org/release-docs/latest/api/Reverse/
                var url = 'https://nominatim.openstreetmap.org/reverse?lat=' + latitude + '&lon=' + longitude + '&zoom=16&addressdetails=1&format=json';
                console.log(url);
                GM.xmlHttpRequest({
                    method: "GET",
                    url: url,
                    onload: function(response) {
                        var result = JSON.parse(response.responseText);
                        if (!result.display_name) {
                            return false;
                        }
                        var formattedAddress = result.address.country;

                        if (result.address.state) {
                            formattedAddress += ' | ' + result.address.state;
                        }

                        if (result.address.county) {
                            formattedAddress += ' | ' + result.address.county.replace(/Landkreis/g, '').trim();
                        } else if (result.address.city) {
                            formattedAddress += ' | ' + result.address.city;
                        }

                        var display_name = result.display_name;
                        display_name = display_name.replace(result.address.country, '');
                        display_name = display_name.replace(result.address.postcode, '');
                        display_name = display_name.replace(result.address.state, '');
                        display_name = display_name.replace(result.address.county, '');
                        display_name = display_name.replace(result.address.municipality, '');
                        display_name = display_name.replace(result.address.road, '');
                        display_name = display_name.replace(result.address.neighbourhood, '');
                        display_name = display_name.replace(result.address.industrial, '');
                        display_name = display_name.replace(result.address.isolated_dwellin, '');
                        display_name = display_name.replace(/(?:^(\, )+)|(?:(\, )+)$/g, '');

                        document.getElementById('Compact_Info_Address').innerHTML = formattedAddress;
                        document.getElementById('Compact_Info_City').innerHTML = display_name;
                    }
                });
            }

            CompactInfoMain();
        } catch(e) {("CompactInfoMain",e);}
    }

    function is_page(name) {
        var status = false;
        var url = document.location.pathname;
        if (name == "cache_listing") {
            if (url.match(/^\/(seek\/cache_details\.aspx|geocache\/)/) && !document.getElementById("cspSubmit") && !document.getElementById("cspGoBack")) status = true;
            // Exclude (new) Log Page
            if (url.match(/^\/(geocache\/).*\/log/)) status = false;
            // Exclude unpublished Caches
            if (document.getElementsByClassName('UnpublishedCacheSearchWidget').length > 0) status = false;
        } else {
            console.error("is_page", "is_page("+name+", ... ): unknown name");
        }
        return status;
    }
}());
