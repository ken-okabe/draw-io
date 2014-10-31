chrome.app.runtime.onLaunched.addListener(function()
{
	chrome.app.window.create('index.html',
	{
		bounds :
		{
			width : Math.min(screen.availWidth, 1024),
			height : Math.min(screen.availHeight, 768),
			left : Math.round(screen.availWidth / 2 - 512),
			top : 0 //Math.round(screen.availHeight / 4)
		}
	});
});
