"use strict";

const C = require("cli-color");

const strings = require("./strings.js");
var spaceReg = new RegExp("\\s+", "gm");

/**
 * Object of public functions for performing various miscellaneous stuff
 * @namespace utils
 */
var utils = module.exports = {

  /**
   * Colors a media title based on its source. Requires colorMediaTitles to be enabled.
   * @memberof utils
   * @param  {!Bot} bot   Bot object
   * @param  {!string} type  Media type (host abbreviation)
   * @param  {!string} title Title to color
   * @return {string}       Colored title
   */
  colorMediaTitle: function(bot, type, title) {
    if (bot.cfg.interface.colorMediaTitles) {
      switch (type) {
        case "yt":
            return C.redBright(title);
        case "li":
        case "vi":
            return C.blueBright(title);
        case "dm":
            return C.yellowBright(title);
        case "sc":
            return C.yellow(title);
        case "tw":
        case "tc":
            return C.magentaBright(title);
        case "im":
            return C.greenBright(title);
        case "us":
        case "hb":
            return C.blue(title);
        case "gd":
        case "sb":
            return C.cyanBright(title);
        default:
            return C.whiteBright(title);
      }
    }
    return title;
  },

  /**
   * Colors a username based on the user's rank. Requires colorUsernames.
   * @memberof utils
   * @param  {!Bot} bot      Bot object
   * @param  {!string|Object} username Username or user object to color
   * @return {string|Object}          Colored username, or object if given and invalid
   */
  colorUsername: function(bot, user) {
    if (!user) {
      bot.logger.error(strings.format(bot, "COLORNAME_NONAME"));
      return strings.format(bot, "NO_USERNAME");
    }
    if (bot.cfg.interface.colorUsernames) {
      let _user = null;
      if (typeof user === "string") {
        if (user.indexOf("[") >= 0)
          return C[bot.cfg.interface.rankColors.server](user);
        else if (user === "(anon)")
          return C[bot.cfg.interface.rankColors.anonymous](user);
        _user = bot.getUser(user);
        if (!_user) {
          return user;
        }
      } else if (utils.isObject(user) && user.hasOwnProperty("name") && user.hasOwnProperty("rank")) {
        _user = user;
      }
      if (!_user) return strings.format(bot, "NO_USERNAME");
      if (_user.rank < 1 || (_user.meta && _user.meta.guest))
        return C[bot.cfg.interface.rankColors.unregistered](_user.name);
      else if (_user.rank >= 1 && bot.cfg.interface.rankColors.hasOwnProperty(_user.rank)) {
        if (_user.rank >= bot.RANKS.SITEOWNER)
          return C.magentaBright(_user.name);
        else
          return C[bot.cfg.interface.rankColors[_user.rank]](_user.name);
      }
      return C.whiteBright(_user.name);
    }
    return user;
  },

  /**
   * Compares two arrays and checks if the contents are identical. Order does not matter.
   * @memberof utils
   * @param  {!any[]} arrA Array A
   * @param  {!any[]} arrB Array B
   * @return {boolean}  True if arrays are the same, false otherwise.
   */
  compareArrays: function(arrA, arrB) {
    if (Array.isArray(arrA) && Array.isArray(arrB)) {
      if (arrA.length === arrB.length) {
        for (var i = 0; i < arrA.length; i++) {
          var eq = false;
          if (Array.isArray(arrA[i])) {
            for (var j = 0; j < arrB.length && !eq; j++) {
              if (Array.isArray(arrB[j])) {
                if (utils.compareArrays(arrA[i], arrB[j])) eq = true;
              }
            }
            if (!eq) return false;
          } else if (utils.isObject(arrA[i])) {
            for (var j = 0; j < arrB.length && !eq; j++) {
              if (utils.isObject(arrB[j])) {
                if (utils.compareObjects(arrA[i], arrB[j])) eq = true;
              }
            }
            if (!eq) return false;
          } else if (!~arrB.indexOf(arrA[i])) {
            return false;
          }
        }
        return true;
      }
    }
    return false;
  },

  /**
   * Compares two objects and checks if contents are identical.
   * @memberof utils
   * @param  {!Object} objA Object A
   * @param  {!Object} objB Object B
   * @return {boolean}     True if objects are the same, false otherwise.
   */
  compareObjects: function(objA, objB) {
    if (utils.isObject(objA) && utils.isObject(objB)) {
      if (Object.keys(objA).length !== Object.keys(objB).length) {
        return false;
      }
      for (var i in objA) {
        if (objB.hasOwnProperty(i)) {
          //if values are arrays
          if (Array.isArray(objA[i]) && Array.isArray(objB[i])) {
            if (!utils.compareArrays(objA[i], objB[i])) return false;
          }
          //if values are objects
          else if (utils.isObject(objA[i]) && utils.isObject(objB[i])) {
            if (!utils.compareObjects(objA[i], objB[i])) return false;
          }
          //otherwise if unequal
          else if (objA[i] !== objB[i])
            return false;
        } else {
          return false;
        }
      }
      return true;
    }
    return utils.compareArrays(objA, objB);
  },

  /**
   * Colors emotes in a message for the CLI. If enabled and uname is given, inserts the usage into the database.
   * From CyTube's source.
   * {@link https://github.com/calzoneman/sync/blob/f081bc782adba074052884995b90bc77dcef3338/www/js/util.js#L2730}
   * @memberof utils
   * @param  {!Bot} bot   Bot object
   * @param  {!string} msg   Entire message
   * @param  {?string=} uname Sender's username
   * @return {string}       Message with colored emotes
   */
  execEmotes: function (bot, msg, uname) {
    if (!bot.cfg.chat.parseEmotes) {
        return msg;
    }
    if (uname) uname = C.strip(uname);
    var count = 0,
      noLimit = bot.cfg.chat.maxEmotes < 0,
      counts = {};
    function foundEmote(name) {
      count++;
      if (!noLimit && count > bot.cfg.chat.maxEmotes) {
        return C.blackBright(name);
      } else {
        countEmote(name);
      }
      return C.cyan(name);
    }
    function countEmote(emote) {
      if (!counts.hasOwnProperty(emote)) counts[emote] = 1;
      else counts[emote] += 1;
    }
    bot.CHANNEL.badEmotes.forEach(function (e) {
        msg = msg.replace(e.regex, function (){
          return foundEmote(e.name);
        });
    });
    msg = msg.replace(/[^\s]+/gi, function (m) {
      var _m = m.toLowerCase();
        if (bot.CHANNEL.emoteMap.hasOwnProperty(_m)) {
            var e = bot.CHANNEL.emoteMap[_m];
            return foundEmote(e.name);
        } else {
            return m;
        }
    });
    if (count > 0 && uname && bot.db && bot.cfg.db.useTables.users && bot.cfg.db.useTables.emote_data && !bot.getSavedUserData(uname).quoteExempt && Object.keys(counts).length > 0) {
      var values = [];
      for (var i in counts) {
        values.push([uname, i, counts[i]]);
      }
      bot.db.run("updateEmoteCounts", values, function() {
      })
    }
    return msg;
  },

  /**
   * Creates a full link from a media type and ID, or a shortened link.
   * Most of this comes from CyTube's source.
   * {@link https://github.com/calzoneman/sync/blob/db48104b80f5713e33e91badb82626fe1ea278b7/src/utilities.js#L180}
   * @memberof utils
   * @param  {number} id    Media ID
   * @param  {string} type  Media type
   * @param  {?boolean=} short If true, will shorten the media source to type:id
   * @return {string}       Full or shortened link
   */
  formatLink: function (id, type, short) {
      if (!type || !id) return "";
      if (short) return type + ":" + id;
      switch (type) {
          case "yt":
              return "https://youtu.be/" + id;
          case "vi":
              return "https://vimeo.com/" + id;
          case "dm":
              return "https://dailymotion.com/video/" + id;
          case "sc":
              return id;
          case "li":
              return "https://livestream.com/" + id;
          case "tw":
              return "https://twitch.tv/" + id;
          case "rt":
              return id;
          case "im":
              return "https://imgur.com/a/" + id;
          case "us":
              return "https://ustream.tv/channel/" + id;
          case "gd":
              return "https://docs.google.com/file/d/" + id;
          case "fi":
              return id;
          case "hb":
              return "https://www.smashcast.tv/" + id;
          case "hl":
              return id;
          case "sb":
              return "https://streamable.com/" + id;
          case "tc":
              return "https://clips.twitch.tv/" + id;
          case "cm":
              return id;
          default:
              return "";
      }
  },

  /**
   * Extracts the hostname from a URL.
   * @memberof utils
   * @param  {!string} link Full link
   * @return {string}      Hostname
   */
  getHostname: function(link) {
    var matches = link.match(/^(?:https?\:\/\/)(?:.+?\.)*?([^\.\/]*?\.[^\.\/]*?)(?:[\:\/]|$)/i);
    if (!matches) return "";
    return matches[1];
  },

  /**
   * Gets the current time (or provided time) as a timestamp.
   * @memberof utils
   * @param  {?boolean} twentyfour If true, uses 24h time instead of AM/PM
   * @param  {?number=} time       Epoch time in milliseconds
   * @return {string}             Timestamp
   */
  getTimestamp: function(twentyfour, time) {
    var date = time ? new Date(time) : new Date(),
      now = {
        M: date.getMonth()+1,
        D: date.getDate(),
        Y: date.getFullYear().toString().substr(-2),
        h: date.getHours(),
        m: date.getMinutes(),
        s: date.getSeconds(),
        P: "a"
      };

    if (twentyfour) {
      now.P = "";
    } else {
      if (now.h >= 12) {
        now.P = "p";
        if (now.h > 12)
          now.h -= 12;
      } else if (now.h === 0) {
        now.h = 12;
      }
    }

    if (now.m < 10) now.m = "0" + now.m;
    if (now.s < 10) now.s = "0" + now.s;

    return "[" + now.M + "/" + now.D + "/" + now.Y + " " + now.h + ":" + now.m + ":" + now.s + now.P + "]";
  },

  /**
   * Gets a date string using the current UTC time, or a provided time.
   * @memberof utils
   * @see {@link getUTCTimeStringFromDate}
   * @see {@link getUTCTimestamp}
   * @param  {?number=} date Epoch time in milliseconds
   * @return {string}       Date string
   */
  getUTCDateStringFromDate: function(date) {
    date = date ? new Date(date) : new Date();
    return date.toUTCString().split(" ").splice(1,3).join(" ");
  },

  /**
   * Gets a date and time string using the current UTC time or a provided time.
   * @memberof utils
   * @see {@link getUTCDateStringFromDate}
   * @see {@link getUTCTimestamp}
   * @param  {?number=} date Epoch time in milliseconds
   * @return {string}       Date+time string
   */
  getUTCTimeStringFromDate: function(date) {
    date = date ? new Date(date) : new Date();
    return date.toUTCString().split(" ").splice(1,4).join(" ") + " UTC";
  },

  /**
   * Gets a simple time string using the current UTC time or a provided time.
   * @memberof utils
   * @see {@link getUTCDateStringFromDate}
   * @see {@link getUTCTimeStringFromDate}
   * @param  {?number=} time Epoch time in milliseconds
   * @return {string}       Time string
   */
  getUTCTimestamp: function(time) {
    var now = time ? new Date(time) : new Date();
    return now.getUTCHours() + ":" +
      (now.getUTCMinutes() > 9 ? now.getUTCMinutes() : "0" + now.getUTCMinutes()) + ":" +
      (now.getUTCSeconds() > 9 ? now.getUTCSeconds() : "0" + now.getUTCSeconds())
  },

  /**
   * Checks if a string contains the beginning of a valid inline command.
   * @memberof utils
   * @param  {!string} trig Bot trigger
   * @param  {!string} str  Message
   * @return {string}      Empty if no match, or everything after the match
   */
  inlineCmdCheck:function(trig, str) {
    let i = str.indexOf("\:\:" + trig);
    if (~i) {
      return str.substr(i + 2 + trig.length);
    }
    return "";
  },

  /**
   * Checks if something is an Object and not an array.
   * @memberof utils
   * @param  {*} item Input to check
   * @return {boolean}      True if object, false otherwise
   */
  isObject: function(item) {
    return (item instanceof Object && !Array.isArray(item));
  },

  /**
   * Checks if a whole string is a number (int or decimal), but doesn't parse it.
   * @memberof utils
   * @param  {!string} num Number string
   * @return {boolean}    True if pattern matched, otherwise false
   */
  isNumber:function(num) {
    return /^\d+(?:\.(?:\d+)?)?$/.test(num);
  },

  /**
   * Checks if a username is valid according to CyTube. Code from CyTube.
   * {@link https://github.com/calzoneman/sync/blob/f081bc782adba074052884995b90bc77dcef3338/src/utilities.js#L10}
   * @memberof utils
   * @param  {!string} name Username
   * @return {boolean}     True if username is valid, false otherwise
   */
  isValidUserName: function(name) {
    return name.match(/^[\w-]{1,20}$/);
  },

  /**
   * Checks if a string is in an IPv4 format, but very loosely. Octets can be >255
   * @memberof utils
   * @param  {!string} str IP string
   * @return {boolean}    True if IPv4, false otherwise
   */
  looseIPTest:function(str) {
    return /(\d{1,3}\.){3}\d{1,3}/.test(str);
  },

  /**
   * Parses a boolean from different datatypes.
   * @memberof utils
   * @param  {boolean|number|string} bool Input to be parsed
   * @return {boolean|null}      True/false if valid input. Null otherwise
   */
  parseBool: function(bool) {
    if (typeof bool === "boolean") return bool;
    if (typeof bool !== "string") {
      if (typeof bool === "number") return !!bool;
      return null;
    }
    //check these individually and explicitly because null lets us know if the input is bad
    if (bool.toLowerCase() === "true") return true;
    if (bool.toLowerCase() === "false") return false;
    return null;
  },

  /**
   * Checks if a given image link matches one of the specified link patterns. Used for validation.
   * @memberof utils
   * @param  {string} str Input link
   * @return {boolean|string}     False if not HTTPS, a string, or a valid pattern; otherwise returns the URL without the protocol
   */
  parseImageLink: function(str) {
    if (typeof str !== "string") return false;
    str = str.trim();

    if (str.toLowerCase().indexOf("https://") !== 0) return false;

    let exp = [
      /*discord*/ /(?:cdn\.discordapp\.com|media\.discordapp\.net)\/attachments\/\d+\/\d+\/[^\s\0\\\/\:\*\?\"\<\>\|]+\.(?:jpe?g|gif|png|webp)/gi,
      /*4chan*/ /i(?:s)?(?:\d)?\.(?:4cdn|4chan)\.org\/\w{1,6}\/\d{8,15}\.(?:jpe?g|gif|png|webp)/gi,
      /*gyazo*/ /i\.gyazo\.com\/\w+\.(?:jpe?g|gif|png|webp)/gi,
      /*tumblr*/ /(?:\d+\.)?(?:static|media)\.tumblr\.com\/(?:\w+\/)*tumblr_\w+(?:\_\w+)?\.(?:jpe?g|gif|png|webp)/gi,
      /*puush*/ /puu\.sh\/\w+\/\w+\.(?:jpe?g|gif|png|webp)/gi,
      /*leddit*/ /i\.redd\.it\/\w+\.(?:jpe?g|gif|png|webp)/gi,
      /*gfycat*/ /giant\.gfycat\.com\/\w+\.gif/gi
    ];

    let match = null,
      i = 0;

    for (;i < exp.length;i++) {
      match = str.match(exp[i]);
      if (match) return "https://" + match[0];
    }

    return false;
  },

  /**
   * Creates a data object to be used with queueing videos.
   * Directly from CyTube source.
   * {@link https://github.com/calzoneman/sync/blob/bd63013524d06f25258aab054d150325a4b91e10/www/js/util.js#L1287}
   * @memberof utils
   * @param  {string} url    Media URL
   * @return {Object|null}       Data object, or null if parsing failed
   */
  parseMediaLink: function(url) {
    if(typeof url != "string") {
        return {
            id: null,
            type: null
        };
    }
    url = url.trim();
    url = url.replace("feature=player_embedded&", "");

    //this also comes from CyTube
    function extractQueryParam(query, param) {
        var params = {};
        query.split("&").forEach(function (kv) {
            kv = kv.split("=");
            params[kv[0]] = kv[1];
        });

        return params[param];
    }

    if(url.indexOf("rtmp://") == 0) {
        return {
            id: url,
            type: "rt"
        };
    }

    var m;
    if((m = url.match(/youtube\.com\/watch\?([^#]+)/))) {
        return {
            id: extractQueryParam(m[1], "v"),
            type: "yt"
        };
    }

    // YouTube shorts
    if((m = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/))) {
        return {
            id: m[1],
            type: "yt"
        };
    }

    if((m = url.match(/youtu\.be\/([^\?&#]+)/))) {
        return {
            id: m[1],
            type: "yt"
        };
    }

    if((m = url.match(/youtube\.com\/playlist\?([^#]+)/))) {
        return {
            id: extractQueryParam(m[1], "list"),
            type: "yp"
        };
    }

    if ((m = url.match(/clips\.twitch\.tv\/([A-Za-z]+)/))) {
        return {
            id: m[1],
            type: "tc"
        };
    }

    // #790
    if ((m = url.match(/twitch\.tv\/(?:.*?)\/clip\/([A-Za-z]+)/))) {
        return {
            id: m[1],
            type: "tc"
        }
    }

    if((m = url.match(/twitch\.tv\/(?:.*?)\/([cv])\/(\d+)/))) {
        return {
            id: m[1] + m[2],
            type: "tv"
        };
    }

    /**
     * 2017-02-23
     * Twitch changed their URL pattern for recorded videos, apparently.
     * https://github.com/calzoneman/sync/issues/646
     */
    if((m = url.match(/twitch\.tv\/videos\/(\d+)/))) {
        return {
            id: "v" + m[1],
            type: "tv"
        };
    }

    if((m = url.match(/twitch\.tv\/([\w-]+)/))) {
        return {
            id: m[1],
            type: "tw"
        };
    }

    if((m = url.match(/livestream\.com\/([^\?&#]+)/))) {
        return {
            id: m[1],
            type: "li"
        };
    }

    if((m = url.match(/ustream\.tv\/([^\?&#]+)/))) {
        return {
            id: m[1],
            type: "us"
        };
    }

    if ((m = url.match(/(?:hitbox|smashcast)\.tv\/([^\?&#]+)/))) {
        return {
            id: m[1],
            type: "hb"
        };
    }

    if((m = url.match(/vimeo\.com\/([^\?&#]+)/))) {
        return {
            id: m[1],
            type: "vi"
        };
    }

    if((m = url.match(/dailymotion\.com\/video\/([^\?&#_]+)/))) {
        return {
            id: m[1],
            type: "dm"
        };
    }

    if((m = url.match(/soundcloud\.com\/([^\?&#]+)/))) {
        return {
            id: url,
            type: "sc"
        };
    }

    if ((m = url.match(/(?:docs|drive)\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)) ||
        (m = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/))) {
        return {
            id: m[1],
            type: "gd"
        };
    }

    if ((m = url.match(/(.*\.m3u8)/))) {
        return {
            id: url,
            type: "hl"
        };
    }

    if((m = url.match(/streamable\.com\/([\w-]+)/))) {
        return {
            id: m[1],
            type: "sb"
        };
    }

    /*  Shorthand URIs  */
    // So we still trim DailyMotion URLs
    if((m = url.match(/^dm:([^\?&#_]+)/))) {
        return {
            id: m[1],
            type: "dm"
        };
    }
    // Raw files need to keep the query string
    if ((m = url.match(/^fi:(.*)/))) {
        return {
            id: m[1],
            type: "fi"
        };
    }
    if ((m = url.match(/^cm:(.*)/))) {
        return {
            id: m[1],
            type: "cm"
        };
    }
    // Generic for the rest.
    if ((m = url.match(/^([a-z]{2}):([^\?&#]+)/))) {
        return {
            id: m[2],
            type: m[1]
        };
    }

    /* Raw file */
    var tmp = url.split("?")[0];
    if (tmp.match(/^https?:\/\//)) {
        if (tmp.match(/\.json$/)) {
            // Custom media manifest format
            return {
                id: url,
                type: "cm"
            };
        } else {
            // Assume raw file (server will check)
            return {
                id: url,
                type: "fi"
            };
        }
    }
    //null if parsing didn't work
    return null;
  },

  /**
   * Replaces all whitespace in a string with a single space, including newlines and zero-width spaces
   * @memberof utils
   * @param  {!string} str Input string
   * @return {string}     String without excess whitespace
   */
  removeExcessWhitespace: function(str) {
    return str.replace(spaceReg, " ");
  },

  /**
   * Loosely removes anything encased with < and >
   * @memberof utils
   * @param  {!string} str Input string
   * @return {string}     String without tags
   */
  removeHtmlTags: function(str) {
    return str.replace(/(\<.+?\>)+/gi, "");
  },

  /**
   * Converts a number into a timecode.
   * @memberof utils
   * @param  {?number} num     The input to convert
   * @param  {boolean=} letters If true, will output with dhms instead of :
   * @return {string}         Timecode string
   */
  secsToTime: function(num, letters) {
    if (undefined==num) num = 0;
    else num = Math.floor(num);
    var days = Math.floor(num/(3600*24));
    var hours = Math.floor(num/3600) % 24;
    var minutes = Math.floor(num / 60) % 60;
    var seconds = num % 60;

    if (hours < 10 && days > 0)
        hours = "0" + hours;

    if (minutes < 10 && (hours > 0 || days > 0))
        minutes = "0" + minutes;

    if (seconds < 10)
        seconds = "0" + seconds;

    var time = "";
    if (letters) {
      if (days != 0)
          time += days + "d";
      if (hours != 0)
          time += hours + "h";
      if (minutes != 0)
          time += minutes + "m";
      if (seconds != 0)
          time += seconds + "s";
      if (time === "") return "0s";
    } else {
      if (days != 0)
        time += days + ":" + hours + ":";
      else if (hours != 0)
          time += hours + ":";

      time += minutes + (letters ? "m" : ":") + seconds + (letters ? "s" : "");
    }
    return time;
  },

  /**
   * Converts [H:]M:S to seconds. Used with user input, so -1 handles invalid input.
   * @memberof utils
   * @param  {!string} timecode A timecode expected to consist of [H:]M:S
   * @return {number}          Returns -1 if invalid input, or amount of seconds represented by the timecode.
   */
  timecodeToSecs: function(timecode) {
    let matches = [...timecode.matchAll(/^(\d+\:)?(\d{1,2}\:)(\d{2})$/g)][0];
    if (!matches) return -1;
    let secs = 0;
    if (matches[1]) secs += (parseInt(matches[1]) * 60 * 60);
    if (matches[2]) secs += (parseInt(matches[2]) * 60);
    if (matches[3]) secs += parseInt(matches[3]);
    return secs;
  },

  /**
   * Cuts the first and last chars from a string.
   * @memberof utils
   * @param  {!string} str Input string
   * @return {string}     Returns str without the first and last characters
   */
  trimStringEnds: function(str) {
    return str.substr(1, str.length - 2);
  },
  /**
   * Removes an item from an unsorted array by putting the last item on the given index and reducing the array's length by 1. ONLY USE ON UNSORTED ARRAYS
   * @memberof utils
   * @param  {any[]} arr Input array
   * @param  {number} i Index of item to remove
   * @return {boolean}   False if index out of bounds, otherwise true.
   */
  unsortedRemove: function(arr, i) {
    if (i < 0 || i >= arr.length) return false;
    if (i < arr.length-1)
      arr[i] = arr[arr.length-1];
    arr.length--;
    return true;
  }
}
