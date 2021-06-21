
const {Collection} = require('./collection');

class SearchCollection extends Collection {
    
    constructor(data) {
        super(data);
        this.page = 0;
        this.url2 = data.url2;
        this.searchids = {};
    }

    requestSearchID(url) {
        let urlHref = new PageURL(url);
        return new Promise((resolve, reject) => {
            let req = glib.Request.new('POST', url);
            let hash = glib.KeyValue.get('formhash');
            req.setBody(glib.Data.fromString(`formhash=${hash}&scm=game&srchtxt=${glib.Encoder.urlEncode(this.key)}&searchsubmit=yes`));
            req.setHeader("Content-Type", "application/x-www-form-urlencoded");
            let cookies = glib.KeyValue.get('rendiyu:cookies');
            console.log("cookies " + cookies);
            if (cookies)
                req.setHeader('Cookie', cookies);
            this.callback = glib.Callback.fromFunction(function() {
                if (req.getError()) {
                    reject(glib.Error.new(302, "Request error " + req.getError()));
                } else {
                    let body = req.getResponseBody();
                    if (body) {
                        try {
                            let url = new URL(urlHref.href(req.getResponseHeaders().toObject()['location'].join('')));
                            resolve(url.searchParams['searchid']);
                        } catch (e) {
                            reject(e);
                        }
                    } else {
                        reject(glib.Error.new(301, "Response null body"));
                    }
                }
            });
            req.setOnComplete(this.callback);
            req.start();
        });
    }

    async fetch(page) {
        let searchid = this.searchids[this.key];
        if (!searchid) {
            searchid = await this.requestSearchID(this.url);
            this.searchids[this.key] = searchid;
        } 
        if (!searchid) {
            throw new Error('No searchid');
        }

        // let pageUrl = new PageURL(url);
        let doc = await super.fetch(this.makeURL(page));
        let nodes = doc.querySelectorAll('li.pbw');
        
        let results = [];
        for (let node of nodes) {
            let item = glib.DataItem.new();
            
            let link = node.querySelector('a')
            item.link = link.attr('href');
            item.title = link.text;
            item.subtitle = node.querySelector('p:last-child').text.replaceAll('\n', '');
            results.push(item);
        }
        return results;
    }

    makeURL(page) {
        let searchid = this.searchids[this.key];
        return this.url2.replace('{0}', page + 1).replace('{1}', searchid);
    }

    reload(data, cb) {
        this.key = data.get("key") || this.key;
        let page = data.get("page") || 0;
        if (!this.key) return false;
        this.fetch(page).then((results)=>{
            this.page = page;
            this.setData(results);
            cb.apply(null);
        }).catch(function(err) {
            if (err instanceof Error) 
                err = glib.Error.new(305, err.message);
            cb.apply(err);
        });
        return true;
    } 

    loadMore(cb) {
        let page = this.page + 1;
        this.fetch(page).then((results)=>{
            this.page = page;
            this.appendData(results);
            cb.apply(null);
        }).catch(function(err) {
            if (err instanceof Error) 
                err = glib.Error.new(305, err.message);
            cb.apply(err);
        });
        return true;
    }
}

module.exports = function(data) {
    return SearchCollection.new(data ? data.toObject() : {});
};