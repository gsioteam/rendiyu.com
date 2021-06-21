
const {Collection} = require('./collection');

const sysType = '系统支持：';
const typeDB = {
    'GBA': 'Nintendo - Game Boy Advance',
    'NDS': 'Nintendo - Nintendo DS',
    'FC': 'Nintendo - Nintendo Entertainment System',
    'SFC': 'Nintendo - Super Nintendo Entertainment System',
    'PS': 'Sony - PlayStation',
    'PSP': 'Sony - PlayStation Portable',
    'MD': 'Sega - Mega Drive - Genesis',
    'GBC': 'Nintendo - Game Boy Color',
    'MAME': 'MAME',
    'ARCADE': 'FBNeo - Arcade Games',
    'DC': 'Sega - Dreamcast',
    'N64': 'Nintendo - Nintendo 64',
    'NGP': 'SNK - Neo Geo Pocket',
    'PCE': 'NEC - PC Engine - TurboGrafx 16',
    'WSC': 'Bandai - WonderSwan Color',
};

class DetailsCollection extends Collection {
    
    async fetch(url) {
        let pageUrl = new PageURL(url);
        let doc = await super.fetch(url);

        let info_data = this.info_data;
        let game_item = doc.querySelector('.game_item');
        let cover = game_item.querySelector('.atc img').attr('src');
        let list = game_item.querySelectorAll('dt');
        game_item.title = list[0].querySelector('.x_h2').text;
        let type = 'Nintendo - Game Boy Advance';
        let subtitle = [];
        for (let i = 1, t = list.length - 1; i < t; ++i) {
            let text = list[i].text.trim();
            subtitle.push(text);
            let idx = text.indexOf(sysType);
            if (idx >= 0) {
                let typestr = text.substr(idx + sysType.length);
                console.log('typestr ' + typestr);
                type = typeDB[typestr];
            }
        }
        info_data.subtitle = subtitle.join('\n');
        info_data.summary = doc.querySelector('#article_content').text.trim();
        let imgs = [];
        for (let img of doc.querySelectorAll('.ad-thumb-list > li > a')) {
            imgs.push(img.attr('href'));
        }
        console.log('type ' + type);
        info_data.data = {
            type: type,
            images: imgs,
            cover: cover
        };

        let items = [];
        doc = await super.fetch(doc.querySelector('.download-button').attr('href'));
        let nodes = doc.querySelectorAll('.ul_Address li');
        for (let node of nodes) {
            let link = node.querySelector('a');
            let item = glib.DataItem.new();
            item.title = link.text;
            item.link = link.attr('href');
            item.data = {
                type: node.attr('class') === 'ico_down_baidu' ? 'webview':'direct'
            };
            items.push(item);
        }

        return items;
    }

    reload(_, cb) {
        this.fetch(this.url).then((results)=>{
            this.setData(results);
            cb.apply(null);
        }).catch(function(err) {
            console.log(err.message + "\n" + err.stack);
            if (err instanceof Error) 
                err = glib.Error.new(305, err.message);
            cb.apply(err);
        });
        return true;
    }
}

module.exports = function(item) {
    return DetailsCollection.new(item);
};