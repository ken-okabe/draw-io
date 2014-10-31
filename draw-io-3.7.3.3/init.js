var isSvgBrowser = true; // SVG capable browser, regardless of whether used or not

var urlParams = (function(url)
{
	var result = new Object();
	var params = window.location.search.slice(1).split('&');

	for ( var i = 0; i < params.length; i++)
	{
		idx = params[i].indexOf('=');

		if (idx > 0)
		{
			result[params[i].substring(0, idx)] = params[i].substring(idx + 1);
		}
	}

	return result;
})(window.location.href);

// Disables document.write in DropboxClient
urlParams['mode'] = 'device';
urlParams['offline'] = '1';
urlParams['gapi'] = '0';
urlParams['db'] = '0';

// Public global variables
var MAX_REQUEST_SIZE = 10485760;
var MAX_AREA = 10000 * 10000;

// CUSTOM_PARAMETERS - URLs for save and export
var EXPORT_URL = 'http://exp.draw.io/ImageExport2/export';

var SAVE_URL = 'save';
var OPEN_URL = 'open';

// Paths and files
var STENCIL_PATH = 'stencils';
var SHAPES_PATH = 'shapes';
var IMAGE_PATH = 'images';
// Path for images inside the diagram
var GRAPH_IMAGE_PATH = 'img';
var ICONFINDER_PATH = 'https://www.draw.io/iconfinder';
var STYLE_PATH = 'styles';
var CSS_PATH = 'styles';
var OPEN_FORM = 'open.html';
var TEMPLATE_PATH = '/templates';

// Directory for i18 files and basename for main i18n file
var RESOURCES_PATH = 'resources';
var RESOURCE_BASE = RESOURCES_PATH + '/dia';

// Specifies connection mode for touch devices (at least one should be true)
var tapAndHoldStartsConnection = true;
var showConnectorImg = true;
var isLocalStorage = false;
var dropboxDomain = false;
var driveDomain = false;
var uiTheme = null;

// Sets the base path, the UI language via URL param and configures the
// supported languages to avoid 404s. The loading of all core language
// resources is disabled as all required resources are in grapheditor.
// properties. Note that in this example the loading of two resource
// files (the special bundle and the default bundle) is disabled to
// save a GET request. This requires that all resources be present in
// the special bundle.
var mxLoadResources = false;

// Add new languages here. First entry is translated to [Automatic]
// in the menu defintion in Diagramly.js.
var mxLanguageMap =
{
	'bs' : 'Bosanski',
	'cs' : 'Čeština',
	'da' : 'Dansk',
	'de' : 'Deutsch',
	'en' : 'English',
	'es' : 'Español',
	'es-ar' : 'Español (Ar)',
	'fr' : 'Français',
	'id' : 'Indonesian',
	'it' : 'Italiano',
	'hu' : 'Magyar',
	'nl' : 'Nederlands',
	'no' : 'Norsk',
	'pl' : 'Polski',
	'pt-br' : 'Português (Brasil)',
	'pt' : 'Português (Portugal)',
	'ro' : 'Română',
	'fi' : 'Suomi',
	'sv' : 'Svenska',
	'tr' : 'Türkçe',
	'el' : 'Ελληνικά',
	'ru' : 'Русский',
	'sr' : 'Српски',
	'uk' : 'Українська',
	'th' : 'ไทย',
	'ar' : 'العربية',
	'zh' : '中文（中国）',
	'zh-tw' : '中文（台灣）',
	'ja' : '日本語',
	'ko' : '한국어'
};

var geBasePath = 'js';
var mxBasePath = 'mxgraph';
var mxLanguages = [];

// Uses language from operating system if resource exists
var osLanguage = chrome.i18n.getUILanguage().substring(0, 2);

if (mxLanguageMap[osLanguage] != null)
{
	mxLanguage = osLanguage;
}

// Populates the list of supported special language bundles
for ( var lang in mxLanguageMap)
{
	// Empty means default (ie. browser language), "en" means English (default for unsupported languages)
	// Since "en" uses no extension this must not be added to the array of supported language bundles.
	if (lang != 'en')
	{
		mxLanguages.push(lang);
	}
}

// Customizes sharing host
var driveDomain = window.location.hostname == 'rt.draw.io' || window.location.hostname == 'drive.draw.io' || urlParams['rt'] == '1';
var dropboxDomain = window.location.hostname == 'db.draw.io';
