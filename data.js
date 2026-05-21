(function (global) {
  var legacyConfig = {
    "常规": {
      title: "木子白音乐",
      name: "木子白音乐",
      author: "木子白",
      authorUrl: "https://github.com/hnlyzxf",
      apiName: "GD音乐台",
      apiUrl: "https://music.gdstudio.xyz",
      apiBase: "https://music-api.gdstudio.xyz/api.php"
    },
    "模板": {
      default: "default",
      mengkun: "mengkun",
      maicong: "maicong"
    },
    "接口": {
      search: "https://music-api.gdstudio.xyz/api.php?types=search",
      url: "https://music-api.gdstudio.xyz/api.php?types=url",
      lyric: "https://music-api.gdstudio.xyz/api.php?types=lyric",
      pic: "https://music-api.gdstudio.xyz/api.php?types=pic"
    }
  };

  global.data = global.data || legacyConfig;
  global.Data = global.Data || legacyConfig;
  global.DATA = global.DATA || legacyConfig;
  global.config = global.config || legacyConfig;
  global.CONFIG = global.CONFIG || legacyConfig;
  global.MUSIC_CONFIG = global.MUSIC_CONFIG || legacyConfig;
})(window);
