/**
 * Main. Loads all required resources which would have to be loaded synchronously.
 */
var xhrManager = new mxXHRManager(function() 
{
	// Preloads stylesheet
	mxUtils.load(STYLE_PATH + '/default.xml', mxUtils.bind(this, function(req)
	{
		var doc = req.getXml();

		Graph.prototype.loadStylesheet = function()
		{
			var dec = new mxCodec(doc);
			dec.decode(doc.documentElement, this.getStylesheet());
			this.currentStyle = 'default-style2';
		};

		// Preloads all stencils from merged XML file
		mxUtils.load('js/stencils.xml',mxUtils.bind(this, function(req3)
		{
			var root = req3.getXml().documentElement;
			var node = root.firstChild;

			while (node != null)
			{
				if (node.nodeName == 'shapes' && node.getAttribute('name') != null)
				{
					mxStencilRegistry.stencilSet[node.getAttribute('name').toLowerCase()] = node;
					mxStencilRegistry.parseStencilSet(node);
				}
				
				node = node.nextSibling;
			}

			/**
			 * Editor starts here
			 */
			var ui = new App(new Editor());
		}));			
	}));
});

// Precaching for stencils. Alternatively we could generate
// a cache manifest with all stencil and shape files but this
// simplifies the cache file, streamlines the shape loading
// to a single loading point (here) vs dynamic loading in the
// online version. It does slow down the startup time though.
mxStencilRegistry.stencilSet = {};

// Overrides dynamic loading (everything loaded at startup)
mxStencilRegistry.getStencil = function(name)
{
	return mxStencilRegistry.stencils[name];
};

// Takes stencil data from cache for populating sidebar
mxStencilRegistry.loadStencilSet = function(stencilFile, postStencilLoad, force)
{
	var name = stencilFile.substring(stencilFile.indexOf('/') + 1);
	name = 'mxgraph.' + name.substring(0, name.length - 4).replace(/\//g, '.');
	var node = mxStencilRegistry.stencilSet[name];
	
	if (node != null)
	{
		mxStencilRegistry.parseStencilSet(node, postStencilLoad, false);
	}
};

// Setting default libs to a minimum
mxSettings.settings.libraries = 'general;flowchart;basic;arrows';

// Disables all online functionality
App.prototype.isOfflineApp = function()
{
	return true;
};

App.prototype.isOffline = function()
{
	return true;
};

var menusInit = Menus.prototype.init;
Menus.prototype.init = function()
{
	menusInit.apply(this, arguments);
	
	// Replaces file menu to replace openFrom menu with open and rename downloadAs to export
	var editorUi = this.editorUi;
	
	this.put('file', new Menu(mxUtils.bind(this, function(menu, parent)
	{
		this.addMenuItems(menu, ['new', 'open', '-', 'save', 'saveAs', '-', 'import'], parent);
		this.addSubmenu('export', menu, parent);
		this.addSubmenu('embed', menu, parent);
		this.addMenuItems(menu, ['-', 'moreShapes', 'documentProperties', 'print'], parent);
	})));
	
	this.put('advanced', new Menu(mxUtils.bind(this, function(menu, parent)
	{
		this.addMenuItems(menu, ['scrollbars', 'editFile'], parent);
	})));
};

// Initializes the user interface
var editorUiInit = EditorUi.prototype.init;
EditorUi.prototype.init = function()
{
	editorUiInit.apply(this, arguments);

	var graph = this.editor.graph;
	
	// Disables print action as it requires document.write
	// TODO: Add printing without using doc.write
	var printAction = this.actions.get('print');
	printAction.setEnabled(false);
	printAction.visible = printAction.isEnabled();

	var editorUi = this;
	
	// Replaces new action
	this.actions.addAction('import...', mxUtils.bind(this, function()
	{
		if (this.getCurrentFile() != null)
		{
			chrome.fileSystem.chooseEntry({type: 'openFile', acceptsAllTypes: true}, mxUtils.bind(this, function(f)
			{
				if (!chrome.runtime.lastError)
				{
					f.file(mxUtils.bind(this, function(fileObject)
					{
						var reader = new FileReader();
						
						reader.onload = mxUtils.bind(this, function(ev)
						{
							editorUi.editor.graph.setSelectionCells(editorUi.importXml(reader.result));
						});
						
						reader.readAsText(fileObject);
					}));
				}
			}));
		}
	}));
	
	// Replaces new action
	this.actions.addAction('new...', mxUtils.bind(this, function()
	{
		if (this.getCurrentFile() == null)
		{
			chrome.fileSystem.chooseEntry({type: 'saveFile',
				accepts: [{description: 'Draw.io Diagrams (.xml)',
				extensions: ['xml']}]}, mxUtils.bind(this, function(f)
			{
				if (!chrome.runtime.lastError)
				{
					var file = new LocalFile(this, '', '');
					file.fileObject = f;
					
					this.fileLoaded(file);
				}
			}));
		}
		else
		{
			// Could use URL parameter to call new action but conflicts with splash screen
			chrome.app.window.create('index.html',
			{
				bounds :
				{
					width : 1024,
					height : 768,
					left : Math.round(screen.availWidth / 2 - 512),
					top : 0 //Math.round(screen.availHeight / 4)
				}
			});
		}
	}));
	
	// Rename downloadAs to export in file menu (see above)
	this.menus.put('export', this.menus.get('downloadAs'));
}

App.prototype.pickFile = function()
{
	chrome.fileSystem.chooseEntry({type: 'openFile', acceptsAllTypes: true}, mxUtils.bind(this, function(f)
	{
		if (!chrome.runtime.lastError)
		{
			f.file(mxUtils.bind(this, function(fileObject)
			{
				var reader = new FileReader();
				
				reader.onload = mxUtils.bind(this, function(ev)
				{
					var file = new LocalFile(this, reader.result, '');
					file.fileObject = f;
					
					this.fileLoaded(file);
				});
				
				reader.readAsText(fileObject);
			}));
		}
	}));
};

mxUtils.load = function(url, onload, onerror)
{
	var req = new mxXmlRequest(url, null, 'GET', true);
	req.send(onload, onerror);
	return req;
};

LocalFile.prototype.isAutosave = function()
{
	return true;
};

LocalFile.prototype.getTitle = function()
{
	return (this.fileObject != null) ? this.fileObject.name : null;
};

LocalFile.prototype.isRenamable = function()
{
	return false;
};

// Restores default implementation of open with autosave
LocalFile.prototype.open = File.prototype.open;

LocalFile.prototype.save = function(revision, success, error)
{
	File.prototype.save.apply(this, arguments);
	
	chrome.fileSystem.getWritableEntry(this.fileObject, mxUtils.bind(this, function(f)
	{
		f.createWriter(mxUtils.bind(this, function(writer)
		{
			var blob = new Blob([this.getData()], {type: 'text/plain'});
			
			writer.onerror = function(e)
			{
				//console.log("Error");
				//console.log(e);
			};
			
			writer.onwriteend = mxUtils.bind(this, function(e)
			{
				if (writer.length === 0)
				{
					// Filewriter has been reset, write file
					writer.write(blob);
			    }
				else
				{
					// Writing file has finished, invoke callback
					this.fileObject = f;
					this.contentChanged();
					
					if (success != null)
					{
						success();
					}
			    }
			});
			
			writer.onwrite = function(e)
			{
				//console.log("Write");
				//console.log(e);
			};
			
			// Overwrites existing file via callback
			writer.truncate(0);
		}));
	}));
};

LocalFile.prototype.saveAs = function(title, success, error)
{
	chrome.fileSystem.chooseEntry({type: 'saveFile',
		accepts: [{description: 'Draw.io Diagrams (.xml)',
			extensions: ['xml']}]}, mxUtils.bind(this, function(f)
	{
		if (!chrome.runtime.lastError)
		{
			this.fileObject = f;
			this.save(false, success, error);
		}
	}));
};

App.prototype.saveFile = function(forceDialog)
{
	var file = this.getCurrentFile();
	
	if (file != null)
	{
		if (!forceDialog && file.getTitle() != null)
		{
			file.save(true, mxUtils.bind(this, function(resp)
			{
				this.spinner.stop();
				this.editor.setStatus(mxResources.get('allChangesSaved'));
			}), mxUtils.bind(this, function(resp)
			{
				this.editor.setStatus('');
				this.handleError(resp, (resp != null) ? mxResources.get('errorSavingFile') : null);
			}));
		}
		else
		{
			file.saveAs(null, mxUtils.bind(this, function(resp)
			{
				this.spinner.stop();
				this.editor.setStatus(mxResources.get('allChangesSaved'));
			}), mxUtils.bind(this, function(resp)
			{
				this.editor.setStatus('');
				this.handleError(resp, (resp != null) ? mxResources.get('errorSavingFile') : null);
			}));
		}
	}
};

App.prototype.loadImage = function(uri, onload, onerror)
{
	var xhr = new XMLHttpRequest();
	xhr.responseType = 'blob';
	xhr.onload = function()
	{
		// TODO: Create data URI
		var img = new Image();
		img.src = window.webkitURL.createObjectURL(this.response)
		
		onload(img);
	};
	
	xhr.open('GET', uri, true);
	xhr.send();
};

EditorUi.prototype.addBeforeUnloadListener = function()
{
	// Do nothing
};

mxResources.add = function(basename, lan)
{
	lan = (lan != null) ? lan : mxClient.language.toLowerCase();

	if (lan != mxConstants.NONE)
	{
		// Loads the common language file (no extension)
		var defaultBundle = mxResources.getDefaultBundle(basename, lan);

		if (defaultBundle != null)
		{
			try
			{
				var req = mxUtils.load(defaultBundle, function()
				{
					mxResources.parse(req.getText());
				}, function()
				{
					console.log(arguments)
				});

			} catch (e)
			{
				// ignore
			}
		}

		// Overlays the language specific file (_lan-extension)
		var specialBundle = mxResources.getSpecialBundle(basename, lan);

		if (specialBundle != null)
		{
			try
			{
				var req = mxUtils.load(specialBundle, function()
				{
					mxResources.parse(req.getText());
				}, function()
				{
					console.log(arguments)
				});
			} catch (e)
			{
				// ignore
			}
		}
	}
}

// Overrides dynamic loading (everything loaded at startup)
mxStencilRegistry.getStencil = function(name)
{
	return mxStencilRegistry.stencils[name];
};

// Takes stencil data from cache for populating sidebar
mxStencilRegistry.loadStencilSet = function(stencilFile, postStencilLoad, force)
{
	var name = stencilFile.substring(stencilFile.indexOf('/') + 1);
	name = 'mxgraph.' + name.substring(0, name.length - 4).replace(/\//g, '.');
	
	var node = mxStencilRegistry.stencilSet[name];
	
	if (node != null)
	{
		mxStencilRegistry.parseStencilSet(node, postStencilLoad, false);
	}
};

mxResources.add(RESOURCE_BASE);
