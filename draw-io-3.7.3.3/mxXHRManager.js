/**
 * Intercepts mxXmlRequestS and fires off a callback after all of them have finished.
 */

/**
 * Parameters:
 * callback callback function to be called on request completion
 */
function mxXHRManager(callback) 
{
	var manager = this;
	
	var oldSend = mxXmlRequest.prototype.send;
	mxXmlRequest.prototype.send = function() //intercepts the send() function
	{
		oldSend.apply(this, arguments);
		manager.putRequest(this);
	};
	
	this.onRequestsFinished = function() //fired after all requests have finished
	{
		mxXmlRequest.prototype.send = oldSend;//restores the old send()
		callback.apply(this, arguments);
	};
}

mxXHRManager.prototype.constructor = mxXHRManager;
mxXHRManager.prototype.requests = {};//request map
mxXHRManager.prototype.lastRequestID = 0;
mxXHRManager.prototype.callback = null;
mxXHRManager.prototype.onRequestsFinished = null;

/**
 * Puts the request in the map and assigns it an ID
 */
mxXHRManager.prototype.putRequest = function(req) 
{
	var manager = this;
	
	req.id = this.getNextRequestID();
	this.requests[req.id] = req;
	
	var oldHandler = req.request.onreadystatechange;
	req.request.onreadystatechange = function() //adds the request removal onto existing handler
	{
		oldHandler.apply(this, arguments);
		if (req.request.readyState == 4) 
		{
			manager.removeRequest(req);
		}
	};
};

/**
 * Generates and returns a new request ID
 */
mxXHRManager.prototype.getNextRequestID = function() 
{
	return this.lastRequestID++;
};

/**
 * Removes the request from the map. If there are no requests left, it calls onRequestsFinished function.
 */
mxXHRManager.prototype.removeRequest = function(req)
{
	delete this.requests[req.id];
	
	if(Object.keys(this.requests) == 0) 
	{
		this.onRequestsFinished();
	}
}

