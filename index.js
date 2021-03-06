
const {Collection} = require('./collection');

function makeItem(node, pageUrl, type) {
    let item = glib.DataItem.new();
    let link = node.querySelector('.atc > a');
    let url = link.attr('href');
    item.link = pageUrl.href(url);
    item.picture = link.querySelector('img').attr('src').replace(/^http:/, 'https:');
    item.data = {
        type: type
    };
    let list = node.querySelectorAll('dt');
    item.title = list[0].querySelector('.x_h2').text;
    let subtitle = [];
    for (let i = 1, t = list.length - 1; i < t; ++i) {
        subtitle.push(list[i].text.replaceAll('\n', '').trim());
    }
    item.subtitle = subtitle.join('\n');

    return item;
}

class CategoryCollection extends Collection {

    constructor(data) {
        super(data);
        this.page = 0;
        this.type = data.type;
    }

    async fetch(url) {
        let pageUrl = new PageURL(url);

        let doc = await super.fetch(url);
        let hashnode = doc.querySelector('#scbar_form input[name=formhash]');
        glib.KeyValue.set('formhash', hashnode.attr('value'));
        let nodes = doc.querySelectorAll('.game_item');

        let items = [];
        for (let node of nodes) {
            items.push(makeItem(node, pageUrl, this.type));
        }
        return items;
    }

    makeURL(page) {
        if (this.url.indexOf('{0}') == -1) return this.url;
        return this.url.replace('{0}', page + 1);
    }

    reload(_, cb) {
        let page = 0;
        this.fetch(this.makeURL(page)).then((results)=>{
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
        if (this.url.indexOf('{0}') == -1) return false;
        let page = this.page + 1;
        this.fetch(this.makeURL(page)).then((results)=>{
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

    onResponse(req) {
        console.log('test0');
        let cookies = req.getResponseHeaders().toObject()['set-cookie'];
        console.log('test1');
        if (cookies) {
            let arr = [];
            for (let cookie of cookies) {
                let m = cookie.match(/(\w+)=([^;]+);/);
                if (m && m[2] !== 'deleted') {
                    arr.push(`${m[1]}=${m[2]}`);
                }
            }
            console.log('test2');
            glib.KeyValue.set('rendiyu:cookies', arr.join('; '));
        }
    }
}

module.exports = function(info) {
    return CategoryCollection.new(info.toObject());
};
